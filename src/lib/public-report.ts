import { createServerSupabaseClient } from '@/lib/supabase';
import { generateReport } from '@/lib/report';
import { sendCandidateReportEmail, type VisitorContext } from '@/lib/candidate-email';
import { sendFollowUpEmail } from '@/lib/followup-email';

// Orchestrates the post-conversation report for a PUBLIC session.
// Safe to call from multiple racing triggers (End button, sendBeacon, sweep) — each
// email type has its own atomic claim column so exactly one caller ever sends each.
//
// candidate email  → gated by report_sent_at          (set at claim time)
// recruiter email  → gated by recruiter_email_sent_at  (set at claim time)
//
// The two gates are independent: a beacon firing without recruiter_email does not
// block the recruiter email from being sent when the user later submits the modal.

const MIN_RECRUITER_MESSAGES = 4;
const MAX_REPORTS_PER_PROFILE_24H = 10;
const MAX_ATTEMPTS = 3;

type Msg = { role: string; content: string };

export async function maybeSendReports(sessionId: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, candidate_id, messages, report_sent_at, report_attempts, recruiter_name, recruiter_role, recruiter_company, recruiter_email, recruiter_email_sent_at')
    .eq('id', sessionId)
    .single();

  if (!session || !session.candidate_id) return;
  if ((session.report_attempts ?? 0) >= MAX_ATTEMPTS) return;

  const messages = (session.messages ?? []) as Msg[];
  const recruiterMsgCount = messages.filter(m => m.role === 'user').length;
  if (recruiterMsgCount < MIN_RECRUITER_MESSAGES) return;

  const needsCandidateEmail = !session.report_sent_at;
  const needsRecruiterEmail = !!session.recruiter_email && !session.recruiter_email_sent_at;
  if (!needsCandidateEmail && !needsRecruiterEmail) return;

  // Per-profile cap: ≤10 reports / 24h (applies only to candidate email).
  if (needsCandidateEmail) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('candidate_id', session.candidate_id)
      .gte('report_sent_at', since);
    if ((count ?? 0) >= MAX_REPORTS_PER_PROFILE_24H) return;
  }

  // Resolve candidate identity + recipient.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, slug, notification_email, notify_on_session')
    .eq('id', session.candidate_id)
    .single();
  if (!profile) {
    await supabase
      .from('sessions')
      .update({ report_attempts: (session.report_attempts ?? 0) + 1 })
      .eq('id', sessionId);
    return;
  }

  const visitor: VisitorContext = {
    name: session.recruiter_name ?? null,
    role: session.recruiter_role ?? null,
    company: session.recruiter_company ?? null,
  };

  // ── Candidate report (primary) ─────────────────────────────────────────────
  if (needsCandidateEmail) {
    // Atomic claim — only one concurrent caller proceeds.
    const { data: claimed } = await supabase
      .from('sessions')
      .update({ report_sent_at: new Date().toISOString() })
      .eq('id', sessionId)
      .is('report_sent_at', null)
      .select('id');

    if (claimed && claimed.length > 0) {
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
        await supabase
          .from('sessions')
          .update({ report_sent_at: null, report_attempts: (session.report_attempts ?? 0) + 1 })
          .eq('id', sessionId);
        return;
      }

      if (profile.notify_on_session !== false) {
        let candidateEmail = profile.notification_email ?? null;
        if (!candidateEmail) {
          const { data: userRes } = await supabase.auth.admin.getUserById(session.candidate_id);
          candidateEmail = userRes.user?.email ?? null;
        }
        if (candidateEmail) {
          try {
            await sendCandidateReportEmail({
              to: candidateEmail,
              report,
              visitor,
              sessionId,
              messages,
              candidateName: profile.full_name,
              candidateSlug: profile.slug,
            });
          } catch (err) {
            console.error('[public-report] candidate email failed:', err);
            await supabase
              .from('sessions')
              .update({ report_sent_at: null, report_attempts: (session.report_attempts ?? 0) + 1 })
              .eq('id', sessionId);
            return;
          }
        }
      }
    }
  }

  // ── Recruiter copy (secondary) ─────────────────────────────────────────────
  // Independent gate: a beacon that fired without recruiter_email does not block
  // this path. Failure here is non-fatal — the candidate report already went out.
  if (needsRecruiterEmail && session.recruiter_email) {
    // Atomic claim — prevents double-send if the modal submit races with a beacon.
    const { data: recruiterClaimed } = await supabase
      .from('sessions')
      .update({ recruiter_email_sent_at: new Date().toISOString() })
      .eq('id', sessionId)
      .is('recruiter_email_sent_at', null)
      .select('id');

    if (recruiterClaimed && recruiterClaimed.length > 0) {
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
        console.error('[public-report] recruiter email failed:', err);
        // Reset the claim so the next trigger can retry.
        await supabase
          .from('sessions')
          .update({ recruiter_email_sent_at: null })
          .eq('id', sessionId);
      }
    }
  }
}
