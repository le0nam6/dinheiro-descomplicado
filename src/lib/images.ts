/**
 * Regras de imagem de capa.
 *
 * As capas vêm de raspagem de OG de terceiros: g1, UOL, Pexels, CNN, YouTube,
 * Facebook. Numa amostra de 40 posts recentes, 6 (15%) não carregavam — todas
 * de youtube.com e lookaside.fbsbx.com, que respondem HTTP 200 com uma página
 * HTML no lugar da imagem. O navegador então mostra o ícone de imagem quebrada.
 *
 * A defesa é em três camadas: filtrar na entrada o que nunca serve imagem,
 * servir pelo proxy para não depender de hotlink, e cair num placeholder
 * desenhado quando ainda assim falhar.
 */

export const SITE = 'https://portalendinheirados.com.br'

/** Hosts que respondem 200 com HTML em vez de imagem. Não viram capa. */
const HOSTS_INVALIDOS = [
  'youtube.com', 'youtu.be', 'www.youtube.com',
  'lookaside.fbsbx.com', 'facebook.com', 'www.facebook.com',
  'instagram.com', 'www.instagram.com',
  'twitter.com', 'x.com',
]

/** true quando a URL tem cara de imagem de verdade e vale guardar como capa. */
export function ehCapaValida(url: string | null | undefined): boolean {
  if (!url) return false
  let u: URL
  try { u = new URL(url) } catch { return false }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  const host = u.hostname.toLowerCase()
  if (HOSTS_INVALIDOS.some(h => host === h || host.endsWith('.' + h))) return false
  // Página de vídeo e afins não são imagem, mesmo em host permitido.
  if (/\/(watch|shorts|embed|video)(\/|\?|$)/.test(u.pathname + u.search)) return false
  return true
}

/**
 * URL para exibir. Externa passa pelo proxy: evita bloqueio de hotlink, deixa
 * o cache sob nosso controle e dá um único ponto para tratar falha.
 */



/**
 * Termo de busca por categoria, usado quando a capa original falha e
 * precisamos trazer uma foto de verdade do banco (Pexels, depois Unsplash).
 * Em inglês porque é onde os dois bancos têm acervo decente.
 */
const BUSCA_POR_CATEGORIA: Record<string, string> = {
  'notícias': 'brazil business newspaper finance',
  'economia': 'economy finance chart brazil',
  'investimentos': 'investment stock market chart',
  'educação financeira': 'personal finance planning money',
  'ganhar dinheiro': 'entrepreneur working laptop money',
  'empréstimo': 'bank loan contract signing',
  'cartão de crédito': 'credit card payment hands',
  'financiamento': 'house keys mortgage contract',
  'previdência': 'retirement senior couple planning',
}

/** Query de fallback para uma capa, a partir da categoria do post. */
export function buscaDeFallback(categoria?: string | null): string {
  const c = (categoria || '').toLowerCase().trim()
  return BUSCA_POR_CATEGORIA[c] ?? 'finance money brazil business'
}

export function urlDeExibicao(
  url: string | null | undefined,
  categoria?: string | null,
): string {
  const q = encodeURIComponent(buscaDeFallback(categoria))
  // Sem URL guardada, o proxy já entra direto no banco de imagens.
  if (!url) return `/api/img?q=${q}`
  if (url.startsWith('/') || url.startsWith(SITE)) return url
  return `/api/img?url=${encodeURIComponent(url)}&q=${q}`
}
