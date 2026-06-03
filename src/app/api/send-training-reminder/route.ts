import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

// Maps source_type / breakdown keys to human-readable module names and values
const MODULE_LABELS: Record<string, { label: string; value: number; tip: string }> = {
  interview_transcripts: {
    label: 'Interview Transcripts',
    value: 20,
    tip: 'Upload a transcript from any past interview. It takes 5 minutes and adds 20% to your score.',
  },
  recruiter_feedback: {
    label: 'Recruiter & Coach Feedback',
    value: 15,
    tip: 'Search your inbox for post-interview feedback emails and paste them in.',
  },
  real_interview_answers: {
    label: 'Real Interview Answers',
    value: 15,
    tip: 'Record one answer to "Tell me about yourself." It takes 3 minutes and adds 15% to your score.',
  },
  recruiter_challenge: {
    label: 'Recruiter Challenge',
    value: 10,
    tip: 'Answer the uncomfortable questions recruiters actually ask. 10 minutes, 10% added.',
  },
  objection_handling: {
    label: 'Objection Handling',
    value: 10,
    tip: 'Show your AI how you handle pushback. Critical for sales and CS roles.',
  },
};

function buildWelcomeHtml(name: string, score: number, topMissing: string[]): string {
  const moduleItems = topMissing
    .map(key => {
      const m = MODULE_LABELS[key];
      return m
        ? `<li style="margin-bottom:12px"><strong>${m.label}</strong> (+${m.value}%) — ${m.tip}</li>`
        : '';
    })
    .join('');

  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
  <h2 style="margin-bottom:4px">Your AI is ready to learn, ${name}.</h2>
  <p style="color:#555;margin-top:0">Current Evidence Quality Score: <strong>${score}%</strong></p>
  <p>Your AI profile has been created. Now it needs evidence — not forms, but real answers, real stories, and real interview data.</p>
  <h3 style="margin-bottom:8px">Highest-value modules to complete first:</h3>
  <ul style="padding-left:20px">${moduleItems}</ul>
  <p><a href="https://interviewmind.one/dashboard/candidate" style="background:#4060d0;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Continue training →</a></p>
  <p style="color:#999;font-size:12px;margin-top:24px">InterviewMind · You're receiving this because you registered as a candidate.</p>
</div>`;
}

function buildReminderHtml(name: string, score: number, topMissingKey: string): string {
  const m = MODULE_LABELS[topMissingKey];
  const tip = m?.tip ?? 'Complete your highest-value missing module.';
  const label = m?.label ?? 'training module';

  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
  <h2>Your AI still hasn't seen a real interview, ${name}.</h2>
  <p style="color:#555">Evidence Quality Score: <strong>${score}%</strong></p>
  <p>The highest-value thing you're missing: <strong>${label}</strong>.</p>
  <p style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:3px solid #4060d0">${tip}</p>
  <p><a href="https://interviewmind.one/dashboard/candidate" style="background:#4060d0;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Complete it now →</a></p>
  <p style="color:#999;font-size:12px;margin-top:24px">InterviewMind · This is your one follow-up reminder.</p>
</div>`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      type: 'welcome' | 'reminder';
      to: string;
      name: string;
      score: number;
      missingModules: string[];
    };

    if (!body.type || !body.to || !body.name) {
      return NextResponse.json({ error: 'type, to, and name are required' }, { status: 400 });
    }

    const resend = getResendClient();

    let subject: string;
    let html: string;

    if (body.type === 'welcome') {
      subject = 'Your AI is ready to learn';
      html = buildWelcomeHtml(body.name, body.score, body.missingModules.slice(0, 3));
    } else {
      subject = "Your AI still hasn't seen a real interview";
      html = buildReminderHtml(body.name, body.score, body.missingModules[0] ?? 'interview_transcripts');
    }

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: body.to,
      subject,
      html,
    });

    if (error) {
      console.error('[send-training-reminder]', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (err) {
    console.error('[send-training-reminder]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
