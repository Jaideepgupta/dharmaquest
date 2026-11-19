/**
 * Open-redirect protection for the post-sign-in `next` parameter.
 *
 * An attacker can craft a magic-link URL whose `next` points at their own site; after a genuine sign-in the
 * person would be sent there, looking trusted. Only same-origin paths are accepted. Everything else falls
 * back to a safe default. The returned value is always a path that starts with a single "/".
 */
export function safeNext(raw: string | null | undefined, siteOrigin: string, fallback = '/account'): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return fallback;
  // Control characters (tab, CR, LF, NUL...) are stripped by URL parsers, which can turn "/\t/evil.com" into "//evil.com".
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  let url: URL;
  try { url = new URL(raw, siteOrigin); } catch { return fallback; }
  if (url.origin !== new URL(siteOrigin).origin) return fallback;
  const path = url.pathname + url.search + url.hash;
  // A path such as "/..//evil.com" resolves on our origin but, used as a redirect target, "//evil.com" is a different site.
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  // Never bounce into the auth plumbing itself (loops) or the API.
  if (/^\/(auth|api)(\/|$)/.test(url.pathname)) return fallback;
  return path;
}
