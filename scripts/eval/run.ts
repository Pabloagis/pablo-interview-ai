// Hallucination eval runner.
//   npx tsx scripts/eval/run.ts --target v3-local
//   npx tsx scripts/eval/run.ts --target v2-prod
//   npx tsx scripts/eval/run.ts --target both      (default; runs v3-local first)
//
// Requires env (from .env.local): ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_KEY, and EVAL_CANDIDATE_ID (Pablo's profiles.id) for v3-local.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from './env';
import { BATTERY, type TrapCase, type TrapCategory } from './battery';
import { makeTarget, type AgentTarget } from './targets';
import { gradeAnswer, type GradeResult } from './grade';

const DELAY_MS = 1200;               // be gentle — do not hammer production
const RESULTS_DIR = resolve(process.cwd(), 'scripts/eval/results');

interface Row {
  id: string;
  category: TrapCategory;
  question: string;
  answer: string;
  outcome: 'pass' | 'fail' | 'error';
  gate: GradeResult['gate'] | 'error';
  reason: string;
  trippedPattern?: string;
}

interface TargetReport {
  target: string;
  rows: Row[];
  passed: number;
  failed: number;
  errored: number;
  rate: number;                      // failed / (passed + failed)
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function parseTargets(): string[] {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--target');
  const val = i >= 0 ? argv[i + 1] : 'both';
  if (val === 'both' || !val) return ['v3-local', 'v2-prod'];
  if (val !== 'v2-prod' && val !== 'v3-local') {
    throw new Error(`--target must be v2-prod | v3-local | both (got "${val}")`);
  }
  return [val];
}

async function runTarget(target: AgentTarget): Promise<TargetReport> {
  // Fail loudly if the target is unreachable — never silently score 0.
  await target.preflight();

  const rows: Row[] = [];
  for (let i = 0; i < BATTERY.length; i++) {
    const trap: TrapCase = BATTERY[i];
    process.stdout.write(`  [${target.name}] ${i + 1}/${BATTERY.length} ${trap.id} … `);
    try {
      const answer = await target.ask(trap.question);
      const g = await gradeAnswer(trap, answer);
      rows.push({
        id: trap.id, category: trap.category, question: trap.question,
        answer, outcome: g.verdict, gate: g.gate, reason: g.reason,
        trippedPattern: g.trippedPattern,
      });
      console.log(g.verdict.toUpperCase() + (g.gate === 'deterministic' ? ' (regex)' : ''));
    } catch (err) {
      const msg = (err as Error).message;
      rows.push({
        id: trap.id, category: trap.category, question: trap.question,
        answer: '', outcome: 'error', gate: 'error', reason: msg,
      });
      console.log('ERROR — ' + msg);
    }
    if (i < BATTERY.length - 1) await sleep(DELAY_MS);
  }

  const passed = rows.filter(r => r.outcome === 'pass').length;
  const failed = rows.filter(r => r.outcome === 'fail').length;
  const errored = rows.filter(r => r.outcome === 'error').length;
  const graded = passed + failed;
  return { target: target.name, rows, passed, failed, errored, rate: graded ? failed / graded : 0 };
}

function categoryBreakdown(rows: Row[]): Map<TrapCategory, { pass: number; fail: number; error: number }> {
  const m = new Map<TrapCategory, { pass: number; fail: number; error: number }>();
  for (const r of rows) {
    const c = m.get(r.category) ?? { pass: 0, fail: 0, error: 0 };
    if (r.outcome === 'pass') c.pass++;
    else if (r.outcome === 'fail') c.fail++;
    else c.error++;
    m.set(r.category, c);
  }
  return m;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function buildMarkdown(reports: TargetReport[], stamp: string): string {
  const lines: string[] = [];
  lines.push(`# Hallucination Eval — ${stamp}`);
  lines.push('');
  lines.push(`Battery: ${BATTERY.length} trap cases. Grader: Haiku + deterministic red-flag gate.`);
  lines.push('');

  // Headline per target
  for (const r of reports) {
    lines.push(`**${r.target}: ${r.failed}/${r.passed + r.failed} failed (${pct(r.rate)})**` +
      (r.errored ? ` · ${r.errored} errored (excluded from rate)` : ''));
  }
  lines.push('');

  // Side-by-side by category if both ran
  if (reports.length === 2) {
    const [a, b] = reports;
    const ba = categoryBreakdown(a.rows);
    const bb = categoryBreakdown(b.rows);
    const cats = Array.from(new Set([...ba.keys(), ...bb.keys()])).sort();
    lines.push(`## Side-by-side by category (fails / graded)`);
    lines.push('');
    lines.push(`| Category | ${a.target} | ${b.target} |`);
    lines.push(`|---|---|---|`);
    for (const c of cats) {
      const x = ba.get(c) ?? { pass: 0, fail: 0, error: 0 };
      const y = bb.get(c) ?? { pass: 0, fail: 0, error: 0 };
      lines.push(`| ${c} | ${x.fail}/${x.pass + x.fail} | ${y.fail}/${y.pass + y.fail} |`);
    }
    lines.push('');
    lines.push(`| **Overall** | **${a.failed}/${a.passed + a.failed} (${pct(a.rate)})** | **${b.failed}/${b.passed + b.failed} (${pct(b.rate)})** |`);
    lines.push('');
  } else {
    const r = reports[0];
    const bd = categoryBreakdown(r.rows);
    lines.push(`## By category (fails / graded)`);
    lines.push('');
    lines.push(`| Category | fails/graded |`);
    lines.push(`|---|---|`);
    for (const [c, v] of Array.from(bd.entries()).sort()) {
      lines.push(`| ${c} | ${v.fail}/${v.pass + v.fail} |`);
    }
    lines.push('');
  }

  // Failing transcripts — verbatim, never sanitised
  for (const r of reports) {
    const fails = r.rows.filter(x => x.outcome === 'fail');
    lines.push(`## ${r.target} — failing transcripts (${fails.length})`);
    lines.push('');
    if (fails.length === 0) { lines.push('_None._', ''); continue; }
    for (const f of fails) {
      lines.push(`### ${f.id}  [${f.category}]  — ${f.gate === 'deterministic' ? 'regex' : 'Haiku'}`);
      lines.push(`**Q:** ${f.question}`);
      lines.push('');
      lines.push(`**A:** ${f.answer || '(no answer)'}`);
      lines.push('');
      lines.push(`**Why FAIL:** ${f.reason}`);
      if (f.trippedPattern) lines.push(`**Pattern:** \`${f.trippedPattern}\``);
      lines.push('');
    }
  }

  // Errors, if any
  for (const r of reports) {
    const errs = r.rows.filter(x => x.outcome === 'error');
    if (errs.length) {
      lines.push(`## ${r.target} — errored cases (${errs.length})`);
      for (const e of errs) lines.push(`- ${e.id}: ${e.reason}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

async function main() {
  loadEnv();
  const targetNames = parseTargets();
  mkdirSync(RESULTS_DIR, { recursive: true });

  const reports: TargetReport[] = [];
  for (const name of targetNames) {
    console.log(`\n=== Running ${name} (${BATTERY.length} cases) ===`);
    let report: TargetReport;
    try {
      report = await runTarget(makeTarget(name));
    } catch (err) {
      // Preflight / unreachable → fail loudly, do NOT record a fake 0/40.
      console.error(`\n!! ${name} ABORTED: ${(err as Error).message}`);
      continue;
    }
    reports.push(report);
    console.log(`--- ${name}: ${report.failed}/${report.passed + report.failed} failed (${pct(report.rate)})` +
      (report.errored ? ` · ${report.errored} errored` : '') + ' ---');
  }

  if (reports.length === 0) {
    console.error('\nNo target produced results. Nothing written.');
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = resolve(RESULTS_DIR, `eval-${stamp}.json`);
  const mdPath = resolve(RESULTS_DIR, `eval-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify({ stamp, battery: BATTERY.length, reports }, null, 2));
  writeFileSync(mdPath, buildMarkdown(reports, stamp));

  console.log('\n================ HEADLINE ================');
  for (const r of reports) {
    console.log(`${r.target}: ${r.failed}/${r.passed + r.failed} failed (${pct(r.rate)})` +
      (r.errored ? ` · ${r.errored} errored` : ''));
  }
  console.log(`\nWrote:\n  ${jsonPath}\n  ${mdPath}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
