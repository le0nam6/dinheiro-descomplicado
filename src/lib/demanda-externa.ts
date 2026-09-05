/**
 * Demanda externa de busca — o que as pessoas procuram, fora do universo do site.
 *
 * As duas fontes anteriores do cron de pautas eram autorreferentes: o Search
 * Console só mostra onde o site já aparece, e o "as pessoas também perguntam"
 * era semeado por termos escritos à mão. O sistema nunca olhava para fora, e
 * por isso girava em torno de si mesmo.
 *
 * Aqui entram duas fontes de fora, com pesos bem diferentes:
 *
 * AUTOCOMPLETE é o motor. Devolve a consulta literal que as pessoas digitam,
 * ordenada por volume real — "como sair das dívidas com agiota", "quanto rende
 * 100 mil na poupança", "vale a pena investir em ouro em 2026". É cauda longa
 * perene, que é o formato onde um site novo consegue competir.
 *
 * TRENDS é secundário e quase sempre descartado. A tendência diária brasileira
 * é dominada por futebol e televisão, e é perecível por definição — o oposto do
 * que o critério de durabilidade premia. Só entra quando um assunto de finanças
 * realmente estoura, o que é raro mas vale capturar.
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'

/** Sugestões do Google para um prefixo. É a demanda de busca em estado bruto. */
export async function autocompletar(prefixo: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(prefixo)}`
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) })
    if (!r.ok) return []
    // A resposta vem como [prefixo, [sugestões], ...] em JSON solto.
    const d = await r.json() as [string, string[]]
    return Array.isArray(d?.[1]) ? d[1] : []
  } catch {
    return []
  }
}

/**
 * Expande um tema em várias consultas reais.
 *
 * Um prefixo sozinho devolve ~10 sugestões, quase sempre as mesmas. Somando
 * uma letra ou palavra de continuação, o Google abre ramos diferentes da árvore
 * de demanda: "como investir em a" traz ações, "como investir em c" traz CDB.
 * É assim que se colhe amplitude em vez de repetir o topo da lista.
 */
export async function expandir(
  base: string,
  sufixos: string[],
): Promise<{ termo: string; posicaoNaLista: number; base: string }[]> {
  const lotes = await Promise.all(
    sufixos.map(sfx => autocompletar(`${base} ${sfx}`.trim())),
  )
  const vistos = new Set<string>()
  const saida: { termo: string; posicaoNaLista: number; base: string }[] = []
  // A ordem importa: o Google lista as sugestões por volume de busca, então a
  // posição é o único sinal de demanda disponível para termo que o site ainda
  // não tem no Search Console. Sem isso, todas empatam e uma base só ocupa a
  // lista inteira.
  for (const grupo of [await autocompletar(base), ...lotes]) {
    grupo.forEach((termo, i) => {
      const k = termo.toLowerCase().trim()
      if (k && !vistos.has(k)) { vistos.add(k); saida.push({ termo, posicaoNaLista: i, base }) }
    })
  }
  return saida
}

/** Letras e continuações que abrem ramos diferentes da árvore de sugestões. */
export const SUFIXOS = ['a', 'c', 'd', 'e', 'i', 'm', 'p', 'q', 'r', 's', 't', 'v']

/**
 * Tendências do dia no Brasil, via RSS do Google Trends.
 *
 * Devolve tudo — cabe a quem chama filtrar pelo território. Na prática a maior
 * parte é futebol e TV, e só uma fração pequena passa pelo filtro de finanças.
 */
export async function tendenciasBrasil(): Promise<{ termo: string; volume: string }[]> {
  try {
    const r = await fetch('https://trends.google.com/trending/rss?geo=BR', {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
    })
    if (!r.ok) return []
    const xml = await r.text()
    const itens: { termo: string; volume: string }[] = []
    // RSS simples e estável o bastante para regex; puxar um parser de XML só
    // para dois campos não se paga.
    const re = /<title>([^<]+)<\/title>\s*<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(xml)) !== null) {
      itens.push({ termo: m[1].trim(), volume: m[2].trim() })
    }
    return itens
  } catch {
    return []
  }
}
