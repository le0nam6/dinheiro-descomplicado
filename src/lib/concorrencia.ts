/**
 * Barreira de concorrência: contra quem a pauta vai disputar.
 *
 * O critério de relevância pergunta quatro coisas — demanda, proximidade,
 * durabilidade e lacuna. Todas sobre o leitor e sobre o nosso acervo, nenhuma
 * sobre quem já ocupa a primeira página. O buraco apareceu nos dados: das 28
 * pautas publicadas entre 8 e 17/09/2026, quatro miravam consulta cuja resposta
 * é da própria marca. "empréstimo no nubank" devolve seis resultados do
 * nubank.com.br; "como aumentar score no serasa", seis do serasa.com.br. Não é
 * questão de escrever melhor: não há vaga.
 *
 * A checagem é feita na primeira página de verdade, não por lista de marcas.
 * Lista erraria o caso que importa: "quanto ganha motorista de uber" também tem
 * marca, mas a Uber não responde essa pergunta — sites independentes ranqueiam
 * ali, e o nosso está na 9ª posição. Só a SERP sabe a diferença.
 *
 * Custa uma chamada ao Serper por termo, então roda apenas nas finalistas.
 */

export type Serp = {
  /** Domínio que ocupa metade ou mais do topo, quando existe. */
  dominante: string | null
  /** Quantos dos resultados analisados são do domínio mais presente. */
  fatia: number
  /** Quantos domínios distintos aparecem. */
  distintos: number
  /** Os primeiros domínios, em ordem. */
  topo: string[]
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Agrupa subdomínio no domínio-raiz: blog.nubank.com.br conta como nubank.com.br. */
function raiz(host: string): string {
  const p = host.split('.')
  // .com.br, .gov.br e afins têm dois sufixos; o resto, um.
  const n = /\.(com|gov|org|net|edu)\.[a-z]{2}$/.test(host) ? 3 : 2
  return p.slice(-n).join('.')
}

/**
 * Lê os 10 primeiros resultados orgânicos. Devolve null quando não dá para
 * saber — sem chave, erro de rede, resposta vazia. Quem chama trata null como
 * "não sei", nunca como "está livre": travar a pauta por falha de API seria
 * trocar um filtro por um bloqueio.
 */
export async function analisarSerp(termo: string): Promise<Serp | null> {
  const key = process.env.SERPER_API_KEY
  if (!key) return null
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: termo, gl: 'br', hl: 'pt-br', num: 10 }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!r.ok) return null
    const d = await r.json() as { organic?: { link: string }[] }
    const hosts = (d.organic ?? []).slice(0, 10).map(o => raiz(dominio(o.link))).filter(Boolean)
    if (hosts.length < 5) return null

    const conta = new Map<string, number>()
    for (const h of hosts) conta.set(h, (conta.get(h) ?? 0) + 1)
    const [maior, fatia] = [...conta.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      dominante: fatia >= Math.ceil(hosts.length / 2) ? maior : null,
      fatia,
      distintos: conta.size,
      topo: hosts.slice(0, 3),
    }
  } catch {
    return null
  }
}

/**
 * Metade ou mais da primeira página no mesmo domínio significa consulta com
 * dono. Também vale quando os três primeiros são do mesmo lugar: o clique
 * morre antes de chegar no quarto.
 */
export function temDono(s: Serp): boolean {
  if (s.dominante) return true
  return s.topo.length === 3 && new Set(s.topo).size === 1
}

/** Frase curta para o cartão do Telegram. */
export function descrever(s: Serp | null): string {
  if (!s) return 'concorrência não verificada'
  if (s.dominante) return `${s.fatia} dos 10 primeiros são ${s.dominante}`
  return `${s.distintos} domínios diferentes no topo`
}
