import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
// Scan everything git would commit (tracked files + new files that are not ignored).
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .split('\n').filter((f) => f && !/(package-lock\.json|\.png|\.ico|\.svg)$/.test(f));

const PATTERNS: [string, RegExp][] = [
  ['a JSON Web Token', /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ['a Supabase secret key', /sb_secret_[A-Za-z0-9_-]{10,}/],
  ['a private key block', /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['an AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['a GitHub token', /\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}\b/],
  ['a Postgres URL with a password', /postgres(ql)?:\/\/[^\s:@/]+:[^\s@/]{4,}@(?!localhost|127\.0\.0\.1)[^\s/]+/],
  ['a Vercel token', /\bvcp_[A-Za-z0-9]{20,}\b/],
];

test('the repository contains no committed secrets', () => {
  assert.ok(files.length > 50, `scanned ${files.length} files`);
  const hits: string[] = [];
  for (const f of files) {
    let text: string; try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    for (const [name, re] of PATTERNS) if (re.test(text)) hits.push(`${f}: looks like ${name}`);
  }
  assert.deepEqual(hits, [], 'secrets must live in environment variables, never in the repository');
});
test('.env files are git-ignored and only the example is tracked', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n');
  assert.ok(!tracked.some((f) => /^\.env(\.|$)/.test(f) && f !== '.env.example'), 'no real .env file is tracked');
  const ignore = readFileSync(join(root, '.gitignore'), 'utf8');
  for (const p of ['.env.local', '.env']) assert.ok(ignore.split('\n').includes(p), `${p} is ignored`);
});
test('.env.example contains placeholders only', () => {
  const ex = readFileSync(join(root, '.env.example'), 'utf8');
  assert.match(ex, /YOUR-PROJECT-REF/); assert.match(ex, /YOUR-PUBLIC-ANON-KEY/);
  assert.ok(!/eyJ/.test(ex), 'no real token in the example');
});
