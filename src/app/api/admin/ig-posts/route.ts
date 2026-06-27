import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'

export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await sanity.fetch<Array<{
    _id: string; title: string; slug: string; publishedAt: string
    igExportUrl: string; igCaption: string; igCanvaDesignId: string
  }>>(
    `*[_type=="post" && igPending==true]
     | order(publishedAt desc)
     { _id, title, "slug": slug.current, publishedAt, igExportUrl, igCaption, igCanvaDesignId }`
  )
  return NextResponse.json({ posts })
}
