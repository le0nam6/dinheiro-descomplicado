import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  // Canonical: tudo em https://endinheirados.cc (sem-www). O www redireciona pra
  // cá — evita conteúdo duplicado e confusão de propriedade no Search Console.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.endinheirados.cc' }],
        destination: 'https://endinheirados.cc/:path*',
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
