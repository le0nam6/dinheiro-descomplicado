/**
 * Vercel Cron (4x/dia): gera post de notícia para o Instagram via Canva Connect API.
 * Fluxo: notícia → foto → autofill template Canva → exporta imagem → salva no Sanity
 * → notifica Telegram → admin aprova em /admin → publica no Instagram.
 */
import { NextResponse } from 'next/server'
import { sanity, tgSendMessage, tgAlert, fetchPhoto } from '@/lib/publish-core'
import { getToken, uploadAssetFromUrl, createIgDesign } from '@/lib/canva-api'
import Anthropic from '@anthropic-ai/sdk'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://endinheirados.cc'
const ADMIN_URL = `${SITE}/admin`

async function getNextPost() {
  return sanity.fetch<{
    _id: string; slug: string; title: string; excerpt: string; publishedAt: string
    coverImageUrl: string | null
  } | null>(
    `*[_type=="post" && articleType=="news" && igQueued!=true && igPending!=true && igPublished!=true && publishedAt<=now()]
     | order(publishedAt desc)[0]
     { _id, "slug": slug.current, title, excerpt, publishedAt, "coverImageUrl": coverImage.url }`
  )
}

async function buildCaption(post: { title: string; excerpt: string; slug: string }): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Crie uma legenda para o Instagram sobre este post do blog Endinheirados.

Título: ${post.title}
Resumo: ${post.excerpt}

Formato OBRIGATÓRIO (3 parágrafos + link + hashtags):

[PARÁGRAFO 1 — 4-5 linhas: contexto do tema, por que importa, situação cotidiana que o leitor reconhece. Tom casual, sem enrolação]

[PARÁGRAFO 2 — 4-5 linhas: o que a matéria conta de concreto, o impacto real no bolso ou na vida do leitor]

[PARÁGRAFO 3 — 4-5 linhas: gancho final, desperta curiosidade, convida a acessar]

🔗 Leia a matéria completa: endinheirados.cc/blog/${post.slug}

#mercadofinanceiro #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados

Regras: português BR coloquial, ZERO travessão, sem "crucial"/"fundamental"/"adicionalmente", sem emojis no corpo, exatamente 5 hashtags minúsculas sem acento. Retorne APENAS a legenda.`,
    }],
  })
  return (msg.content[0] as { text: string }).text.trim()
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await getNextPost()
    if (!post) return NextResponse.json({ ok: true, message: 'Sem notícia nova para o IG' })

    console.log(`[ig-backlog] Processando para IG: "${post.title}"`)

    // 1. Foto
    const photoUrl = post.coverImageUrl
      ?? (await fetchPhoto(`${post.title.split(' ').slice(0, 4).join(' ')} Brasil`)).url
    if (!photoUrl) throw new Error('Nenhuma foto disponível')

    // 2. Data formatada
    const pub = new Date(post.publishedAt)
    const date = `${String(pub.getDate()).padStart(2, '0')}/${String(pub.getMonth() + 1).padStart(2, '0')} • ${String(pub.getHours()).padStart(2, '0')}:${String(pub.getMinutes()).padStart(2, '0')}`

    // 3. Token Canva (obtido uma vez — Canva rotaciona refresh_token)
    const canvaToken = await getToken()

    // 4. Upload foto para o Canva (teste com URL pública conhecida)
    const testUrl = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80'
    console.log('[ig-backlog] Fazendo upload da foto para o Canva...', testUrl)
    const assetId = await uploadAssetFromUrl(testUrl, `ig-${post.slug}`, canvaToken)

    // 5. Autofill + exportar design
    console.log('[ig-backlog] Gerando design via autofill...')
    const { designId, exportUrl } = await createIgDesign({
      title: post.title.toUpperCase(),
      excerpt: post.excerpt.slice(0, 120),
      date,
      assetId,
      token: canvaToken,
    })

    // 5. Gerar legenda
    const caption = await buildCaption(post)

    // 6. Salvar no Sanity como pendente
    await sanity.patch(post._id).set({
      igQueued: true,
      igPending: true,
      igCanvaDesignId: designId,
      igExportUrl: exportUrl,
      igCaption: caption,
    }).commit()

    // 7. Notificar Telegram (só aviso, aprovação é no admin)
    await tgSendMessage(
      `📲 *Post IG pendente de aprovação*\n\n📌 ${post.title}\n\nAprove em ${ADMIN_URL}`,
    )

    return NextResponse.json({ ok: true, title: post.title, designId, exportUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ig-backlog] Erro:', message)
    await tgAlert('Cron IG backlog (Canva)', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
