/**
 * Leitura do Google Search Console.
 *
 * É a única fonte de dado com sinal real hoje. O GA4 está instalado, mas as
 * visitas registradas são do próprio editor — não há audiência para aprender
 * dela ainda. O Search Console, mesmo sem cliques, registra toda vez que uma
 * página apareceu numa busca e em que posição, e é isso que diz o que o Google
 * já considera o site capaz de responder.
 *
 * Usa a mesma service account da Indexing API. Para funcionar precisa de dois
 * passos feitos uma vez no painel do Google:
 *   1. Ativar a Search Console API no projeto do Cloud
 *   2. Adicionar o e-mail da service account como usuário no Search Console
 */
import { GoogleAuth } from 'google-auth-library'

export const SITE_GSC = 'https://portalendinheirados.com.br/'

export type LinhaConsulta = {
  consulta: string
  impressoes: number
  cliques: number
  ctr: number
  posicao: number
}

async function token(): Promise<string | null> {
  const client_email = process.env.GOOGLE_INDEXING_CLIENT_EMAIL
  const private_key = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!client_email || !private_key) return null
  try {
    const auth = new GoogleAuth({
      credentials: { client_email, private_key },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    const c = await auth.getClient()
    const { token } = await (c as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken()
    return token ?? null
  } catch {
    return null
  }
}

function diasAtras(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Consultas em que o site apareceu na busca. `dimensao` 'query' traz o termo,
 * 'page' traz a URL. O Search Console tem ~2 dias de atraso, por isso a janela
 * termina em D-2.
 */
export async function consultasDoSite(
  { dias = 90, limite = 500, dimensao = 'query' as 'query' | 'page' } = {},
): Promise<LinhaConsulta[]> {
  const t = await token()
  if (!t) return []

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_GSC)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: diasAtras(dias),
        endDate: diasAtras(2),
        dimensions: [dimensao],
        rowLimit: limite,
        type: 'web',
      }),
      signal: AbortSignal.timeout(30_000),
    },
  )

  if (!res.ok) {
    const corpo = await res.text().catch(() => '')
    console.error(`[gsc] ${res.status}: ${corpo.slice(0, 200)}`)
    return []
  }

  const d = await res.json() as {
    rows?: { keys: string[]; impressions: number; clicks: number; ctr: number; position: number }[]
  }
  return (d.rows ?? []).map(r => ({
    consulta: r.keys[0],
    impressoes: r.impressions,
    cliques: r.clicks,
    ctr: r.ctr,
    posicao: r.position,
  }))
}

/** true quando a API está habilitada e a service account tem acesso. */
export async function gscDisponivel(): Promise<boolean> {
  return (await consultasDoSite({ dias: 7, limite: 1 })).length >= 0 && (await token()) !== null
}


// ─── Relatório ───────────────────────────────────────────────────────────────

/** Territórios centrais do portal: se estes seguem enterrados, é o alerta real. */
const CENTRAIS = [
  'juros compostos', 'fundo de emergência', 'como investir', 'score de crédito',
  'renda fixa', 'tesouro direto', 'sair das dívidas', 'imposto de renda',
  'previdência privada', 'cartão de crédito', 'pix',
]

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function agregar(linhas: LinhaConsulta[]) {
  const impressoes = linhas.reduce((s, l) => s + l.impressoes, 0)
  const cliques = linhas.reduce((s, l) => s + l.cliques, 0)
  // Posição ponderada por impressão: consulta com 300 impressões pesa mais que
  // uma com 1, o que a média simples do painel do Google ignora.
  const posicao = impressoes
    ? linhas.reduce((s, l) => s + l.posicao * l.impressoes, 0) / impressoes
    : 0
  return { impressoes, cliques, posicao, consultas: linhas.length }
}

/**
 * Monta o relatório de busca em HTML do Telegram. Usado tanto pelo cron
 * semanal quanto pelo comando /busca, para os dois nunca divergirem.
 */
export async function relatorioDeBusca(dias = 7): Promise<string> {
  const [atual, dobro] = await Promise.all([
    consultasDoSite({ dias, limite: 1000 }),
    consultasDoSite({ dias: dias * 2, limite: 1000 }),
  ])

  if (!atual.length && !dobro.length) {
    return '<b>Busca</b>\n\nSem dados do Search Console. Verifique se a API segue ativa e se a service account mantém acesso.'
  }

  const agora = agregar(atual)
  const tudo = agregar(dobro)
  const antes = {
    impressoes: Math.max(0, tudo.impressoes - agora.impressoes),
    cliques: Math.max(0, tudo.cliques - agora.cliques),
  }
  const varia = (a: number, b: number) => {
    if (!b) return a ? 'novo' : '—'
    const p = Math.round(((a - b) / b) * 100)
    return p === 0 ? 'estável' : `${p > 0 ? '+' : ''}${p}%`
  }

  const out: string[] = [`<b>Busca — últimos ${dias} dias</b>`, '']
  out.push(`Impressões: <b>${agora.impressoes}</b> (${varia(agora.impressoes, antes.impressoes)})`)
  out.push(`Cliques: <b>${agora.cliques}</b> (${varia(agora.cliques, antes.cliques)})`)
  out.push(`Posição média: <b>${agora.posicao.toFixed(1)}</b>`)
  out.push(`Consultas distintas: ${agora.consultas}`)

  const topo = atual.slice().sort((a, b) => b.impressoes - a.impressoes).slice(0, 5)
  if (topo.length) {
    out.push('', '<b>Mais vistas</b>')
    for (const l of topo) out.push(`${Math.round(l.posicao)}ª · ${l.impressoes} impr · ${esc(l.consulta.slice(0, 40))}`)
  }

  const perto = atual
    .filter(l => l.posicao >= 5 && l.posicao <= 20 && l.impressoes >= 2)
    .sort((a, b) => b.impressoes - a.impressoes).slice(0, 5)
  if (perto.length) {
    out.push('', '<b>Perto da página 1</b>')
    for (const l of perto) out.push(`${Math.round(l.posicao)}ª · ${l.impressoes} impr · ${esc(l.consulta.slice(0, 40))}`)
  }

  const enterrados = atual
    .filter(l => l.posicao > 30 && CENTRAIS.some(c => l.consulta.toLowerCase().includes(c)))
    .sort((a, b) => b.impressoes - a.impressoes).slice(0, 4)
  if (enterrados.length) {
    out.push('', '<b>Tema central enterrado</b>')
    for (const l of enterrados) out.push(`${Math.round(l.posicao)}ª · ${l.impressoes} impr · ${esc(l.consulta.slice(0, 40))}`)
    out.push('<i>A página já existe. Reescrever costuma render mais que publicar tema novo.</i>')
  }

  if (!agora.impressoes) {
    out.push('', '⚠️ <b>Zero impressões no período.</b> Verifique ações manuais no Search Console.')
  }
  return out.join('\n')
}
