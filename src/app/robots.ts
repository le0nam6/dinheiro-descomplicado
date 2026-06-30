import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/img'],
      disallow: ['/studio/', '/api/'],
    },
    sitemap: ['https://portalendinheirados.com.br/sitemap.xml', 'https://portalendinheirados.com.br/news-sitemap.xml'],
  }
}
