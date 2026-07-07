import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { sendEditionCampaign, sendEditionCampaignFromBlocks } from '@/lib/brevo'
import { tgAlert } from '@/lib/publish-core'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

function brtDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const date = brtDate()
    const [edition, featuredPosts] = await Promise.all([
      sanity.fetch(
        `*[_type=="edition" && !(_id in path("drafts.**")) && date==$date] | order(date desc)[0]{
          _id, date, title, punchline, intro, closing, readingTime,
          "blocks": blocks[],
          "stories": stories[]{ emoji, tag, headline, hook, what, why, "image": image{ url, alt, credit } },
          wordOfDay, curiosity, recommendation, reflection,
          "slug": slug.current
        }`,
        { date }
      ),
      sanity.fetch(
        `*[_type=="post" && defined(slug.current) && publishedAt <= now() && articleType != "news"] | order(publishedAt desc)[0...20]{
          title, "slug": slug.current, excerpt, category
        }`
      ).then((posts: Array<{ title: string; slug: string; excerpt?: string; category?: string; publishedAt?: string }>) => {
        const shuffled = posts.sort(() => Math.random() - 0.5)
        return shuffled.slice(0, 3)
      }).catch(() => [] as Array<{ title: string; slug: string; excerpt?: string; category?: string }>),
    ])

    if (!edition) {
      return NextResponse.json({ ok: false, message: `Nenhuma edição publicada para ${date}` })
    }

    // Edições criadas pelo builder usam blocks[]; as do cron antigo usam stories[]
    if (edition.blocks?.length > 0) {
      await sendEditionCampaignFromBlocks({
        date: edition.date,
        title: edition.title || '',
        punchline: edition.punchline || '',
        intro: edition.intro || '',
        closing: edition.closing || '',
        readingTime: edition.readingTime,
        blocks: edition.blocks,
      })
    } else {
      await sendEditionCampaign({
        date: edition.date,
        title: edition.title || '',
        url: `https://portalendinheirados.com.br/edicao/${edition.slug}`,
        punchline: edition.punchline,
        intro: edition.intro,
        closing: edition.closing,
        stories: edition.stories || [],
        featuredPosts,
        wordOfDay: edition.wordOfDay,
        curiosity: edition.curiosity,
        recommendation: edition.recommendation,
        reflection: edition.reflection,
      })
    }

    return NextResponse.json({ ok: true, date, title: edition.title })
  } catch (err) {
    await tgAlert('Cron send-edition-email (5h05 BRT)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
