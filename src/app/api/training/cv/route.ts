import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';
import type Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const EXTRACTION_PROMPT = `Extract structured data from this CV. Return only valid JSON with no markdown, no explanation.

Schema:
{
  "full_name": string,
  "current_role": string,
  "years_experience": number,
  "skills": string[],
  "languages": string[],
  "work_history": [{"company": string, "role": string, "start_date": string, "end_date": string, "description": string}],
  "education": [{"institution": string, "degree": string, "year": string}]
}`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const isPdf  = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt  = file.type === 'text/plain'      || file.name.toLowerCase().endsWith('.txt');
    const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');

    if (!isPdf && !isTxt && !isDocx) {
      return NextResponse.json({ error: 'Only PDF or TXT files are accepted' }, { status: 400 });
    }

    // DOCX is binary — file.text() returns garbled data
    if (isDocx) {
      return NextResponse.json(
        { error: 'DOCX is not supported. Please save your CV as PDF or TXT and re-upload.' },
        { status: 400 }
      );
    }

    const anthropic = getAnthropicClient();
    let raw = '';

    if (isPdf) {
      // Send PDF as base64 using Claude's native document block
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const content: Anthropic.ContentBlockParam[] = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as Anthropic.ContentBlockParam,
        { type: 'text', text: EXTRACTION_PROMPT },
      ];

      const message = await anthropic.messages.create({
        model: CLAUDE_FALLBACK_MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content }],
      });

      raw = message.content[0].type === 'text' ? message.content[0].text : '';
    } else {
      // TXT — plain text extraction
      const text = await file.text();
      if (!text.trim()) {
        return NextResponse.json({ error: 'File appears to be empty.' }, { status: 400 });
      }

      const message = await anthropic.messages.create({
        model: CLAUDE_FALLBACK_MODEL,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nCV text:\n${text.slice(0, 8000)}`,
        }],
      });

      raw = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    // Strip markdown code fences if Claude wrapped the JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let cvData: Record<string, unknown>;
    try {
      cvData = JSON.parse(cleaned);
    } catch {
      console.error('[training/cv] Claude response was not valid JSON:', raw.slice(0, 200));
      return NextResponse.json({ error: 'Failed to parse CV data. Please try again.' }, { status: 500 });
    }

    const { error } = await supabase
      .from('candidate_profiles')
      .upsert(
        { candidate_id: user.id, cv_data: cvData, updated_at: new Date().toISOString() },
        { onConflict: 'candidate_id' }
      );

    if (error) {
      console.error('[training/cv] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save CV data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cvData });
  } catch (err) {
    console.error('[training/cv]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('cv_data, updated_at')
      .eq('candidate_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch CV data' }, { status: 500 });
    }

    return NextResponse.json({ cvData: data?.cv_data ?? null });
  } catch (err) {
    console.error('[training/cv GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
