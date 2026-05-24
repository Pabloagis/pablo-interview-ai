/**
 * One-shot script — simulates all emails sent in a full InterviewMind session.
 *
 * Email 1 → ktapnchispn@gmail.com  (recruiter path: "Yes, send insights")
 * Email 2 → pabloagisburgos@gmail.com  (exit-notify path: tab closed without clicking Insights)
 *
 * Run: npx tsx -r tsconfig-paths/register scripts/send-test-emails.ts
 */

import { createClient } from '@supabase/supabase-js';
import { sendFollowUpEmail } from '../src/lib/followup-email';

const RECRUITER_EMAIL = 'ktapnchispn@gmail.com';
const PABLO_EMAIL     = 'pabloagisburgos@gmail.com';

const SAMPLE_TRANSCRIPT = `Recruiter: Hi Pablo, thanks for joining. I'm Alex from Mews — we're hiring a Customer Success Manager focused on hotel clients across Southern Europe.

Pablo: Great to meet you Alex. The role sounds like a natural fit — I've spent the past several years at the intersection of hotel operations and SaaS technology, most recently at HubOS where I led end-to-end implementations for hotel clients from contract signature through adoption.

Recruiter: Tell me specifically what you did at HubOS.

Pablo: At HubOS I was responsible for onboarding hotel clients — mapping their existing workflows across front office, housekeeping, and maintenance, then configuring the platform to match their operational reality. The tricky part was always change management: getting the team to actually use the system rather than just having it installed. I built a structured onboarding methodology that shortened time-to-adoption meaningfully. Before that I spent 2.5 years at Soho House in London using Salesforce daily for member management, which gave me a solid CRM foundation on the client side.

Recruiter: How do you handle clients who resist change?

Pablo: From my experience, resistance usually comes down to trust and clarity — not the technology itself. I'd start by sitting with the front office team, understanding their pain points with the old system, and showing them how the new one solved those specific problems. I make a point of involving operational staff early in the rollout, not as an afterthought. People adopt tools they helped shape.

Recruiter: What's your experience with the Southern European market?

Pablo: I'm Spanish — native Spanish and Galician, fluent English from six years in London, advanced Italian, and working-level Portuguese. That covers the core markets you mentioned directly. I understand the hospitality culture in Spain and Italy particularly well, having worked in and implemented for properties in those markets. The operational norms differ meaningfully from Northern Europe and I think that context matters a lot when onboarding local teams.

Recruiter: Where do you see yourself in 3 years?

Pablo: I want to grow into a strategic Customer Success role — managing a portfolio of enterprise accounts, contributing to product feedback loops, and eventually moving toward commercial leadership. I'm not running away from operations; I'm leveraging it as a credibility advantage in conversations with hotel GMs and operations directors. That's harder to replicate from a pure sales background.

Recruiter: Great, really helpful. We'll be in touch.

Pablo: Looking forward to it, Alex. Thanks for the conversation.`;

const MESSAGES = SAMPLE_TRANSCRIPT
  .split('\n\n')
  .filter(l => l.trim())
  .map(line => ({
    role: line.startsWith('Pablo:') ? 'assistant' as const : 'user' as const,
    content: line.replace(/^(Pablo|Recruiter):\s*/, ''),
  }));

async function main() {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE env vars');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create a real session so the /email-preview link resolves correctly
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      recruiter_name: 'Alex',
      company: 'Mews',
      role: 'Customer Success Manager',
      email: RECRUITER_EMAIL,
      consent_to_email: true,
      messages: MESSAGES,
    })
    .select('id')
    .single();

  if (sessionErr || !session) throw new Error(`Session create failed: ${sessionErr?.message}`);
  console.log(`Session created: ${session.id}`);

  // ── Email 1: recruiter path (send-followup) ────────────────────────────────
  // bcc: [] because we send Pablo separately below (matches exit-notify behaviour)
  console.log(`\nSending Email 1 → ${RECRUITER_EMAIL} (recruiter path)…`);
  const { emailId: id1, html } = await sendFollowUpEmail({
    to: RECRUITER_EMAIL,
    transcript: SAMPLE_TRANSCRIPT,
    messages: MESSAGES,
    recruiterName: 'Alex',
    jobTitle: 'Customer Success Manager',
    companyName: 'Mews',
    sessionId: session.id,
    recruiterEmail: RECRUITER_EMAIL,
    bcc: [],
  });
  console.log(`  ✓ emailId: ${id1}`);

  // Persist html so the /email-preview link in the email actually works
  await supabase
    .from('sessions')
    .update({ email_sent_at: new Date().toISOString(), email_html: html })
    .eq('id', session.id);

  // ── Email 2: Pablo's notification (exit-notify path) ─────────────────────
  console.log(`\nSending Email 2 → ${PABLO_EMAIL} (exit-notify path)…`);
  const { emailId: id2 } = await sendFollowUpEmail({
    to: PABLO_EMAIL,
    transcript: SAMPLE_TRANSCRIPT,
    messages: MESSAGES,
    recruiterName: 'Alex',
    jobTitle: 'Customer Success Manager',
    companyName: 'Mews',
    sessionId: session.id,
    recruiterEmail: RECRUITER_EMAIL,
    bcc: [],
  });
  console.log(`  ✓ emailId: ${id2}`);

  console.log(`\nDone. Preview: https://interviewmind.one/email-preview?id=${session.id}`);
}

main().catch(err => { console.error(err); process.exit(1); });
