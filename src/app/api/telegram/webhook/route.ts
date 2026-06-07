/**
 * Webhook do Telegram: recebe cliques dos botões (aprovar/rejeitar/editar)
 * e mensagens de edição. Controla o fluxo de aprovação dos posts.
 */
import { NextResponse } from 'next/server'
import {
  sanity, SITE, type GeneratedPost, type Photo,
  createSanityPost, buildSlideUrls, deliverCarousel, fetchPhoto,
} from '@/lib/publish-core'

// Teclado de aprovação reutilizável
function approvalKeyboard(id: string) {
  return {
    inline_keyboard: [[
      { text: '✅ Aprovar', callback_data: `ap:${id}` },
      { text: '❌ Rejeitar', callback_data: `rj:${id}` },
    ], [
      { text: '✏️ Título', callback_data: `ed:${id}` },
      { text: '📝 Legenda', callback_data: `ec:${id}` },
      { text: '🖼 Foto', callback_data: `ph:${id}` },
    ]],
  }
}

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN
const API = () => `https://api.telegram.org/bot${TOKEN()}`

async function tg(method: string, body: Record<string, unknown>) {
  return fetch(`${API()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json())
}

type PendingData = { post: GeneratedPost; photo: Photo; slideUrls: string[]; caption: string }

function buildSlides(post: GeneratedPost, photo: Photo) {
  const coverTitle = post.igTitle || post.title
  const slides = Array.isArray(post.carousel) ? post.carousel.filter(s => s?.title && s?.body).slice(0, 4) : []
  return slides.length >= 2
    ? buildSlideUrls(coverTitle, photo.url, slides)
    : [`${SITE}/api/og?title=${encodeURIComponent(coverTitle)}&photo=${encodeURIComponent(photo.url)}&cta=${encodeURIComponent('LEIA A LEGENDA')}`]
}

export async function POST(request: Request) {
  // Segurança: Telegram envia o secret no header
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update = await request.json()

  try {
    // === Clique em botão ===
    if (update.callback_query) {
      const cq = update.callback_query
      const [action, id] = (cq.data as string).split(':')
      const msgId = cq.message?.message_id

      const pending = await sanity.fetch('*[_id==$id][0]{_id, data, status}', { id })
      if (!pending) {
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Esse rascunho não existe mais.' })
        return NextResponse.json({ ok: true })
      }
      const d: PendingData = JSON.parse(pending.data)

      if (action === 'ap') {
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Publicando…' })
        const doc = await createSanityPost(d.post, d.photo)
        const finalSlug = (doc.slug as { current: string }).current
        const blogUrl = `${SITE}/blog/${finalSlug}`
        // Se o slug foi renomeado por colisão, corrige o link na legenda
        const caption = finalSlug === d.post.slug ? d.caption : d.caption.replaceAll(d.post.slug, finalSlug)
        await deliverCarousel(d.slideUrls, caption, blogUrl)
        await sanity.delete(id)
        await tg('editMessageCaption', {
          chat_id: cq.message.chat.id, message_id: msgId,
          caption: `✅ PUBLICADO\n\n${d.post.title}\n${blogUrl}`,
        })
        return NextResponse.json({ ok: true, published: doc._id })
      }

      if (action === 'rj') {
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Rejeitado.' })
        await sanity.delete(id)
        await tg('editMessageCaption', {
          chat_id: cq.message.chat.id, message_id: msgId,
          caption: `❌ REJEITADO\n\n${d.post.title}`,
        })
        return NextResponse.json({ ok: true, rejected: id })
      }

      if (action === 'ed') {
        await tg('answerCallbackQuery', { callback_query_id: cq.id })
        await sanity.patch(id).set({ status: 'editing' }).commit()
        await tg('sendMessage', {
          chat_id: cq.message.chat.id,
          text: `✏️ Manda o novo TÍTULO pra:\n"${d.post.title}"\n\n(responda esta mensagem com o texto)`,
          reply_markup: { force_reply: true },
        })
        return NextResponse.json({ ok: true, editing: id })
      }

      if (action === 'ec') {
        await tg('answerCallbackQuery', { callback_query_id: cq.id })
        await sanity.patch(id).set({ status: 'editing-caption' }).commit()
        await tg('sendMessage', {
          chat_id: cq.message.chat.id,
          text: `📝 Manda a nova LEGENDA completa do Instagram\n\n(responda esta mensagem com o texto)`,
          reply_markup: { force_reply: true },
        })
        return NextResponse.json({ ok: true, editingCaption: id })
      }

      if (action === 'ph') {
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Buscando outra foto…' })
        const newPhoto = await fetchPhoto(d.post.coverQuery || 'personal finance money', d.photo.url)
        d.photo = newPhoto
        d.slideUrls = buildSlides(d.post, newPhoto)
        await sanity.patch(id).set({ data: JSON.stringify(d) }).commit()
        await tg('sendPhoto', {
          chat_id: cq.message.chat.id,
          photo: d.slideUrls[0],
          caption: `🖼 Foto trocada\n\n📌 ${d.post.title}`,
          reply_markup: approvalKeyboard(id),
        })
        return NextResponse.json({ ok: true, photoSwapped: id })
      }
    }

    // === Mensagem de texto (edição de título ou legenda) ===
    if (update.message?.text) {
      const text = update.message.text.trim()
      if (text.startsWith('/')) return NextResponse.json({ ok: true }) // ignora comandos

      const editing = await sanity.fetch(
        '*[_type=="pendingPost" && status in ["editing","editing-caption"]]|order(createdAt desc)[0]{_id, data, status}'
      )
      if (!editing) return NextResponse.json({ ok: true })

      const d: PendingData = JSON.parse(editing.data)
      let label: string
      if (editing.status === 'editing-caption') {
        d.caption = text
        label = '📝 Legenda atualizada'
      } else {
        d.post.title = text
        d.post.igTitle = text.toUpperCase()
        d.slideUrls = buildSlides(d.post, d.photo)
        label = '✏️ Título atualizado'
      }

      await sanity.patch(editing._id).set({ status: 'pending', data: JSON.stringify(d) }).commit()

      await tg('sendPhoto', {
        chat_id: update.message.chat.id,
        photo: d.slideUrls[0],
        caption: `🆕 ${label}\n\n📌 ${d.post.title}`,
        reply_markup: approvalKeyboard(editing._id),
      })
      return NextResponse.json({ ok: true, edited: editing._id })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[telegram/webhook] Erro:', message)
    // Avisa o usuário do erro
    if (update.callback_query) {
      await tg('answerCallbackQuery', { callback_query_id: update.callback_query.id, text: `Erro: ${message.slice(0, 180)}` })
    }
    return NextResponse.json({ ok: false, error: message })
  }
}
