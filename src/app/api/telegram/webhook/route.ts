/**
 * Webhook do Telegram: recebe cliques dos botões (aprovar/rejeitar/editar)
 * e mensagens de edição. Controla o fluxo de aprovação dos posts.
 */
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  sanity, SITE, type GeneratedPost, type Photo,
  createSanityPost, buildSlideUrls, deliverCarousel, fetchPhoto,
} from '@/lib/publish-core'
import { type Candidate, candidatesKeyboard, candidatesMessage } from '@/lib/editionCuration'

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
      const parts = (cq.data as string).split(':')
      const [action, id] = parts
      const msgId = cq.message?.message_id

      // --- Curadoria da edição: toggle de manchete ---
      if (action === 'et') {
        const idx = parseInt(parts[2], 10)
        const pe = await sanity.fetch('*[_id==$id][0]{_id, candidates, status, date}', { id })
        if (!pe || pe.status !== 'selecting') {
          await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Seleção encerrada.' })
          return NextResponse.json({ ok: true })
        }
        const candidates: Candidate[] = pe.candidates || []
        const c = candidates.find(x => x.idx === idx)
        if (c) c.selected = !c.selected
        await sanity.patch(id).set({ candidates }).commit()
        const nSel = candidates.filter(x => x.selected).length
        // Atualiza só o teclado (evita reenviar texto longo que estoura o limite do Telegram)
        await tg('editMessageReplyMarkup', {
          chat_id: cq.message.chat.id, message_id: msgId,
          reply_markup: candidatesKeyboard(id, candidates),
        })
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: c?.selected ? `✅ Entrou — ${nSel} selecionada${nSel !== 1 ? 's' : ''}` : `⬜ Saiu — ${nSel} selecionada${nSel !== 1 ? 's' : ''}` })
        return NextResponse.json({ ok: true })
      }

      // --- Curadoria da edição: montar (confirmar seleção) ---
      if (action === 'eb') {
        const pe = await sanity.fetch('*[_id==$id][0]{_id, candidates, status, date}', { id })
        if (!pe) {
          await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Seleção não existe mais.' })
          return NextResponse.json({ ok: true })
        }
        const selected = (pe.candidates || []).filter((c: Candidate) => c.selected)
        if (selected.length === 0) {
          await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Marque pelo menos uma manchete.' })
          return NextResponse.json({ ok: true })
        }
        await sanity.patch(id).set({ status: 'selected' }).commit()
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Pronto!' })
        await tg('editMessageText', {
          chat_id: cq.message.chat.id, message_id: msgId,
          text: `✅ Edição montada com ${selected.length} manchete${selected.length > 1 ? 's' : ''} escolhida${selected.length > 1 ? 's' : ''}.\n\nElas serão usadas na edição de ${String(pe.date).split('-').reverse().join('/')}, publicada automaticamente às 6h.`,
        })
        return NextResponse.json({ ok: true })
      }

      const pending = await sanity.fetch('*[_id==$id][0]{_id, data, status, publishedId, publishedSlug}', { id })
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
        // Mantém o rascunho como "published" p/ permitir trocar a foto depois
        await sanity.patch(id).set({ status: 'published', publishedId: doc._id, publishedSlug: finalSlug, data: JSON.stringify(d) }).commit()
        await tg('editMessageCaption', {
          chat_id: cq.message.chat.id, message_id: msgId,
          caption: `✅ PUBLICADO\n\n${d.post.title}\n${blogUrl}`,
          reply_markup: { inline_keyboard: [[{ text: '🖼 Trocar foto e refazer carrossel', callback_data: `np:${id}` }]] },
        })
        return NextResponse.json({ ok: true, published: doc._id })
      }

      if (action === 'np') {
        // Trocar foto DEPOIS de publicado: nova foto → atualiza post no blog → refaz carrossel
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Buscando outra foto…' })
        const newPhoto = await fetchPhoto(d.post.coverQuery || 'finance', [d.photo.url])
        d.photo = newPhoto
        d.slideUrls = buildSlides(d.post, newPhoto)
        const postId = pending.publishedId as string
        const slug = pending.publishedSlug as string
        if (postId) {
          await sanity.patch(postId).set({ coverImage: { url: newPhoto.url, alt: newPhoto.alt, credit: newPhoto.credit } }).commit()
          try { revalidatePath(`/blog/${slug}`) } catch { /* ISR */ }
        }
        await sanity.patch(id).set({ data: JSON.stringify(d) }).commit()
        await deliverCarousel(d.slideUrls, d.caption.replaceAll(d.post.slug, slug || d.post.slug), `${SITE}/blog/${slug}`)
        await tg('sendMessage', { chat_id: cq.message.chat.id, text: `🖼 Foto trocada no blog e carrossel refeito acima. Se ainda não ficou bom, toca de novo em "Trocar foto".` })
        return NextResponse.json({ ok: true, rephoto: postId })
      }

      if (action === 'rj') {
        await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Rejeitado. Gerando alternativa…' })
        await sanity.delete(id)
        await tg('editMessageCaption', {
          chat_id: cq.message.chat.id, message_id: msgId,
          caption: `❌ REJEITADO\n\n${d.post.title}\n\n⏳ Gerando alternativa, aguarda…`,
        })
        // Dispara novo post em background — passa título rejeitado para o modelo não repetir
        const origin = new URL(request.url).origin
        const rejectedTitle = encodeURIComponent(d.post.title)
        fetch(`${origin}/api/cron/publish?rejected=${rejectedTitle}`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        }).catch(() => {})
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
        const newPhoto = await fetchPhoto(d.post.coverQuery || 'personal finance money', [d.photo.url])
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

    // === Mensagem de texto (comandos ou edição) ===
    if (update.message?.text) {
      const text = update.message.text.trim()
      const chatId = update.message.chat.id
      const cmd = text.toLowerCase().split(/\s+/)[0]

      // /start, /ajuda, /help
      if (['/start', '/ajuda', '/help'].includes(cmd)) {
        await tg('sendMessage', { chat_id: chatId, text:
          `🤖 *Endinheirados Bot*\n\n` +
          `📊 /status — visão geral do sistema\n` +
          `📋 /pendentes — posts aguardando aprovação\n` +
          `📰 /gerar — gera uma notícia agora\n` +
          `💱 /cotacao <ativo> — cotação atual (ex: /cotacao dolar)\n` +
          `🔔 /alerta <ativo> <acima|abaixo> <valor> — cria alerta\n` +
          `🔔 /alertas — lista alertas ativos`,
          parse_mode: 'Markdown' })
        return NextResponse.json({ ok: true })
      }

      // /status — visão geral
      if (cmd === '/status') {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        const [total, news, todayCount, pending, alerts, backlog] = await Promise.all([
          sanity.fetch('count(*[_type=="post"])'),
          sanity.fetch('count(*[_type=="post" && articleType=="news"])'),
          sanity.fetch('count(*[_type=="post" && publishedAt > $d])', { d: todayStart.toISOString() }),
          sanity.fetch('count(*[_type=="pendingPost" && status=="pending"])'),
          sanity.fetch('count(*[_type=="priceAlert" && active==true])'),
          sanity.fetch('count(*[_type=="post" && igPublished != true])'),
        ])
        // checa token do IG rápido
        let igOk = '—'
        try {
          const r = await fetch(`https://graph.instagram.com/v21.0/me?fields=id&access_token=${process.env.IG_ACCESS_TOKEN}`).then(r => r.json())
          igOk = r.id ? '✅ válido' : '⚠️ verificar'
        } catch { igOk = '⚠️ erro' }

        await tg('sendMessage', { chat_id: chatId, text:
          `📊 *Status do Endinheirados*\n\n` +
          `📝 Posts no blog: *${total}* (${news} notícias)\n` +
          `📅 Publicados hoje: *${todayCount}*\n` +
          `📋 Aguardando aprovação: *${pending}*\n` +
          `📲 Backlog p/ Instagram: *${backlog}*\n` +
          `🔔 Alertas ativos: *${alerts}*\n` +
          `🔑 Token Instagram: ${igOk}`,
          parse_mode: 'Markdown' })
        return NextResponse.json({ ok: true })
      }

      // /pendentes — lista posts aguardando aprovação
      if (cmd === '/pendentes') {
        const list = await sanity.fetch('*[_type=="pendingPost" && status=="pending"]|order(createdAt desc){data}')
        if (!list.length) { await tg('sendMessage', { chat_id: chatId, text: '✅ Nenhum post aguardando aprovação.' }); return NextResponse.json({ ok: true }) }
        const titles = list.map((p: { data: string }) => { try { return '• ' + JSON.parse(p.data).post.title } catch { return '• (erro)' } }).join('\n')
        await tg('sendMessage', { chat_id: chatId, text: `📋 Aguardando aprovação (${list.length}):\n${titles}` })
        return NextResponse.json({ ok: true })
      }

      // /gerar — dispara uma notícia agora
      if (cmd === '/gerar') {
        await tg('sendMessage', { chat_id: chatId, text: '📰 Gerando notícia… (alguns segundos)' })
        const origin = new URL(request.url).origin
        const r = await fetch(`${origin}/api/cron/news`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }).then(r => r.json()).catch(() => null)
        await tg('sendMessage', { chat_id: chatId, text: r?.ok ? `✅ Publicada: ${r.title}\n${SITE}/blog/${r.slug}` : `❌ Não rolou: ${r?.error || r?.message || 'erro'}` })
        return NextResponse.json({ ok: true })
      }

      // /cotacao <ativo>
      if (cmd === '/cotacao') {
        const NAME: Record<string, string> = { dolar: 'USDBRL', dólar: 'USDBRL', euro: 'EURBRL', libra: 'GBPBRL', bitcoin: 'BTCBRL', btc: 'BTCBRL', ethereum: 'ETHBRL', eth: 'ETHBRL', ibovespa: '^BVSP', ibov: '^BVSP', sp500: '^GSPC', nasdaq: '^IXIC', dow: '^DJI' }
        const arg = text.split(/\s+/)[1]?.toLowerCase()
        const sym = arg && NAME[arg]
        if (!sym) { await tg('sendMessage', { chat_id: chatId, text: 'Uso: /cotacao dolar (ou euro, bitcoin, ibovespa, nasdaq…)' }); return NextResponse.json({ ok: true }) }
        const origin = new URL(request.url).origin
        const data = await fetch(`${origin}/api/quotes`).then(r => r.json()).catch(() => null)
        const q = data?.quotes?.find((x: { symbol: string }) => x.symbol === sym)
        if (!q) { await tg('sendMessage', { chat_id: chatId, text: 'Não consegui a cotação agora.' }); return NextResponse.json({ ok: true }) }
        const pref = (q.kind === 'moeda' || q.kind === 'cripto') ? 'R$ ' : ''
        const v = q.price.toLocaleString('pt-BR', { maximumFractionDigits: q.price >= 1000 ? 0 : 2 })
        await tg('sendMessage', { chat_id: chatId, text: `${q.changePct >= 0 ? '🔺' : '🔻'} *${q.label}*: ${pref}${v} (${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%)`, parse_mode: 'Markdown' })
        return NextResponse.json({ ok: true })
      }

      // Comando /alerta <ativo> <acima|abaixo> <valor>
      if (/^\/alerta(s)?\b/i.test(text)) {
        const SYM: Record<string, string> = {
          dolar: 'USDBRL', dólar: 'USDBRL', euro: 'EURBRL', libra: 'GBPBRL',
          bitcoin: 'BTCBRL', btc: 'BTCBRL', ethereum: 'ETHBRL', eth: 'ETHBRL',
          ibovespa: '^BVSP', ibov: '^BVSP', sp500: '^GSPC', nasdaq: '^IXIC', dow: '^DJI',
        }
        if (/^\/alertas\b/i.test(text)) {
          const list = await sanity.fetch('*[_type=="priceAlert" && active==true]{symbol,condition,value}')
          const txt = list.length
            ? list.map((a: { symbol: string; condition: string; value: number }) => `• ${a.symbol} ${a.condition === 'above' ? '>' : '<'} ${a.value}`).join('\n')
            : 'Nenhum alerta ativo.'
          await tg('sendMessage', { chat_id: chatId, text: `🔔 Alertas ativos:\n${txt}` })
          return NextResponse.json({ ok: true })
        }
        const m = text.match(/^\/alerta\s+(\S+)\s+(acima|above|abaixo|below|>|<)\s+([\d.,]+)/i)
        if (!m) {
          await tg('sendMessage', { chat_id: chatId, text: 'Uso: /alerta dolar acima 5.50\nAtivos: dolar, euro, libra, bitcoin, ethereum, ibovespa, sp500, nasdaq, dow\nVer ativos: /alertas' })
          return NextResponse.json({ ok: true })
        }
        const sym = SYM[m[1].toLowerCase()]
        if (!sym) {
          await tg('sendMessage', { chat_id: chatId, text: `Ativo "${m[1]}" não reconhecido. Use: dolar, euro, libra, bitcoin, ethereum, ibovespa, sp500, nasdaq, dow.` })
          return NextResponse.json({ ok: true })
        }
        const condition = /acima|above|>/i.test(m[2]) ? 'above' : 'below'
        const value = parseFloat(m[3].replace(/\./g, '').replace(',', '.'))
        await sanity.create({ _type: 'priceAlert', symbol: sym, condition, value, active: true })
        await tg('sendMessage', { chat_id: chatId, text: `✅ Alerta criado: ${sym} ${condition === 'above' ? 'acima de' : 'abaixo de'} ${value}\n\nVou te avisar aqui quando bater.` })
        return NextResponse.json({ ok: true })
      }

      if (text.startsWith('/')) return NextResponse.json({ ok: true }) // outros comandos ignorados

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
