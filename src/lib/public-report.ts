import { createServerSupabaseClient } from '@/lib/supabase';
import { generateReport } from '@/lib/report';
import { sendCandidateReportEmail, type VisitorContext } from '@/lib/candidate-email';
import { sendFollowUpEmail } from '@/lib/followup-email';

// Orchestrates the post-conversation report for a PUBLIC session.
// Safe to call from multiple racing triggers (End button, sendBeacon, sweep) — the
// report_sent_at claim is atomic, so exactly one caller ever sends.

const MIN_RECRUITER_MESSAGES = 4;
const MAX_REPORTS_PER_PROFILE_24H = 10;
const MAX_ATTEMPTS = 3;

type Msg = { role: string; content: string };

export async function maybeSendReports(sessionId: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, candidate_id, messages, report_sent_at, report_attempts, recruiter_name, recruiter_role, recruiter_company, recruiter_email')
    .eq('id', sessionId)
    .single();

  if (!session || !session.candidate_id) return;
  if (session.report_sent_at) return;                       // already handled
  if ((session.report_attempts ?? 0) >= MAX_ATTEMPTS) return; // gave up earlier

  const messages = (session.messages ?? []) as Msg[];
  const recruiterMsgCount = messages.filter(m => m.role === 'user').length;
  if (recruiterMsgCount < MIN_RECRUITER_MESSAGES) return;   // drive-by — no email, no Haiku

  // Per-profile cap: ≤10 reports / 24h.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('candidate_id', session.candidate_id)
    .gte('report_sent_at', since);
  if ((count ?? 0) >= MAX_REPORTS_PER_PROFILE_24H) return;

  // ── Atomic claim — report_sent_at is a LOCK, not a receipt ──────────────────
  const { data: claimed } = await supabase
    .from('sessions')
    .update({ report_sent_at: new Date().toISOString() })
    .eq('id', sessionId)
    .is('report_sent_at', null)
    .select('id');
  if (!claimed || claimed.length === 0) return;              // another process owns it

  const rollback = async () => {
    await supabase
      .from('sessions')
      .update({ report_sent_at: null, report_attempts: (session.report_attempts ?? 0) + 1 })
      .eq('id', sessionId);
  };

  // Resolve candidate identity + recipient.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, slug, notification_email, notify_on_session')
    .eq('id', session.candidate_id)
    .single();
  if (!profile) { await rollback(); return; }

  const visitor: VisitorContext = {
    name: session.recruiter_name ?? null,
    role: session.recruiter_role ?? null,
    company: session.recruiter_company ?? null,
  };

  // ── Generate once (Haiku); rollback on failure ─────────────────────────────
  let report;
  try {
    report = await generateReport({
      messages,
      recruiterName: visitor.name,
      company: visitor.company,
      candidateName: profile.full_name,
    });
  } catch (err) {
    console.error('[public-report] generateReport failed:', err);
    await rollback();
    return;
  }

  // ── Candidate report (primary). Failure here rolls back for retry. ──────────
  if (profile.notify_on_session !== false) {
    let candidateEmail = profile.notification_email ?? null;
    if (!candidateEmail) {
      const { data: userRes } = await supabase.auth.admin.getUserById(session.candidate_id);
      candidateEmail = userRes.user?.email ?? null;
    }
    if (candidateEmail) {
      try {
        await sendCandidateReportEmail({ to: candidateEmail, report, visitor, sessionId });
      } catch (err) {
        console.error('[public-report] candidate email failed:', err);
        await rollback();
        return;
      }
    }
  }

  // ── Recruiter copy (secondary). Failure here does NOT rollback — the candidate
  //    report already went out, and rolling back would double-send it. ─────────
  if (session.recruiter_email) {
    try {
      await sendFollowUpEmail({
        to: session.recruiter_email,
        transcript: '',
        messages,
        recruiterName: visitor.name,
        jobTitle: visitor.role,
        companyName: visitor.company,
        candidateName: profile.full_name,
        candidateSlug: profile.slug,
        sessionId,
      });
    } catch (err) {
      console.error('[public-report] recruiter copy failed (non-fatal):', err);
    }
  }
}
