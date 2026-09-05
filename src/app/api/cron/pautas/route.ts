/**
 * Cron de pautas — pesquisa o que vale escrever e manda para você decidir.
 *
 * O pipeline vinha escolhendo tema sozinho, a partir de RSS, e o resultado
 * aparece nos números: 980 posts, 4.990 impressões em 90 dias, posição média
 * 25. Cerca de 5 impressões por post, na terceira página da busca.
 *
 * A causa é de estratégia, não de execução: 724 dos 980 são notícia perecível,
 * que disputa o mesmo fato com G1, InfoMoney e Exame — veículos com anos de
 * autoridade que publicam em minutos. Domínio de três meses não ganha essa.
 *
 * Este cron inverte a lógica. Em vez de perguntar "o que saiu no RSS hoje",
 * pergunta "em que o Google já quase nos coloca na primeira página" e "que
 * pergunta o leitor faz que ninguém respondeu direito". Depois manda as
 * melhores para o Telegram — a decisão final é sua, não da máquina.
 *
 * Nada é publicado aqui. O que você aprovar entra na fila editorial e o cron
 * /api/cron/original escreve a partir dela.
 */
import { NextResponse, after } from 'next/server'
import { consultasDoSite } from '@/lib/search-console'
import { ranquear, type Candidata, type PautaPontuada } from '@/lib/relevancia'
import { sanity, tgSendMessage, tgConfigured, tgAlert } from '@/lib/publish-core'

export const maxDuration = 300

/** Quantas pautas mandar por rodada. Poucas, para a decisão ser rápida. */
const QUANTAS = 6

// ─── Fontes de candidata ─────────────────────────────────────────────────────

/**
 * Search Console: o que o site já aparece. É a fonte mais valiosa porque
 * carrega posição — dá para saber o que está a poucas posições da página 1.
 */
async function doSearchConsole(): Promise<Candidata[]> {
  const linhas = await consultasDoSite({ dias: 90, limite: 500 })
  return linhas
    // Termo com 1 impressão é ruído; abaixo da 60ª posição não se recupera com um post.
    .filter(l => l.impressoes >= 3 && l.posicao <= 60)
    .map(l => ({
      termo: l.consulta,
      impressoes: l.impressoes,
      posicao: l.posicao,
      origem: 'search-console' as const,
    }))
}

/**
 * Buscas relacionadas do Google, via Serper. Cobre a lacuna do Search Console:
 * termo em que o site ainda não aparece de jeito nenhum não tem linha lá.
 */
async function dasBuscasRelacionadas(): Promise<Candidata[]> {
  const chave = process.env.SERPER_API_KEY
  if (!chave) return []

  // Sementes: os territórios em que o portal tem alguma chance real.
  const sementes = [
    'como sair das dívidas', 'como investir do zero', 'fundo de emergência',
    'imposto de renda', 'score de crédito', 'previdência privada',
  ]
  const saida: Candidata[] = []

  for (const semente of sementes) {
    try {
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': chave, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: semente, gl: 'br', hl: 'pt-br', num: 10 }),
        signal: AbortSignal.timeout(15_000),
      })
      const d = await r.json() as {
        relatedSearches?: { query: string }[]
        peopleAlsoAsk?: { question: string }[]
      }
      // "As pessoas também perguntam" é ouro para cauda longa: é a pergunta
      // literal do leitor, na forma em que ele digita.
      for (const p of d.peopleAlsoAsk ?? []) {
        saida.push({ termo: p.question, origem: 'busca-relacionada' })
      }
      for (const rs of d.relatedSearches ?? []) {
        saida.push({ termo: rs.query, origem: 'busca-relacionada' })
      }
    } catch {
      // uma semente falhar não derruba a rodada
    }
  }
  return saida
}

// ─── Cruzamento com o que já existe ──────────────────────────────────────────

/**
 * Mede o quanto o assunto já foi coberto, comparando com os títulos já
 * publicados. É a mesma ideia da trava de duplicata do cron de notícia:
 * sobreposição de palavras longas. Determinístico e sem custo de embedding —
 * o RAG aqui não ajudaria, porque ele devolve texto para prompt, não um número.
 *
 * É o que impede sugerir a décima variação do mesmo tema, defeito que já rendeu
 * 12 grupos de duplicata no acervo.
 */
function significativas(t: string): Set<string> {
  return new Set(
    t.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(p => p.length > 4),
  )
}

async function marcarCobertura(cs: Candidata[]): Promise<Candidata[]> {
  const titulos: string[] = await sanity.fetch(
    `*[_type=="post" && defined(title)]|order(publishedAt desc)[0...400].title`,
  ).catch(() => [])
  const indice = titulos.map(significativas)

  return cs.map(c => {
    const termo = significativas(c.termo)
    if (!termo.size) return { ...c, jaCoberto: 0 }
    let melhor = 0
    for (const t of indice) {
      const comuns = [...termo].filter(p => t.has(p)).length
      melhor = Math.max(melhor, comuns / termo.size)
      if (melhor === 1) break
    }
    return { ...c, jaCoberto: melhor }
  })
}

// ─── Telegram ────────────────────────────────────────────────────────────────

function cartao(p: PautaPontuada, i: number): string {
  const origem = p.origem === 'search-console' ? 'Search Console' : 'Busca do Google'
  return [
    `<b>${i + 1}. ${p.termo}</b>`,
    `nota ${p.nota}/100 · ${origem}`,
    `<i>${p.porque}</i>`,
  ].join('\n')
}

function teclado(ids: string[]): { inline_keyboard: { text: string; callback_data: string }[][] } {
  // Uma linha por pauta, para o toque não errar de alvo no celular.
  return {
    inline_keyboard: ids.map((id, i) => ([
      { text: `✓ ${i + 1}`, callback_data: `pa:${id}` },
      { text: `✕ ${i + 1}`, callback_data: `pr:${id}` },
    ])),
  }
}

// ─── Execução ────────────────────────────────────────────────────────────────

async function processar() {
  const [gsc, relacionadas] = await Promise.all([
    doSearchConsole(),
    dasBuscasRelacionadas(),
  ])

  if (!gsc.length && !relacionadas.length) {
    await tgAlert('Cron de pautas', new Error(
      'Nenhuma candidata. Verifique se a Search Console API está ativa e se a service account tem acesso.',
    ))
    return
  }

  const comCobertura = await marcarCobertura([...gsc, ...relacionadas])
  const melhores = ranquear(comCobertura, QUANTAS)
  if (!melhores.length) return

  // Guarda para o webhook poder resolver o callback por id curto.
  const docs = await Promise.all(melhores.map(p => sanity.create({
    _type: 'pautaSugerida',
    termo: p.termo,
    nota: p.nota,
    porque: p.porque,
    origem: p.origem,
    fatores: p.fatores,
    status: 'sugerida',
    createdAt: new Date().toISOString(),
  })))

  const semGsc = gsc.length === 0
  const cabecalho = [
    '<b>Pautas sugeridas</b>',
    `${gsc.length} do Search Console · ${relacionadas.length} da busca`,
    semGsc ? '\n⚠️ Search Console sem dados: API desativada ou sem permissão.' : '',
    '\nToque ✓ para mandar para a fila, ✕ para descartar.\n',
  ].filter(Boolean).join('\n')

  const corpo = melhores.map((p, i) => cartao(p, i)).join('\n\n')

  if (tgConfigured()) {
    await tgSendMessage(`${cabecalho}\n${corpo}`, teclado(docs.map(d => d._id)))
  } else {
    console.log('[pautas] Telegram não configurado; sugestões:', melhores.map(p => p.termo))
  }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Responde na hora; o trabalho pesado (GSC + Serper + RAG) roda em background.
  after(async () => {
    try {
      await processar()
    } catch (err) {
      await tgAlert('Cron de pautas', err)
    }
  })
  return NextResponse.json({ ok: true, queued: true })
}
