import { NextResponse } from 'next/server';
import { sendFollowUpEmail } from '@/lib/followup-email';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SAMPLE_TRANSCRIPT = `Recruiter: Hi Pablo, thanks for joining. I'm Sarah from TravelTech SaaS, we're hiring for a Customer Success Manager role focused on hotel clients.

Pablo: Great to meet you Sarah. The role sounds right up my alley — I've spent the last several years at the intersection of hotel operations and technology, most recently at HubOS where I led end-to-end software implementations for hotel clients.

Recruiter: Tell me more about what you did at HubOS specifically.

Pablo: At HubOS I was responsible for onboarding hotel clients from contract signature through go-live and beyond. That meant mapping their existing workflows — front office, housekeeping, maintenance — and configuring the platform to match their operational reality. The tricky part was always change management: getting the team to actually use the system, not just have it installed. I developed a structured onboarding methodology that reduced time-to-adoption significantly.

Recruiter: How do you handle clients who resist the change?

Pablo: From my experience, resistance usually isn't about the technology — it's about trust and clarity. I'd start by sitting with the front office team, understanding their pain points with the old system, and showing them specifically how the new one solved those problems. At Soho House, where I used Salesforce daily for member management, I saw first-hand how adoption dropped when people didn't feel heard during rollout. So I make sure to involve operational staff early.

Recruiter: What's your experience with enterprise hotel groups versus independent properties?

Pablo: Both, though in different capacities. At Accor — Ibis and Novotel — I was part of large-scale operations with standardized systems like Opera PMS. At Soho House, it was more boutique but technically complex with Salesforce and custom integrations. And at HubOS, our clients ranged from independent boutique hotels to small regional chains. Each requires a different approach: enterprise clients want process and documentation, independent properties want flexibility and a trusted advisor.

Recruiter: Where do you see yourself in 3 years?

Pablo: I want to grow into a strategic Customer Success role — managing a portfolio of enterprise accounts, contributing to product feedback loops, maybe eventually moving toward a commercial leadership position. I'm not running away from operations — I'm leveraging it as a credibility advantage in conversations with hotel GMs and operations directors.

Recruiter: Great, that's really helpful. We'll be in touch.`;

export async function POST() {
  try {
    const messages = SAMPLE_TRANSCRIPT
      .split('\n\n')
      .filter((l) => l.trim())
      .map((line) => ({
        role: line.startsWith('Pablo:') ? 'assistant' : 'user',
        content: line.replace(/^(Pablo|Recruiter):\s*/, ''),
      }));

    // Create a real session so the preview URL resolves correctly
    const supabase = createServerSupabaseClient();
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        recruiter_name: 'Sarah',
        company: 'TravelTech SaaS',
        role: 'Customer Success Manager',
        email: 'pabloagisburgos@gmail.com',
        consent_to_email: true,
        messages,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      throw new Error(`Failed to create test session: ${sessionError?.message}`);
    }

    const { emailId, html } = await sendFollowUpEmail({
      to: 'pabloagisburgos@gmail.com',
      transcript: SAMPLE_TRANSCRIPT,
      messages,
      jobTitle: 'Customer Success Manager',
      companyName: 'TravelTech SaaS',
      sessionId: session.id,
    });

    await supabase
      .from('sessions')
      .update({ email_sent_at: new Date().toISOString(), email_html: html })
      .eq('id', session.id);

    return NextResponse.json({ success: true, emailId, previewId: session.id });
  } catch (error) {
    console.error('[test-followup] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
