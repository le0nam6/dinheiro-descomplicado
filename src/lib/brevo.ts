const API = 'https://api.brevo.com/v3'

function key() { return process.env.BREVO_API_KEY! }
function listId() { return parseInt(process.env.BREVO_LIST_ID || '2') }
function sender() {
  return {
    name: 'Endinheirados 💸',
    email: process.env.BREVO_SENDER_EMAIL || 'newsletter@endinheirados.cc',
  }
}

function h() {
  return { 'api-key': key(), 'Content-Type': 'application/json' }
}

export async function sendWelcomeEmail(email: string, referralCode: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) return
  const referralLink = `https://endinheirados.cc/indicacao/${referralCode}`
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <tr><td style="background:#16a34a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
    <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-.02em;">Endinheirados</p>
    <p style="margin:6px 0 0;font-size:13px;color:#bbf7d0;">Sua edição diária de finanças</p>
  </td></tr>

  <tr><td style="background:#fff;padding:36px 40px;text-align:center;">
    <p style="margin:0 0 8px;font-size:36px;">🎉</p>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111827;">Bem-vindo(a) ao Endinheirados!</h1>
    <p style="margin:0 0 20px;font-size:16px;color:#4b5563;line-height:1.7;">
      A partir de agora, todo dia às <strong>5h da manhã</strong> você recebe as principais notícias de finanças — explicadas de forma simples, em menos de 5 minutos.
    </p>
    <a href="https://endinheirados.cc" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Explorar o site →</a>
  </td></tr>

  <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:0;padding:28px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#15803d;">Indique amigos e ganhe recompensas</p>
    <p style="margin:0 0 14px;font-size:14px;color:#4b5563;line-height:1.6;">
      Cada amigo que se inscrever pelo seu link desbloqueia uma recompensa exclusiva — grupo VIP, planilha personalizada, kit digital e muito mais.
    </p>
    <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:10px 16px;margin:0 auto 16px;max-width:360px;word-break:break-all;font-size:13px;color:#374151;">
      ${referralLink}
    </div>
    <a href="${referralLink}" style="display:inline-block;background:#15803d;color:#fff;font-weight:700;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;">Ver minhas metas de indicação →</a>
  </td></tr>

  <tr><td style="background:#fff;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Você recebe esse e-mail porque se inscreveu em <a href="https://endinheirados.cc" style="color:#9ca3af;">endinheirados.cc</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  await fetch(`${API}/smtp/email`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      sender: sender(),
      to: [{ email }],
      subject: '🎉 Bem-vindo(a) ao Endinheirados!',
      htmlContent: html,
    }),
  }).catch(() => {})
}

export async function sendReferralLinkEmail(email: string, referralCode: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) return
  const link = `https://endinheirados.cc/indicacao/${referralCode}`
  await fetch(`${API}/smtp/email`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      sender: sender(),
      to: [{ email }],
      subject: 'Seu link de indicações — Endinheirados',
      htmlContent: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px 16px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#16a34a;padding:24px 36px;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:900;color:#fff;">Endinheirados</p>
  </td></tr>
  <tr><td style="padding:32px 36px;text-align:center;">
    <p style="margin:0 0 8px;font-size:24px;">🔗</p>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;">Aqui está o seu link</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
      Clique abaixo para acessar seu painel de indicações e ver quantas pessoas você já trouxe para o Endinheirados.
    </p>
    <a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Acessar meu painel →</a>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Ou copie: ${link}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
    }),
  }).catch(() => {})
}

export async function addContact(email: string, attributes: Record<string, string> = {}): Promise<void> {
  if (!process.env.BREVO_API_KEY) return
  await fetch(`${API}/contacts`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      email,
      listIds: [listId()],
      updateEnabled: true,
      attributes: { SOURCE: 'site', ...attributes },
    }),
  }).catch(() => {})
}

export type EditionParams = {
  date: string
  title: string
  url: string
  punchline?: string
  intro?: string
  closing?: string
  readingTime?: number
  marketSnapshot?: Array<{ label: string; value: string; changePct: number }>
  stories: Array<{
    emoji?: string
    tag?: string
    headline?: string
    hook?: string
    what?: string
    why?: string
    image?: { url?: string; alt?: string; credit?: string }
  }>
  featuredPosts?: Array<{ title: string; slug: string; excerpt?: string; category?: string }>
  wordOfDay?: { word?: string; meaning?: string; application?: string }
  curiosity?: string
  recommendation?: string
  reflection?: string
}

async function fetchListContacts(): Promise<Array<{ email: string; referralCode: string }>> {
  const id = listId()
  const contacts: Array<{ email: string; referralCode: string }> = []
  let offset = 0
  const limit = 500
  while (true) {
    const res = await fetch(`${API}/contacts?listId=${id}&limit=${limit}&offset=${offset}&sort=desc`, {
      headers: { 'api-key': key() },
    })
    const data = await res.json().catch(() => null)
    const batch: Array<{ email: string; attributes?: Record<string, string> }> = data?.contacts ?? []
    for (const c of batch) {
      if (c.email) contacts.push({ email: c.email, referralCode: c.attributes?.REFERRAL_CODE || '' })
    }
    if (batch.length < limit) break
    offset += limit
  }
  return contacts
}

export async function sendEditionCampaign(p: EditionParams): Promise<void> {
  if (!process.env.BREVO_API_KEY) return

  const contacts = await fetchListContacts()
  if (contacts.length === 0) throw new Error('Lista Brevo vazia — nenhum contacto encontrado')

  const subject = p.title || p.punchline
  const templateHtml = buildEditionHtml(p)

  // Brevo messageVersions: até 1000 destinatários, cada um com params individuais
  const messageVersions = contacts.map(c => ({
    to: [{ email: c.email }],
    params: { REFERRAL_CODE: c.referralCode },
  }))

  // Substitui {{ contact.REFERRAL_CODE }} pelo placeholder do sistema de params
  const htmlWithParams = templateHtml.replaceAll('{{ contact.REFERRAL_CODE }}', '{{params.REFERRAL_CODE}}')

  const res = await fetch(`${API}/smtp/email`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      sender: sender(),
      subject,
      htmlContent: htmlWithParams,
      messageVersions,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = `Brevo transactional send failed (${res.status}): ${body}`
    console.error('[sendEditionCampaign]', err)
    throw new Error(err)
  }
}

async function sendTransactional(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) return
  await fetch(`${API}/smtp/email`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({
      sender: sender(),
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  }).catch(() => {})
}

export async function sendMilestoneEmail(email: string, referralCode: string, milestone: { emoji: string; label: string; reward: string; count: number }): Promise<void> {
  const referralLink = `https://endinheirados.cc/indicacao/${referralCode}`
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#16a34a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
    <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-.02em;">Endinheirados</p>
    <p style="margin:6px 0 0;font-size:13px;color:#bbf7d0;">Sua edição diária de finanças</p>
  </td></tr>
  <tr><td style="background:#fff;padding:36px 40px;text-align:center;">
    <p style="margin:0 0 8px;font-size:48px;">${milestone.emoji}</p>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#111827;">Você desbloqueou: ${esc(milestone.label)}!</h1>
    <p style="margin:0 0 20px;font-size:16px;color:#4b5563;line-height:1.7;">Você indicou <strong>${milestone.count} pessoa${milestone.count > 1 ? 's' : ''}</strong> para o Endinheirados. Muito obrigado!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 24px;text-align:left;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.08em;">Sua recompensa</p>
      <p style="margin:0;font-size:16px;color:#111827;line-height:1.6;">${esc(milestone.reward)}</p>
    </div>
    <a href="${referralLink}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Ver meu painel de indicações →</a>
  </td></tr>
  <tr><td style="padding:20px 40px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Você recebe esse e-mail porque se inscreveu em <a href="https://endinheirados.cc" style="color:#9ca3af;">endinheirados.cc</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
  await sendTransactional(email, `${milestone.emoji} Você desbloqueou "${milestone.label}"!`, html)
}

export async function sendEditionPreviewEmail(to: string, p: EditionParams): Promise<void> {
  const html = buildEditionHtml(p)
  await sendTransactional(to, `[PRÉVIA] ${p.punchline || p.title}`, html)
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
  } catch { return iso }
}

export function buildEditionHtml(p: EditionParams): string {
  const GREEN = '#16a34a'
  const DARK = '#14532d'

  const previewText = p.stories
    .slice(0, 3)
    .map(s => s.headline)
    .filter(Boolean)
    .join(' · ')
    + (p.stories.length > 3 ? ' e mais.' : '.')

  const marketHtml = p.marketSnapshot?.length ? `
  <tr><td style="background:#ffffff;padding:8px 40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111827;border-radius:16px;">
      <tr><td style="padding:18px 20px 6px;">
        <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">Termômetro do mercado</p>
      </td></tr>
      <tr><td style="padding:4px 12px 16px;text-align:center;font-size:0;">
        ${p.marketSnapshot.map(q => `<div style="display:inline-block;width:25%;min-width:108px;vertical-align:top;padding:8px 4px;box-sizing:border-box;text-align:center;">
          <p style="margin:0;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;font-weight:600;white-space:nowrap;">${esc(q.label)}</p>
          <p style="margin:4px 0 2px;font-size:14px;font-weight:700;color:#ffffff;white-space:nowrap;">${esc(q.value)}</p>
          <p style="margin:0;font-size:11px;font-weight:700;color:${q.changePct >= 0 ? '#4ade80' : '#f87171'};white-space:nowrap;">${q.changePct >= 0 ? '▲' : '▼'} ${Math.abs(q.changePct).toFixed(2)}%</p>
        </div>`).join('')}
      </td></tr>
    </table>
  </td></tr>` : ''

  const summaryHtml = p.stories.length > 0 ? `
  <tr><td style="background:#ffffff;padding:4px 40px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:.06em;color:#6b7280;text-transform:uppercase;">Nesta edição</p>
        ${p.stories.map(s => `<p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.45;">${esc(s.emoji || '•')} ${esc(s.headline || '')}</p>`).join('')}
      </td></tr>
    </table>
  </td></tr>` : ''

  // Ativação do programa de indicação inserida no meio do e-mail (após a 2ª matéria), como no site
  const midReferralHtml = `
  <tr><td style="padding:8px 0 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;">
      <tr><td style="padding:22px 24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:24px;">💸</p>
        <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#111827;line-height:1.3;">Curtindo a edição? Indica pra um amigo.</p>
        <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">Cada amigo que assinar pelo seu link conta como indicação. No topo da trilha tem uma consultoria financeira 1:1 de graça.</p>
        <a href="https://endinheirados.cc/indicacao/{{ contact.REFERRAL_CODE }}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:800;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">Pegar meu link de indicação →</a>
      </td></tr>
    </table>
  </td></tr>`

  const storiesHtml = p.stories.map((s, idx) => {
    // Merge tag não pode ser encodeURIComponent — Brevo substitui depois
    const staticPart = encodeURIComponent(`${s.headline || ''}\n\nLi no Endinheirados:\nhttps://endinheirados.cc/indicacao/`)
    const waUrl = `https://wa.me/?text=${staticPart}{{ contact.REFERRAL_CODE }}`
    const story = `
  <tr><td style="padding:28px 0;border-bottom:1px solid #e5e7eb;">
    ${(s.emoji || s.tag) ? `<p style="margin:0 0 10px;font-size:0;">${s.emoji ? `<span style="font-size:22px;vertical-align:middle;">${esc(s.emoji)}</span>` : ''}${s.tag ? `<span style="display:inline-block;vertical-align:middle;margin-left:${s.emoji ? '8px' : '0'};background:#f0fdf4;color:#15803d;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 11px;border-radius:999px;">${esc(s.tag)}</span>` : ''}</p>` : ''}
    ${s.headline ? `<h2 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#111827;line-height:1.3;">${esc(s.headline)}</h2>` : ''}
    ${s.hook ? `<p style="margin:0 0 14px;font-size:17px;color:#6b7280;line-height:1.6;">${esc(s.hook)}</p>` : ''}
    ${s.image?.url ? `<img src="${s.image.url}" alt="${esc(s.image.alt || s.headline || '')}" width="520" style="width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;display:block;margin:0 0 14px;" />` : ''}
    ${s.what ? `<p style="margin:0 0 12px;font-size:16px;color:#1f2937;line-height:1.7;">${esc(s.what)}</p>` : ''}
    ${s.why ? `<p style="margin:0 0 14px;font-size:15px;font-style:italic;color:#4b5563;line-height:1.7;">${esc(s.why)}</p>` : ''}
    <a href="${waUrl}" style="display:inline-block;background:#25d366;color:#fff;font-size:12px;font-weight:700;padding:7px 14px;border-radius:7px;text-decoration:none;">📲 Compartilhar no WhatsApp</a>
  </td></tr>`
    return idx === 1 ? story + midReferralHtml : story
  }).join('')

  const wordHtml = p.wordOfDay?.word ? `
  <tr><td style="padding:0 0 14px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:16px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.06em;color:${GREEN};text-transform:uppercase;">📚 Palavra do dia</p>
        <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#111827;">${esc(p.wordOfDay.word)}</p>
        ${p.wordOfDay.meaning ? `<p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.6;">${esc(p.wordOfDay.meaning)}</p>` : ''}
        ${p.wordOfDay.application ? `<p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">${esc(p.wordOfDay.application)}</p>` : ''}
      </td></tr>
    </table>
  </td></tr>` : ''

  const featuredPostsHtml = p.featuredPosts?.length ? `
  <tr><td style="background:#fafaf8;border-top:2px solid #e5e7eb;border-bottom:2px solid #e5e7eb;padding:28px 40px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;color:#9ca3af;text-transform:uppercase;">Posts que você não pode deixar de ler</p>
    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Do nosso arquivo — para ir além das notícias de hoje</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${p.featuredPosts.slice(0, 3).map((post, i) => `
      <tr><td style="padding-top:${i > 0 ? '20px' : '0'};padding-bottom:20px;${i < 2 ? 'border-bottom:1px solid #e5e7eb;' : ''}">
        ${post.category ? `<p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.08em;color:${GREEN};text-transform:uppercase;">${esc(post.category)}</p>` : ''}
        <a href="https://endinheirados.cc/blog/${esc(post.slug)}" style="text-decoration:none;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#111827;line-height:1.3;">${esc(post.title)}</p>
        </a>
        ${post.excerpt ? `<p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;">${esc(post.excerpt.slice(0, 120))}${post.excerpt.length > 120 ? '…' : ''}</p>` : ''}
        <a href="https://endinheirados.cc/blog/${esc(post.slug)}" style="font-size:13px;font-weight:700;color:${GREEN};text-decoration:none;">Ler artigo →</a>
      </td></tr>`).join('')}
    </table>
  </td></tr>` : ''

  const curiosityHtml = p.curiosity ? `
  <tr><td style="padding:0 0 14px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fef3c7;border-radius:16px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.06em;color:#b45309;text-transform:uppercase;">💡 Curiosidade do dia</p>
        <p style="margin:0;font-size:15px;color:#1f2937;line-height:1.65;">${esc(p.curiosity)}</p>
      </td></tr>
    </table>
  </td></tr>` : ''

  const recommendationHtml = p.recommendation ? `
  <tr><td style="padding:0 0 14px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:16px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.06em;color:#4338ca;text-transform:uppercase;">🍿 Recomendação de sexta</p>
        <p style="margin:0;font-size:15px;color:#1f2937;line-height:1.65;">${esc(p.recommendation)}</p>
      </td></tr>
    </table>
  </td></tr>` : ''

  const reflectionHtml = p.reflection ? `
  <tr><td style="padding:0 0 14px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111827;border-radius:16px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.06em;color:#4ade80;text-transform:uppercase;">🌅 Reflexão de domingo</p>
        <p style="margin:0;font-size:15px;color:#f3f4f6;line-height:1.65;">${esc(p.reflection)}</p>
      </td></tr>
    </table>
  </td></tr>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(p.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;text-size-adjust:100%;">
<!-- Preheader: aparece como preview text na caixa de entrada -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f3f4f6;">${esc(previewText)}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- Header: logo transparente sobre fundo verde -->
  <tr><td style="background:${GREEN};border-radius:12px 12px 0 0;padding:4px 40px 8px;text-align:center;">
    <a href="https://endinheirados.cc" style="display:inline-block;">
      <img src="https://endinheirados.cc/logo-email.png" alt="Endinheirados" width="220" style="height:auto;display:block;margin:0 auto;" />
    </a>
    <p style="margin:2px 0 1px;font-size:11px;color:#bbf7d0;letter-spacing:.06em;text-transform:uppercase;font-weight:700;">O melhor portal de finanças da nova geração</p>
    <p style="margin:0;font-size:13px;color:#dcfce7;">${fmtDate(p.date)}${p.readingTime ? ` · ${p.readingTime} min de leitura` : ''}</p>
  </td></tr>

  <!-- Intro -->
  <tr><td style="background:#ffffff;padding:32px 40px 20px;">
    ${p.title ? `<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${GREEN};text-transform:uppercase;letter-spacing:.06em;">${esc(p.title)}</p>` : ''}
    ${p.punchline ? `<p style="margin:0 0 14px;padding-left:16px;border-left:4px solid #22c55e;font-size:23px;font-weight:800;color:#111827;line-height:1.3;">${esc(p.punchline)}</p>` : ''}
    ${p.intro ? `<p style="margin:0;font-size:16px;color:#4b5563;line-height:1.75;">${esc(p.intro)}</p>` : ''}
  </td></tr>

  <!-- Termômetro do mercado -->
  ${marketHtml}

  <!-- Sumário das stories -->
  ${summaryHtml}

  <!-- Stories -->
  <tr><td style="background:#ffffff;padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">${storiesHtml}</table>
  </td></tr>

  <!-- Posts em destaque -->
  ${featuredPostsHtml}

  <!-- Extras -->
  <tr><td style="background:#ffffff;padding:24px 40px 8px;">
    ${(p.wordOfDay?.word || p.curiosity || p.recommendation || p.reflection) ? `<p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.06em;color:#9ca3af;text-transform:uppercase;">Para fechar com estilo</p>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${wordHtml}${curiosityHtml}${recommendationHtml}${reflectionHtml}
    </table>
  </td></tr>

  <!-- Closing + CTA -->
  <tr><td style="background:#ffffff;padding:16px 40px 36px;text-align:center;">
    ${p.closing ? `<p style="margin:0 0 8px;font-size:15px;color:#6b7280;line-height:1.7;font-style:italic;">${esc(p.closing)}</p>` : ''}
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;">Até amanhã. 👋</p>
    <a href="${p.url}" style="display:inline-block;background:${GREEN};color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:.01em;">Leia a edição completa →</a>
  </td></tr>

  <!-- Sobre nós -->
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;color:#9ca3af;text-transform:uppercase;">Sobre o Endinheirados</p>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">Uma newsletter diária sobre o mercado financeiro e o bolso do brasileiro — explicado de forma simples, rápida e sem enrolação. Publicado todo dia às 5h da manhã.</p>
  </td></tr>

  <!-- Spacer -->
  <tr><td style="height:8px;"></td></tr>

  <!-- Referral CTA -->
  <tr><td style="background:${DARK};border-radius:12px;padding:32px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:22px;">💸</p>
    <h3 style="margin:0 0 10px;font-size:20px;font-weight:900;color:#ffffff;line-height:1.3;">Ganhe recompensas indicando amigos</h3>
    <p style="margin:0 0 6px;font-size:15px;color:#bbf7d0;line-height:1.7;">Cada pessoa que você indicar que se inscrever conta como uma indicação confirmada. Acumule e desbloqueie prêmios reais — planilhas exclusivas, grupos fechados, kits digitais e muito mais.</p>
    <p style="margin:0 0 20px;font-size:13px;color:#86efac;">Já temos inscritos ganhando. Você ainda não começou.</p>
    <a href="https://endinheirados.cc/indicacao/{{ contact.REFERRAL_CODE }}" style="display:inline-block;background:#16a34a;color:#fff;font-size:15px;font-weight:800;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:.01em;">Ver meu link de indicação →</a>
    <p style="margin:12px 0 0;font-size:11px;color:#4ade80;word-break:break-all;">endinheirados.cc/indicacao/{{ contact.REFERRAL_CODE }}</p>
  </td></tr>

  <!-- Spacer -->
  <tr><td style="height:16px;"></td></tr>

  <!-- Footer -->
  <tr><td style="padding:0 40px 24px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Você recebe esse e-mail porque se inscreveu em <a href="https://endinheirados.cc" style="color:#9ca3af;">endinheirados.cc</a></p>
    <p style="margin:0;font-size:12px;color:#9ca3af;"><a href="{unsubscribe}" style="color:#9ca3af;text-decoration:underline;">Cancelar inscrição</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
