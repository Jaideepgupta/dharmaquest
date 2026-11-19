// Anything named NEXT_PUBLIC_* is compiled into the JavaScript sent to every visitor. A secret placed in one by
// mistake (for example the Supabase service-role key) would be published, so refuse to build at all.
const leaked = Object.keys(process.env).filter((k) => k.startsWith('NEXT_PUBLIC_') && /SERVICE_ROLE|SECRET|PRIVATE/i.test(k) && process.env[k]);
if (leaked.length) {
  throw new Error(`Refusing to build: ${leaked.join(', ')} would be exposed to every visitor. Remove the NEXT_PUBLIC_ prefix (server-only secrets must not be public).`);
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: '/scriptures/bhagavad-gita', destination: '/gita/bhagavad-gita', permanent: true },
      { source: '/scriptures/other-gitas', destination: '/gita', permanent: true },
    ];
  },
};
export default nextConfig;
