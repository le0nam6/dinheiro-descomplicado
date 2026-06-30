import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  // Canonical: portalendinheirados.com.br. O .cc e o www redirecionam pra cá.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'endinheirados.cc' }],
        destination: 'https://portalendinheirados.com.br/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.endinheirados.cc' }],
        destination: 'https://portalendinheirados.com.br/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.portalendinheirados.com.br' }],
        destination: 'https://portalendinheirados.com.br/:path*',
        permanent: true,
      },
      {
        source: '/blog/caz%C3%A9tv-recorde-youtube-brasil-copa-do-mundo',
        destination: '/blog/cazetv-recorde-youtube-brasil-copa-do-mundo',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
