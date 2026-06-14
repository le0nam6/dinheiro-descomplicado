import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { sendEditionCampaign } from '@/lib/brevo'
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
    const edition = await sanity.fetch(
      `*[_type=="edition" && !(_id in path("drafts.**")) && date==$date] | order(date desc)[0]{
        date, title, punchline, intro, closing,
        "stories": stories[]{ emoji, tag, headline, hook, what, why, "image": image{ url, alt, credit } },
        wordOfDay, curiosity, recommendation, reflection,
        "slug": slug.current
      }`,
      { date }
    )

    if (!edition) {
      return NextResponse.json({ ok: false, message: `Nenhuma edição publicada para ${date}` })
    }

    await sendEditionCampaign({
      date: edition.date,
      title: edition.title,
      url: `https://endinheirados.cc/edicao/${edition.slug}`,
      punchline: edition.punchline,
      intro: edition.intro,
      closing: edition.closing,
      stories: edition.stories || [],
      wordOfDay: edition.wordOfDay,
      curiosity: edition.curiosity,
      recommendation: edition.recommendation,
      reflection: edition.reflection,
    })

    return NextResponse.json({ ok: true, date, title: edition.title })
  } catch (err) {
    await tgAlert('Cron send-edition-email (5h05 BRT)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
