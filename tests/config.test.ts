import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseConfig } from '../lib/supabase/config';

// Build tokens at runtime so no key-shaped literal ever appears in the repository.
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (role: string) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ role, iss: 'supabase', exp: 9999999999 })}.${'x'.repeat(20)}`;
const URL_OK = 'https://abcdefghij.supabase.co';

test('nothing configured: the feature is simply off', () => {
  const c = getSupabaseConfig({}); assert.equal(c.enabled, false);
});
test('a valid https URL with a public anon JWT enables the feature (origin normalised)', () => {
  const c = getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: `${URL_OK}/rest/v1/?x=1`, NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt('anon') });
  assert.deepEqual(c.enabled && c.url, URL_OK);
});
test('the newer publishable key format is accepted', () => {
  assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_' + 'a'.repeat(20) }).enabled, true);
});
test('a SERVICE-ROLE key is refused: it would bypass every security rule', () => {
  const c = getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt('service_role') });
  assert.equal(c.enabled, false); assert.match(!c.enabled ? c.reason : '', /service-role/);
});
test('a secret-format key is refused', () => {
  const c = getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_' + 'a'.repeat(20) });
  assert.equal(c.enabled, false); assert.match(!c.enabled ? c.reason : '', /secret/);
});
test('any NEXT_PUBLIC_ variable that names a secret is refused, even if the pair is otherwise valid', () => {
  for (const name of ['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_SECRET', 'NEXT_PUBLIC_SERVICE_ROLE']) {
    const c = getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt('anon'), [name]: 'something' });
    assert.equal(c.enabled, false, name); assert.match(!c.enabled ? c.reason : '', /never be public/);
  }
});
test('a key claiming any other role is refused', () => {
  assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt('authenticated') }).enabled, false);
  assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt('postgres') }).enabled, false);
});
test('half-configured is refused (no silent half-on state)', () => {
  assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK }).enabled, false);
  assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt('anon') }).enabled, false);
});
test('URLs: only https (http only for localhost); no credentials; must parse', () => {
  const key = jwt('anon');
  for (const url of ['http://abcdefghij.supabase.co', 'ftp://x.example', 'javascript:alert(1)', 'not a url', 'https://user:pw@abcdefghij.supabase.co']) assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key }).enabled, false, url);
  for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321']) assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key }).enabled, true, url);
});
test('garbage keys are refused; whitespace is trimmed', () => {
  for (const k of ['hello', 'a.b', '....', 'eyJ.eyJ.eyJ']) assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL_OK, NEXT_PUBLIC_SUPABASE_ANON_KEY: k }).enabled, false, k);
  assert.equal(getSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: `  ${URL_OK}  `, NEXT_PUBLIC_SUPABASE_ANON_KEY: `\n${jwt('anon')}\n` }).enabled, true);
});
