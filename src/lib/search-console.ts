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
