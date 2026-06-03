import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

const VALID_SOURCE_TYPES = [
  'interview_transcript',
  'recruiter_feedback',
  'professional_artifact',
  'ai_conversation',
  'free_training',
];

const VALID_ARTIFACT_TYPES = [
  'post', 'project', 'cover_letter', 'presentation', 'application', 'other',
];

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('candidate_raw_data')
      .select('*')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error('[training/raw-data GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = req.headers.get('content-type') ?? '';

    let source_type: string;
    let artifact_type: string | null = null;
    let raw_text: string | null = null;
    let file_name: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      source_type = formData.get('source_type') as string;
      artifact_type = (formData.get('artifact_type') as string) || null;

      const file = formData.get('file') as File | null;
      const pastedText = formData.get('raw_text') as string | null;

      if (file) {
        raw_text = await file.text();
        file_name = file.name;
      } else if (pastedText) {
        raw_text = pastedText;
      }
    } else {
      const body = await req.json() as {
        source_type: string;
        artifact_type?: string;
        raw_text?: string;
        file_name?: string;
      };
      source_type = body.source_type;
      artifact_type = body.artifact_type ?? null;
      raw_text = body.raw_text ?? null;
      file_name = body.file_name ?? null;
    }

    if (!source_type || !VALID_SOURCE_TYPES.includes(source_type)) {
      return NextResponse.json({ error: 'Invalid or missing source_type' }, { status: 400 });
    }
    if (artifact_type && !VALID_ARTIFACT_TYPES.includes(artifact_type)) {
      return NextResponse.json({ error: 'Invalid artifact_type' }, { status: 400 });
    }
    if (!raw_text?.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('candidate_raw_data')
      .insert({
        candidate_id: user.id,
        source_type,
        artifact_type,
        raw_text: raw_text.trim(),
        file_name,
      })
      .select()
      .single();

    if (error) {
      console.error('[training/raw-data POST]', error);
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    console.error('[training/raw-data POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabase
      .from('candidate_raw_data')
      .delete()
      .eq('id', id)
      .eq('candidate_id', user.id);

    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[training/raw-data DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
