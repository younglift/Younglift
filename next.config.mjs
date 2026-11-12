/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Until Matas ships Discover at "/", the home page shows the clickable prototype.
      // Remove this redirect in the PR that adds app/(site)/page.tsx with the real Discover.
      { source: '/', destination: '/prototype/index.html', permanent: false },
    ];
  },
};

export default nextConfig;
