-- ============================================================
-- InterviewMind v3 — Pablo Agis Burgos Candidate Seed
-- ============================================================
-- Seeds Pablo as a full candidate so he appears in the
-- recruiter directory and the dynamic prompt is used in chat.
--
-- HOW TO RUN
-- ──────────
-- Paste this entire file into the Supabase SQL Editor and run.
-- It is fully idempotent — safe to re-run at any time.
--
-- The script will:
--   1. Find or create Pablo's auth.users entry
--   2. Upsert all candidate tables from verified data in prompts.ts
--      and stories-knowledge.ts
--
-- Expected confidence score after seeding: ~62 / 100 (green ✓)
--   CV          : 10
--   Stories (5) : 25
--   Real Q (6/7): 13
--   Challenge   : 8  (4/5)
--   Objections  : 6  (3/5)
-- ============================================================

DO $$
DECLARE
  pablo_id UUID;
BEGIN

  -- ── Step 1: Find or create auth user ────────────────────────
  SELECT id INTO pablo_id
    FROM auth.users
   WHERE email = 'pablo@interviewmind.one';

  IF pablo_id IS NULL THEN
    pablo_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id,
      email, encrypted_password,
      email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      aud, role
    ) VALUES (
      pablo_id,
      '00000000-0000-0000-0000-000000000000',
      'pablo@interviewmind.one',
      crypt('InterviewMind2026!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Pablo Agis Burgos"}'::jsonb,
      NOW(), NOW(),
      'authenticated', 'authenticated'
    );

    RAISE NOTICE 'Created auth user. pablo_id = %', pablo_id;
  ELSE
    RAISE NOTICE 'Found existing auth user. pablo_id = %', pablo_id;
  END IF;


  -- ── Step 2: profiles ─────────────────────────────────────────
  INSERT INTO profiles (id, role, full_name, career_goal)
  VALUES (
    pablo_id,
    'candidate',
    'Pablo Agis Burgos',
    '{"goals":["Move into a more commercial role","Win the interviews I already have","Build a stronger professional brand"],"other":"Targeting SDR/AE roles in hospitality tech — PMS, SaaS, OTA ecosystem. 7+ years hotel operations + HubOS implementation experience."}'
  )
  ON CONFLICT (id) DO UPDATE SET
    role        = 'candidate',
    full_name   = 'Pablo Agis Burgos',
    career_goal = EXCLUDED.career_goal;


  -- ── Step 3: candidate_profiles (cv_data) ────────────────────
  INSERT INTO candidate_profiles (candidate_id, cv_data, updated_at)
  VALUES (
    pablo_id,
    $cv${
      "full_name": "Pablo Agis Burgos",
      "current_role": "Software Implementation Specialist",
      "years_experience": 8,
      "skills": [
        "PMS Systems — Opera (7 yrs), FOLS, Mews, Ulyses Cloud, Protel",
        "SaaS Implementation & Client Onboarding",
        "Salesforce CRM — Service Cloud + Sales Cloud (2.5 yrs)",
        "Hospitality Operations & Front Office Management",
        "Client Training & Adoption",
        "Jira, Monday.com, Excel, Google Meet",
        "Stakeholder Management",
        "Multilingual Communication"
      ],
      "languages": [
        "Spanish — native",
        "Galician — native",
        "English — fluent (6 years London)",
        "Italian — advanced professional",
        "Portuguese — intermediate professional"
      ],
      "work_history": [
        {
          "company": "HubOS",
          "role": "Software Implementation Specialist",
          "start_date": "Early 2026",
          "end_date": "2026",
          "description": "End-to-end SaaS implementations for hotel clients. Designed onboarding plans per client, configured software to reflect each property's workflows, acted as main point of contact throughout, delivered training and documentation, managed multiple simultaneous implementations. Tools: Jira, Monday.com, Excel, Google Meet."
        },
        {
          "company": "Axel Hotel Barcelona",
          "role": "Front Office Manager",
          "start_date": "March 2025",
          "end_date": "May 2025",
          "description": "Led front office operations, guest satisfaction and revenue management at a 4-star Barcelona property. Short-term role while positioning into hospitality tech."
        },
        {
          "company": "Soho House / Redchurch Townhouse",
          "role": "Senior Receptionist",
          "start_date": "October 2021",
          "end_date": "February 2024",
          "description": "Senior front-of-house at Soho House London over 2.5 years. Daily use of Salesforce CRM (Service Cloud + Sales Cloud) for member management and case resolution. Built continuity across member visits, coordinated with other Soho Houses globally."
        },
        {
          "company": "Accor / Ibis City Shoreditch",
          "role": "Hotel Team Leader & Duty Manager",
          "start_date": "November 2019",
          "end_date": "July 2021",
          "description": "Team leadership and duty management. Went through FOLS PMS migration as operational team member — hands-on experience with what makes or breaks PMS adoption in practice."
        },
        {
          "company": "Accor / Novotel Tower Bridge",
          "role": "Front Office Team Member",
          "start_date": "November 2018",
          "end_date": "November 2019",
          "description": "Front office operations and guest services. Began building Opera PMS expertise across Accor properties."
        }
      ],
      "education": [
        {
          "institution": "Centro Superior de Hosteleria de Galicia",
          "degree": "Hospitality Business Administration",
          "year": "2012-2016"
        }
      ]
    }$cv$::jsonb,
    NOW()
  )
  ON CONFLICT (candidate_id) DO UPDATE SET
    cv_data    = EXCLUDED.cv_data,
    updated_at = NOW();


  -- ── Step 4: candidate_stories ────────────────────────────────
  -- Delete first for full idempotency, then re-insert.
  DELETE FROM candidate_stories WHERE candidate_id = pablo_id;

  INSERT INTO candidate_stories
    (candidate_id, story_type, situation, task, action, result)
  VALUES

  -- 1. biggest_success — Vienna AI Feedback (HubOS, Gran Hotel Vienna)
  (pablo_id, 'biggest_success',
   'During my time at HubOS as Implementation Specialist, I was working on the Gran Hotel Vienna onboarding — a property transitioning from IHG to Eurostars brand. The front office team was manually aggregating guest feedback from email, calls, and forms into a spreadsheet every morning. The process was slow and urgent issues were sometimes missed during peak periods.',
   'Reduce the manual sorting work and help the team identify urgent guest issues faster, without disrupting their existing workflow.',
   'I explored whether simple AI categorisation tools could help with sorting and prioritisation. Tested an approach with sample data, iterated on the output, and worked directly with the team to review accuracy before we relied on it. The focus was on training them to use the tool confidently — not just deploying it.',
   'Reduced the amount of manual sorting significantly. The team could identify urgent issues faster and freed up meaningful time for higher-value guest-facing work. The key learning: AI is only as useful as the workflow change it enables. The hard part is adoption, not the technology.'),

  -- 2. biggest_failure — Mews SDR interview that did not progress
  (pablo_id, 'biggest_failure',
   'In September and October 2025, I went through the interview process for a Business Development Representative role at Mews — one of the leading PMS companies. I made it to video interview stage, which I was genuinely excited about.',
   'Demonstrate fit for an SDR role in hospitality tech despite coming from an operational and implementation background rather than direct sales.',
   'I answered the interview questions based on my general experience and enthusiasm for the industry, without structuring my responses around specific situations, actions, and measurable outcomes. I relied on breadth of knowledge rather than depth of specific evidence.',
   'I did not advance. The feedback I received was direct and fair: my answers were too general. The interviewers were looking for structure and measurable results — STAR applied consistently. That feedback was a turning point in how I communicate my experience.'),

  -- 3. managing_change — FOLS PMS Migration (participant, not lead)
  (pablo_id, 'managing_change',
   'While working at Accor Hotels in London, the property went through a PMS migration from Opera to FOLS. This was a significant change for the entire front office team — a new system, new workflows, and a steep learning curve during an already demanding operational environment.',
   'Adapt to the new system as an operational team member and help colleagues through the transition where I could.',
   'I approached the migration as a learning opportunity rather than a disruption. Went through the system closely, asked questions during training, and made myself available to colleagues who were struggling. Observed carefully how adoption plays out in practice — where people resist, where they get stuck, and what actually helps.',
   'Came out with a deep, practical understanding of what makes or breaks a PMS rollout. Implementation success is not the go-live date — it is when staff use the system confidently in their daily work. That insight directly shaped how I approach client onboarding and training today.'),

  -- 4. commercial_example — HubOS end-to-end implementations
  (pablo_id, 'commercial_example',
   'Working as Software Implementation Specialist at HubOS, I was responsible for end-to-end implementations across hotel properties of different sizes and types. Each client had contracted specific modules — housekeeping, maintenance, quality audits — and came with their own existing workflows and resistance points.',
   'Design and deliver onboarding plans per client, configure the software to reflect each property''s actual workflows, and drive genuine adoption — not just compliance with a go-live date.',
   'Designed project onboarding plans tailored to each client''s contracted modules and operational reality. Ran requirements gathering sessions before touching configuration. Configured and calibrated the platform to reflect how their teams actually worked. Acted as the main point of contact throughout, managed timelines and expectations, delivered training, created documentation. Used Jira, Monday.com, Excel, and Google Meet across all implementations.',
   'Achieved real adoption — staff using the system in their daily work, not just during the training window. Built strong client relationships across multiple property types. The key learning: implementation is consultative. Understanding the specific pain before proposing solutions is what separates a meaningful rollout from a nominal go-live.'),

  -- 5. lesson_learned — Salesforce CRM at Soho House (2.5 years daily use)
  (pablo_id, 'lesson_learned',
   'During my 2.5 years as Senior Receptionist at Soho House / Redchurch Townhouse in London, Salesforce was the primary CRM platform for managing the member experience. This was daily, consistent use — not occasional.',
   'Use Salesforce to maintain rich context on members and resolve service cases — building continuity across visits and coordinating with other Soho House properties globally.',
   'Used Service Cloud daily to pull member profiles before arrival, update records with relevant context during and after stays, coordinate with other Soho Houses on member preferences and history. Also used Sales Cloud for member relationship management. Handled support cases when issues escalated to front office — documenting outcomes for member history.',
   'Built daily fluency over 2.5 years. Strong understanding of how CRM systems support relationship continuity and case management. The lesson that stayed with me: CRM is only as valuable as the discipline behind data entry and the culture of actually using the data to drive personalised service. A CRM full of stale records is just an expensive contact list.');


  -- ── Step 5: candidate_responses ─────────────────────────────
  DELETE FROM candidate_responses WHERE candidate_id = pablo_id;

  INSERT INTO candidate_responses (candidate_id, module, question, answer_text)
  VALUES

  -- real_interview (6 of 7 questions → ~13 pts)
  (pablo_id, 'real_interview', 'Tell me about yourself.',
   'Seven years in hotel operations — Accor, Soho House in London, then Front Office Manager in Barcelona — gave me something most people in hospitality tech don''t have: I''ve been the end user. I know what it feels like when a PMS goes down during peak check-in, when a new system launches and the training was insufficient, when a guest complaint falls through the cracks because the handover wasn''t working. At HubOS I moved to the other side — implementing software for hotel clients. What I enjoyed most wasn''t the configuration. It was the consultative part: understanding a client''s specific situation, finding the real pain, and helping them see how the product would change their day-to-day. That''s what I''m looking to do more of — earlier in the customer journey, in a commercial role.'),

  (pablo_id, 'real_interview', 'Why are you looking for a new role?',
   'The HubOS role confirmed the direction I wanted to move. Implementation work gave me direct exposure to the vendor side — how SaaS products are adopted, what makes a rollout stick versus fail, the consultative conversations that happen before go-live. What I realised is that I enjoy the front end of that relationship more than the delivery side. I want to be the person who helps a hotelier understand why this product matters for their specific operation — not the person they call when something isn''t working. So this isn''t a pivot out of a career that wasn''t working. It''s a deliberate step toward where I''ve been heading.'),

  (pablo_id, 'real_interview', 'Tell me about a time you failed.',
   'The Mews SDR process in late 2025. I got to video interview stage, which I was genuinely excited about. But I didn''t advance. The feedback was direct and fair: my answers were too general. I wasn''t structuring my experience around specific situations and measurable outcomes — I was describing breadth rather than depth. That hit me harder than rejection usually does because I knew the feedback was accurate. Since then I''ve been much more deliberate about telling stories properly — situation, what I was trying to solve, what I specifically did, and what actually changed. It''s a better way to communicate and it respects the interviewer''s time.'),

  (pablo_id, 'real_interview', 'What''s your biggest weakness?',
   'I can over-explain when I''m genuinely engaged with a topic — especially when it''s operational or technical. I get interested in the complexity and sometimes forget the person across from me needs the summary, not the full picture. I''ve gotten better at it, partly because client work at HubOS forced me to be concise — you''re often working with hotel managers who have two minutes between check-ins. But it''s still something I monitor, particularly in early conversations where I don''t yet know how much depth the other person wants.'),

  (pablo_id, 'real_interview', 'Where do you see yourself in three years?',
   'Carrying a territory as an Account Executive, probably focused on UK and Ireland or Southern Europe — markets where my language coverage and operational background are genuinely useful. The honest version: I see the path as SDR first, prove the commercial instincts, then AE. I''m not in a rush for a title — I''m in a rush to build the track record that makes the next step credible. Three years is enough time to do that properly.'),

  (pablo_id, 'real_interview', 'Why do you want to work in this industry?',
   'I''ve been in it for eight years — it''s not a question I have to answer intellectually. Hospitality is one of the few industries where technology still has a massive gap between what''s available and what''s actually being used well. Most hotels run on systems that haven''t changed meaningfully in fifteen years. The opportunity to help close that gap — to be the person who helps a GM or Head of Ops understand why a modern platform changes their daily reality — that''s genuinely motivating. I''m not coming in from outside. I know what I''m selling and I know who I''m selling it to.'),

  -- recruiter_challenge (4 of 5 → 8 pts)
  (pablo_id, 'recruiter_challenge', 'Your CV shows only a few months in SaaS. Why are you qualified for this role?',
   'The four months at HubOS were the formal SaaS role. But the context before that matters. Seven years using PMS systems, CRM platforms, and operational tools as a practitioner — daily, under real conditions, not in a demo environment. I''ve been on the receiving end of vendor implementations. I''ve trained staff on new systems. I''ve dealt with the adoption failures that happen when go-live doesn''t mean the team actually uses it. Most SDRs in hospitality tech have never stayed in a hotel. I''m applying from the other side of that conversation.'),

  (pablo_id, 'recruiter_challenge', 'Why should we hire you over someone with more direct experience?',
   'Depends what you mean by direct. If you mean someone who has carried quota in hospitality SaaS, I can''t compete on that. But if you mean someone who can speak credibly to the pain a hotel GM or Revenue Manager is actually feeling — not a rehearsed pitch, but genuine operational understanding — that''s harder to find. I''ve been the person making the buying decision from the hotel side. That context is either valuable in this role or it isn''t. I think it is.'),

  (pablo_id, 'recruiter_challenge', 'You''ve moved roles quite frequently. How do we know you''ll stay?',
   'The London years are straightforward — Accor to Soho House is a clear upward move, not instability. Soho House was 2.5 years. After returning to Spain in 2024, I was deliberate about finding the right next step rather than taking the first thing available. Axel was a short operational role while I positioned into tech — I''ve been transparent about that. HubOS was four months and confirmed the direction I wanted. What I''m looking for now is the role I stay in for three to four years and build a track record in. That hasn''t been my situation until now — and I think the pattern shows someone building toward something, not running away from things.'),

  (pablo_id, 'recruiter_challenge', 'Your background is operations, not sales. Why do you think you can sell?',
   'I''ve been doing consultative work my whole career — just without the title. Understanding what a client actually needs versus what they say they want, translating between what a system can do and what will change for the team on the floor, convincing a skeptical GM to trust a new workflow — that''s persuasion. It''s not cold calling, but it''s not a completely different skill set either. What I''m missing is the formal structure: pipeline management, qualification frameworks, the cadence of an SDR role. That''s learnable. The operational credibility and genuine understanding of the buyer side is harder to build from scratch.'),

  -- objection_handling (3 of 5 → 6 pts)
  (pablo_id, 'objection_handling', 'The client says your solution is too expensive.',
   'I''d want to understand what they''re comparing against — because that changes the answer completely. If they''re comparing against doing nothing, the question is what the current problem is actually costing them. If they''re comparing against a competitor, I want to understand what they think the competitor is offering that we''re not. ''Too expensive'' usually means one of three things: they don''t see the value clearly enough, they''re comparing to a cheaper alternative, or there''s a real budget constraint. Each needs a different response.'),

  (pablo_id, 'objection_handling', 'The GM refuses to change the current process.',
   'That''s not an unusual situation — most GMs have built their current process over years and are being asked to trust that a new system will be better. The first question I''d ask: what specifically are they worried about? Usually it''s one of three things — disruption during a busy period, staff who can''t adapt, or a previous bad experience with a change that didn''t stick. Understanding which one it is tells me whether this is a timing conversation, a training conversation, or a trust-building conversation.'),

  (pablo_id, 'objection_handling', 'The client is happy with their existing vendor.',
   'Happy is relative. I''d want to understand what ''happy'' means for them — is it that the system works and they''ve stopped thinking about it, or are they genuinely satisfied with what it does? In hotel tech, ''happy'' often means ''we''ve adapted to its limitations and stopped fighting them.'' That''s actually an opening, not a closed door. The question is whether now is the right moment to have that conversation.');


  -- ── Step 6: candidate_objections ────────────────────────────
  DELETE FROM candidate_objections WHERE candidate_id = pablo_id;

  INSERT INTO candidate_objections
    (candidate_id, type, concern, why, priority, linked_module, how_to_surface)
  VALUES

  -- Recruiter concerns (objections)
  (pablo_id, 'objection',
   'Short SaaS tenure — only 4 months at HubOS',
   'The CV shows one SaaS role of 4 months. Recruiters will question whether this is enough experience to credibly represent a SaaS product in a commercial conversation.',
   'high', 'recruiter_challenge', NULL),

  (pablo_id, 'objection',
   'No direct quota-carrying sales experience',
   'Has never held a formal SDR or AE role. Recruiters at SaaS companies hiring for commercial roles typically want evidence of pipeline management and quota performance.',
   'high', 'recruiter_challenge', NULL),

  (pablo_id, 'objection',
   'Employment gap May 2025 – Early 2026',
   'After Axel Hotel (May 2025), the next formal role was HubOS in early 2026. Recruiters may flag this as unexplained downtime.',
   'medium', 'real_interview', NULL),

  (pablo_id, 'objection',
   'Heavy operations background — limited technical depth',
   'Background is hotel operations and front office, not technical sales or SaaS architecture. Recruiters may question depth of product knowledge for a sales role.',
   'medium', 'recruiter_challenge', NULL),

  -- Hidden strengths
  (pablo_id, 'strength',
   'Opera PMS expertise (7 years across Accor and Soho House)',
   'Deep hands-on experience with the market-leading PMS is rare on the vendor/sales side. Gives authentic credibility in conversations with hotel operators.',
   NULL, NULL,
   'Lead with specific Opera use cases when talking to hotel tech companies — name the modules, the workflow, the pain points you lived with.'),

  (pablo_id, 'strength',
   'Multilingual — 5 languages including English, Spanish, Italian, Portuguese',
   'Covers UK, Spain, Italy, Portugal, and LATAM without headcount. Rare in hospitality tech sales where pan-European coverage matters.',
   NULL, NULL,
   'Mention early in any conversation about European or LATAM market expansion — it''s a concrete commercial differentiator, not just a personal attribute.'),

  (pablo_id, 'strength',
   'Salesforce CRM fluency — 2.5 years daily at Soho House',
   'Most SDR candidates need CRM ramp time. This candidate used Salesforce Service Cloud and Sales Cloud daily for 2.5 years in a real operational context.',
   NULL, NULL,
   'When asked about CRM tools, go specific: Service Cloud for member profiles and case resolution, Sales Cloud for relationship management. This shows practitioner fluency, not just familiarity.'),

  (pablo_id, 'strength',
   'Rare bridge between hotel operations and SaaS technology',
   'Has worked as both a hotel operator (end user of hospitality tech) and as a SaaS implementation specialist (vendor side). Few candidates in hospitality tech have genuine credibility on both sides of that conversation.',
   NULL, NULL,
   'Frame as: I understand the buyer because I was the buyer. Not as a pitch — as a concrete statement about what conversations you can have that most SDRs cannot.');


  -- ── Step 7: candidate_context ────────────────────────────────
  INSERT INTO candidate_context (candidate_id, context, last_updated)
  VALUES (
    pablo_id,
    $ctx${
      "career_goals": [
        "Move into a more commercial role",
        "Win the interviews I already have",
        "Build a stronger professional brand"
      ],
      "career_goal_text": "Targeting SDR/AE roles in hospitality tech — PMS, SaaS, OTA ecosystem. Leveraging 7+ years hotel operations and HubOS implementation experience.",
      "hidden_strengths": [
        "Opera PMS expertise (7 years across Accor and Soho House)",
        "Multilingual — Spanish, Galician, English, Italian, Portuguese",
        "Salesforce CRM fluency (2.5 years daily at Soho House)",
        "Rare bridge between hotel operations and SaaS technology"
      ],
      "recruiter_concerns": {
        "addressed": [
          {
            "concern": "Short SaaS tenure — only 4 months at HubOS",
            "response": "It was a deliberate step to get hands-on experience on the software side. Four months gave me real insight into what implementation looks like from the vendor perspective. Combined with 7 years as an end user, that is a different kind of qualification."
          },
          {
            "concern": "No direct quota-carrying sales experience",
            "response": "I have been doing consultative work my whole career — just without the title. Understanding buyer needs, translating product capability to operational reality, convincing skeptical stakeholders — that is persuasion. What I am missing is the formal structure of an SDR role, not the instincts."
          }
        ],
        "skipped": []
      },
      "career_narrative": "Seven years in hotel operations — Accor, Soho House in London, then Front Office Manager in Barcelona — gave me something most people in hospitality tech do not have: I have been the end user. I know what it feels like when a PMS goes down during peak check-in, when a new system launches and the training was insufficient, when a guest complaint falls through the cracks because the handover was not working. At HubOS I moved to the other side — implementing software for hotel clients. What I enjoyed most was not the configuration. It was the consultative part: understanding a client's specific situation, finding the real pain, and helping them see how the product would change their day-to-day. I am not running away from operations — I am leveraging it toward commercial impact.",
      "communication_style": {
        "How do you typically communicate with clients or stakeholders who are under pressure?": "I stay grounded and specific. Under pressure is not when you want someone who escalates — it is when people need clarity. I focus on what is actionable in the next hour rather than the full picture.",
        "What motivates you most in your day-to-day work?": "The moment when something clicks for a client — when you have worked through their specific situation and they genuinely see how it changes their day. That is more satisfying than a smooth demo.",
        "How do you work best — structured or flexible?": "Both, depending on what the task needs. Implementation work is structured by nature — projects, timelines, configuration. But the consultative side needs to flex to whatever the client brings. I have learned to switch modes quickly.",
        "What triggers frustration for you at work, and how do you manage it?": "When process gets in the way of genuinely helping someone. I manage it by separating what I can control — my approach, my communication — from what I cannot. And by raising it constructively when it matters.",
        "How do you prefer to receive feedback — immediately or with time to reflect?": "Immediately, directly. I would rather know in the moment than piece it together afterward. Honest feedback is faster to act on."
      },
      "stories_started": 5
    }$ctx$::jsonb,
    NOW()
  )
  ON CONFLICT (candidate_id) DO UPDATE SET
    context      = EXCLUDED.context,
    last_updated = NOW();


  RAISE NOTICE '✓ Pablo seed complete. candidate_id = %', pablo_id;
  RAISE NOTICE '  Login: pablo@interviewmind.one / InterviewMind2026!';
  RAISE NOTICE '  Expected confidence score: ~62 (onboarding_complete = true)';

END $$;
