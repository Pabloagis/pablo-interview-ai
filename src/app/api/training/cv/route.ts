import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, DOCX, or TXT files are accepted' }, { status: 400 });
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
    }

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_FALLBACK_MODEL,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Extract structured data from this CV. Return only valid JSON with no markdown, no explanation.

Schema:
{
  "full_name": string,
  "current_role": string,
  "years_experience": number,
  "skills": string[],
  "languages": string[],
  "work_history": [{"company": string, "role": string, "start_date": string, "end_date": string, "description": string}],
  "education": [{"institution": string, "degree": string, "year": string}]
}

CV text:
${text.slice(0, 8000)}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    let cvData: Record<string, unknown>;
    try {
      cvData = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Failed to parse CV data' }, { status: 500 });
    }

    const { error } = await supabase
      .from('candidate_profiles')
      .upsert({ candidate_id: user.id, cv_data: cvData, updated_at: new Date().toISOString() }, { onConflict: 'candidate_id' });

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
