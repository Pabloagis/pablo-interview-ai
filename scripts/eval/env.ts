// Minimal .env.local loader — same pattern the P9/P10 verification scripts used.
// Standalone: the eval suite must not import app code.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  const path = resolve(process.cwd(), '.env.local');
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
  loaded = true;
}

export function getEnv(key: string, required = true): string {
  loadEnv();
  const v = process.env[key];
  if (required && (!v || !v.trim())) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v ?? '';
}
