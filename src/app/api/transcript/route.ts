import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AnthropicMessage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .select('recruiter_name, company, role, created_at, messages')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages: AnthropicMessage[] = data.messages || [];

    const header = [
      '# InterviewMind — Conversation Transcript',
      '',
      `**Date:** ${new Date(data.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      data.recruiter_name ? `**Recruiter:** ${data.recruiter_name}` : null,
      data.company ? `**Company:** ${data.company}` : null,
      data.role ? `**Role:** ${data.role}` : null,
      '',
      '---',
      '',
    ]
      .filter(Boolean)
      .join('\n');

    const body = messages
      .map((msg) => {
        const speaker = msg.role === 'user' ? '**Recruiter**' : '**Pablo**';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    const transcript = header + body;

    return new Response(transcript, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="interviewmind-${sessionId.slice(0, 8)}.md"`,
      },
    });
  } catch (error) {
    console.error('Transcript error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
