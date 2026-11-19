import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The service-role key bypasses all security rules. Only these server-only files may read it. */
const ALLOWED = new Set(['lib/supabase/admin-config.ts', 'app/api/account/delete/route.ts', 'lib/supabase/config.ts']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', 'tests', 'docs', 'supabase', 'scripts'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx|js|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

test('only server-only files mention SUPABASE_SERVICE_ROLE_KEY', () => {
  const offenders = walk('.').map((f) => f.replace(/^\.\//, '')).filter((f) => /SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, 'utf8')) && !ALLOWED.has(f) && f !== 'next.config.mjs');
  assert.deepEqual(offenders, []);
});

test('client components never import the admin config', () => {
  const offenders = walk('.').filter((f) => /^(\.\/)?(components|app)\//.test(f) && !/route\.ts$/.test(f)).filter((f) => /admin-config/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(offenders, []);
});
