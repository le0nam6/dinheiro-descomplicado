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
 * /api/cron/publish escreve a partir dela, às 9h e às 18h.
 */
import { NextResponse, after } from 'next/server'
import { consultasDoSite } from '@/lib/search-console'
import { ranquear, pontuar, type Candidata, type PautaPontuada } from '@/lib/relevancia'
import { expandir, autocompletar, tendenciasBrasil, SUFIXOS } from '@/lib/demanda-externa'
import { sanity, tgSendMessage, tgConfigured, tgAlert, tgEscape } from '@/lib/publish-core'
import { analisarSerp, temDono, descrever, pareceMarca, type Serp } from '@/lib/concorrencia'

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
 * Demanda externa: o que as pessoas digitam no Google.
 *
 * Esta é a fonte que tira o sistema de dentro do próprio universo. O Search
 * Console só sabe onde o site já aparece, e o Serper com sementes fixas só
 * devolvia o que eu tinha escrito à mão. O autocomplete devolve a consulta
 * literal do leitor, ordenada por volume real.
 */
async function daDemandaExterna(): Promise<Candidata[]> {
  // Bases rotativas: o pool inteiro por dia geraria centenas de chamadas e
  // devolveria sempre o mesmo topo. Três bases por dia, girando, dão amplitude
  // ao longo da semana sem repetir.
  const BASES = [
    'como sair das dívidas', 'como investir', 'quanto rende', 'vale a pena investir',
    'como economizar', 'qual o melhor investimento', 'como declarar', 'quanto custa',
    'como aumentar o score', 'melhor cartão de crédito', 'como funciona o tesouro',
    'quanto preciso para', 'como pedir empréstimo', 'como juntar dinheiro',
    'onde investir', 'como sair do nome sujo', 'quanto tempo demora',
    'como calcular juros',
  ]
  const dia = Math.floor(
    (Date.now() - new Date(new Date().getUTCFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  const inicio = (dia * 3) % BASES.length
  const bases = Array.from({ length: 3 }, (_, i) => BASES[(inicio + i) % BASES.length])

  const lotes = await Promise.all(bases.map(b => expandir(b, SUFIXOS)))
  const doAutocomplete: Candidata[] = lotes.flat().map(({ termo, posicaoNaLista, base }) => ({
    termo,
    posicaoNaLista,
    base,
    origem: 'busca-relacionada' as const,
  }))

  // Trends entra como coadjuvante. A tendência diária brasileira é quase toda
  // futebol e TV, e o filtro de território derruba a maior parte — mas quando
  // um assunto de finanças estoura de verdade, vale capturar.
  const tend = await tendenciasBrasil()
  const doTrends: Candidata[] = tend.map(t => ({
    termo: t.termo,
    origem: 'busca-relacionada' as const,
  }))

  return [...doAutocomplete, ...doTrends]
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

async function indiceDeTitulos(): Promise<Set<string>[]> {
  const titulos: string[] = await sanity.fetch(
    `*[_type=="post" && defined(title)]|order(publishedAt desc)[0...400].title`,
  ).catch(() => [])
  return titulos.map(significativas)
}

function cobertura(termo: string, indice: Set<string>[]): number {
  const palavras = significativas(termo)
  if (!palavras.size) return 0
  let melhor = 0
  for (const t of indice) {
    const comuns = [...palavras].filter(p => t.has(p)).length
    melhor = Math.max(melhor, comuns / palavras.size)
    if (melhor === 1) break
  }
  return melhor
}

function marcarCobertura(cs: Candidata[], indice: Set<string>[]): Candidata[] {
  return cs.map(c => ({ ...c, jaCoberto: cobertura(c.termo, indice) }))
}

/**
 * Assinatura estável de um termo: sem acento, sem palavra curta, ordem
 * normalizada. Faz 'juros compostos o que é' e 'o que são juros compostos'
 * contarem como o mesmo tema, tanto na deduplicação quanto no histórico.
 */
function assinatura(t: string): string {
  return t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(w => w.length > 3).sort().join(' ')
}

/** Tudo que já foi sugerido antes, aprovado ou recusado. */
async function termosJaSugeridos(): Promise<Set<string>> {
  const termos: string[] = await sanity.fetch(
    `*[_type=="pautaSugerida"].termo`,
  ).catch(() => [])
  return new Set(termos.map(assinatura))
}

// ─── Telegram ────────────────────────────────────────────────────────────────

type Finalista = PautaPontuada & { serp?: Serp | null }

function cartao(p: Finalista, i: number): string {
  const origem = p.origem === 'search-console' ? 'Search Console' : 'Busca do Google'
  return [
    `<b>${i + 1}. ${tgEscape(p.termo)}</b>`,
    `nota ${p.nota}/100 · ${origem}`,
    `<i>${tgEscape(p.porque)}</i>`,
    `<i>${tgEscape(descrever(p.serp ?? null))}</i>`,
  ].join('\n')
}

/**
 * Teto de chamadas ao Serper por rodada. Estourou o teto, a pauta segue sem
 * checagem: mandar uma sugestão não verificada é melhor que não mandar nada.
 */
const CHECAGENS = 12

type Contexto = {
  /** Assinaturas já sugeridas alguma vez. O resgate também respeita o histórico. */
  jaVistos: Set<string>
  indice: Set<string>[]
  /** Chamadas ao Serper que ainda cabem nesta rodada. */
  orcamento: { restante: number }
}

/** Sem orçamento ou com falha de API devolve null: nunca bloqueia a pauta. */
async function verificar(termo: string, orcamento: { restante: number }): Promise<Serp | null> {
  if (orcamento.restante <= 0) return null
  orcamento.restante--
  return analisarSerp(termo)
}

/**
 * Quando a SERP tem dono, quem está tomada é a formulação — não o assunto.
 * As pessoas procuram mesmo "empréstimo no nubank"; o que não existe é vaga
 * nessa frase. As variantes da mesma base contam a história: "no mercado pago"
 * pertence ao Mercado Pago, "na shopee" à Shopee, mas "como pedir empréstimo",
 * "do FGTS" e "do Bolsa Família" estão livres, com 7 a 8 domínios disputando.
 *
 * Então antes de abandonar o tema, tenta o mesmo assunto por outro caminho.
 * A variante resgatada passa pelos mesmos filtros de qualquer candidata:
 * histórico, cobertura do acervo e território.
 */
async function resgatarVariante(p: PautaPontuada, ctx: Contexto): Promise<Finalista | null> {
  if (!p.base) return null

  const variantes = (await autocompletar(p.base))
    .map((termo, i) => ({ termo, posicaoNaLista: i }))
    .filter(v => assinatura(v.termo) !== assinatura(p.termo))
    .filter(v => !ctx.jaVistos.has(assinatura(v.termo)))
    // Quem não cita empresa vai primeiro: tem mais chance de estar livre, e
    // cada tentativa custa uma chamada. Ordem, não veto.
    .sort((a, b) => Number(pareceMarca(a.termo)) - Number(pareceMarca(b.termo)))

  let tentativas = 0
  for (const v of variantes) {
    if (tentativas >= 2) break
    const pontuada = pontuar({
      termo: v.termo,
      posicaoNaLista: v.posicaoNaLista,
      base: p.base,
      origem: 'busca-relacionada',
      jaCoberto: cobertura(v.termo, ctx.indice),
    })
    if (!pontuada.nota) continue

    const serp = await verificar(v.termo, ctx.orcamento)
    tentativas++
    if (serp && temDono(serp)) continue

    ctx.jaVistos.add(assinatura(v.termo))
    console.log(`[pautas] resgatada do mesmo tema: "${v.termo}" no lugar de "${p.termo}"`)
    return { ...pontuada, serp }
  }
  return null
}

/**
 * Descarta pauta cuja primeira página já tem dono. É a pergunta que faltava no
 * critério — ele media demanda, proximidade, durabilidade e lacuna, e nenhuma
 * dessas percebe que "empréstimo no nubank" devolve oito resultados do próprio
 * Nubank. Roda só nas finalistas porque cada verificação custa uma chamada.
 */
async function escolherFinalistas(
  ranqueadas: PautaPontuada[], vagas: number, ctx: Contexto,
): Promise<Finalista[]> {
  const escolhidas: Finalista[] = []
  for (const p of ranqueadas) {
    if (escolhidas.length >= vagas) break
    const serp = await verificar(p.termo, ctx.orcamento)
    if (serp && temDono(serp)) {
      console.log(`[pautas] descartada: "${p.termo}" — ${descrever(serp)}`)
      const resgatada = await resgatarVariante(p, ctx)
      if (resgatada) escolhidas.push(resgatada)
      continue
    }
    escolhidas.push({ ...p, serp })
  }
  return escolhidas
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

/** Quantas pautas na fila já bastam. Acima disso, sugerir só acumula. */
const FILA_CHEIA = 10

/**
 * `manual` vem do comando /pautas. A trava de fila cheia existe para o cron
 * diário não sugerir mais do que o pipeline consegue escrever — mas quando você
 * pede, pede sugestão agora, e responder com silêncio parece defeito.
 */
async function processar(manual = false) {
  // Oferta tem que acompanhar consumo. O cron diário sugeria 6 por dia e o
  // pipeline escreve ~4, então a fila só crescia — 19 itens esperando quando
  // isso foi notado. Com a fila cheia, a rodada é pulada e você não recebe
  // mensagem para decidir sobre coisa que não vai ser escrita tão cedo.
  const naFila: number = await sanity.fetch(
    `count(*[_type=="editorialQueue" && status=="fila"])`,
  ).catch(() => 0)

  if (naFila >= FILA_CHEIA && !manual) {
    console.log(`[pautas] fila com ${naFila} itens, pulando a rodada`)
    return
  }

  const [gsc, relacionadas] = await Promise.all([
    doSearchConsole(),
    daDemandaExterna(),
  ])

  if (!gsc.length && !relacionadas.length) {
    await tgAlert('Cron de pautas', new Error(
      'Nenhuma candidata. Verifique se a Search Console API está ativa e se a service account tem acesso.',
    ))
    return
  }

  // Nunca repetir o que já passou por aqui. Sem isto, com o cron diário e
  // fontes que mudam pouco, as mesmas seis pautas voltavam todo dia — e as
  // recusadas voltavam também, o que torna a decisão anterior inútil.
  const jaVistos = await termosJaSugeridos()
  const ineditos = [...gsc, ...relacionadas].filter(c => !jaVistos.has(assinatura(c.termo)))

  if (!ineditos.length) {
    // Falhar em silêncio aqui seria pior que não ter o cron: você pararia de
    // receber mensagem e não saberia se o sistema quebrou ou se acabou o
    // assunto. Avisa, e diz o que fazer.
    if (tgConfigured()) {
      await tgSendMessage(
        '<b>Pautas</b>\n\nTodas as candidatas de hoje já foram sugeridas antes.\n\n' +
        `Já passaram por aqui ${jaVistos.size} termos. As fontes (Search Console e busca do Google) ` +
        'mudam devagar, então isso acontece quando o acervo de temas do território se esgota.\n\n' +
        '<i>Caminhos: alimentar a fila com pauta própria, ou esperar o Search Console acumular ' +
        'consultas novas conforme o site ganha impressões.</i>',
        undefined, 'HTML',
      )
    }
    console.log(`[pautas] nenhuma candidata inédita; ${jaVistos.size} termos no histórico`)
    return
  }

  const indice = await indiceDeTitulos()
  const comCobertura = marcarCobertura(ineditos, indice)
  // Sugere só o que falta para completar a fila, em vez de sempre 6.
  const vagas = manual ? QUANTAS : Math.min(QUANTAS, FILA_CHEIA - naFila)
  // Ranqueia com folga: a checagem de concorrência derruba parte das primeiras,
  // e sem reserva a rodada chegaria ao Telegram com menos pautas que o pedido.
  const melhores = await escolherFinalistas(
    ranquear(comCobertura, vagas * 3), vagas,
    { jaVistos, indice, orcamento: { restante: CHECAGENS } },
  )
  if (!melhores.length) {
    if (manual && tgConfigured()) {
      await tgSendMessage(
        '<b>Pautas</b>\n\nNenhuma candidata inédita passou nos critérios de relevância agora.',
        undefined, 'HTML',
      )
    }
    return
  }

  // Guarda para o webhook poder resolver o callback por id curto.
  const docs = await Promise.all(melhores.map(p => sanity.create({
    _type: 'pautaSugerida',
    termo: p.termo,
    nota: p.nota,
    porque: p.porque,
    origem: p.origem,
    fatores: p.fatores,
    concorrencia: descrever(p.serp ?? null),
    status: 'sugerida',
    createdAt: new Date().toISOString(),
  })))

  const semGsc = gsc.length === 0
  const cabecalho = [
    '<b>Pautas sugeridas</b>',
    `${gsc.length} do Search Console · ${relacionadas.length} da demanda do Google`,
    semGsc ? '\n⚠️ Search Console sem dados: API desativada ou sem permissão.' : '',
    '\nToque ✓ para mandar para a fila, ✕ para descartar.\n',
  ].filter(Boolean).join('\n')

  const corpo = melhores.map((p, i) => cartao(p, i)).join('\n\n')

  if (tgConfigured()) {
    await tgSendMessage(`${cabecalho}\n${corpo}`, teclado(docs.map(d => d._id)), 'HTML')
  } else {
    console.log('[pautas] Telegram não configurado; sugestões:', melhores.map(p => p.termo))
  }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const manual = new URL(request.url).searchParams.get('manual') === '1'
  // Responde na hora; o trabalho pesado (GSC + Serper + RAG) roda em background.
  after(async () => {
    try {
      await processar(manual)
    } catch (err) {
      await tgAlert('Cron de pautas', err)
    }
  })
  return NextResponse.json({ ok: true, queued: true })
}
