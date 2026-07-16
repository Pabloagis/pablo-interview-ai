// Seed (or delete) a throwaway fake candidate for the parameterized-eval demo.
//   npx tsx scripts/eval/seed_fake_candidate.mts create   → prints the new id
//   npx tsx scripts/eval/seed_fake_candidate.mts delete <id>
import { readFileSync } from 'node:fs';
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('='); if (!(t.slice(0, i).trim() in process.env)) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const mode = process.argv[2];
if (mode === 'delete') {
  const id = process.argv[3];
  if (!id) throw new Error('delete needs an id');
  await supabase.auth.admin.deleteUser(id);
  console.log('deleted', id);
  process.exit(0);
}

const CV = {
  full_name: 'Morgan Reyes', current_role: 'Account Executive', years_experience: 7,
  skills: ['Pipeline management', 'Negotiation', 'CRM (HubSpot)'], languages: ['English — native', 'Spanish — conversational'],
  education: [{ institution: 'State University', degree: 'BA Communications', year: '2015' }],
  work_history: [
    { company: 'Northwind SaaS', role: 'Account Executive', start_date: 'March 2022', end_date: 'February 2024', description: 'Closed mid-market deals.' },
    { company: 'BlueHarbor Logistics', role: 'Operations Coordinator', start_date: 'June 2018', end_date: 'January 2022', description: 'Coordinated freight operations.' },
  ],
};

const email = `eval-fake-${Date.now()}@example.com`;
const { data: c, error } = await supabase.auth.admin.createUser({ email, password: 'EvalFake123!', email_confirm: true, user_metadata: { full_name: CV.full_name } });
if (error || !c.user) throw new Error('createUser failed: ' + error?.message);
const id = c.user.id;
await supabase.from('profiles').insert({ id, role: 'candidate', full_name: CV.full_name, career_goal: '{"goals":["Grow into enterprise sales"],"other":""}' });
await supabase.from('candidate_profiles').insert({ candidate_id: id, cv_data: CV });
console.log(id);
