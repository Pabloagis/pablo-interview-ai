import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/lib/supabase';
import { SessionCreateRequest, SessionCreateResponse } from '@/lib/types';
import { isValidEmail } from '@/lib/utils';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';

function notifyNewSession(
  name: string | null,
  email: string,
  company: string | null,
  role: string | null
): void {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const label = name?.trim() || 'Someone (no name)';
  const from = [role, company].filter(Boolean).join(' at ');
  resend.emails.send({
    from: 'InterviewMind <noreply@interviewmind.one>',
    to: [PABLO_EMAIL],
    subject: `👋 ${label}${from ? ` — ${from}` : ''} just started an interview`,
    html: `<table style="font-family:Arial,sans-serif;font-size:15px;color:#475569;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Name</td><td style="color:#0f172a;font-weight:600;">${label}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Email</td><td><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>
      ${company ? `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Company</td><td style="color:#0f172a;">${company}</td></tr>` : ''}
      ${role ? `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Role</td><td style="color:#0f172a;">${role}</td></tr>` : ''}
    </table>`,
  }).catch(() => {});
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: SessionCreateRequest = await request.json();
    const { recruiterName, company, role, email, consentToEmail } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        recruiter_name: recruiterName || null,
        company: company || null,
        role: role || null,
        email: email,
        consent_to_email: consentToEmail ?? false,
        messages: [],
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    notifyNewSession(recruiterName || null, email, company || null, role || null);

    const response: SessionCreateResponse = {
      sessionId: data.id,
      createdAt: data.created_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Session creation error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
