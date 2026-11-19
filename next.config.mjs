const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/scriptures/bhagavad-gita', destination: '/gita/bhagavad-gita', permanent: true },
      { source: '/scriptures/other-gitas', destination: '/gita', permanent: true },
    ];
  },
};
export default nextConfig;
