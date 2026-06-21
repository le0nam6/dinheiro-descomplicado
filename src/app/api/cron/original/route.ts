/**
 * Cron de conteúdo ORIGINAL e PROPRIETÁRIO — 2x por dia (8h e 15h BRT).
 *
 * Séries:
 *   numero  — "O Número do Dia"       : BACEN → análise exclusiva
 *   copa    — "Copa 2026"             : jogo + impacto financeiro (ativo jun-jul 2026)
 *   setor   — "Setor na Lupa"         : deep dive semanal em setor da economia
 *   preco   — "Preço do Brasileiro"   : BACEN + IBGE tracking de preços
 *   bolsa   — "Bolsa em Foco"         : maiores altas/quedas B3 com análise
 *   emprego — "O Emprego em Números"  : CAGED + PNAD — mercado de trabalho
 *   governo — "A Conta do Governo"    : dívida pública, resultado primário
 *   dolar   — "Dólar e Você"          : câmbio e impacto no dia a dia
 *   fundo   — "Fundo no Microscópio"  : análise de fundo de investimento
 *   fintech — "Fintech da Semana"     : spotlight em fintech/banco digital BR
 *   renda   — "Renda Extra Real"      : oportunidades de renda extra com números
 *
 * Rotação (BRT):
 *   08h → cicla as séries por dia do ano
 *   15h → copa (enquanto ativa) ou série diferente da manhã
 *
 * ?dry=true → busca dados, retorna JSON sem chamar Claude nem publicar
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, after } from 'next/server'
import {
  sanity, SITE, type GeneratedPost, type Photo,
  createSanityPost, getRecentTitles, getRecentPhotoUrls,
  fetchPhoto, fetchSerperImages, tgAlert, tgConfigured, tgSendMessage,
  humanizePostBody, blogApprovalKeyboard,
} from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Series = 'numero' | 'copa' | 'setor' | 'preco' | 'bolsa' | 'emprego' | 'governo' | 'dolar' | 'fundo' | 'fintech' | 'renda'

// ─── Copa 2026 ────────────────────────────────────────────────────────────────

const COPA_START = new Date('2026-06-11T00:00:00-03:00')
const COPA_END   = new Date('2026-07-19T23:59:59-03:00')
function isCopaActive(): boolean {
  const now = new Date()
  return now >= COPA_START && now <= COPA_END
}

// ─── Setores semanais ─────────────────────────────────────────────────────────

const SETORES = [
  { name: 'Fintechs & Bancos Digitais', keywords: ['fintech', 'banco digital', 'nubank', 'inter', 'c6', 'pagbank', 'mercado pago', 'pix', 'open finance'] },
  { name: 'Varejo & Consumo',           keywords: ['varejo', 'consumo', 'magazine luiza', 'americanas', 'casas bahia', 'renner', 'e-commerce', 'marketplace'] },
  { name: 'Agronegócio',                keywords: ['agro', 'soja', 'milho', 'boi gordo', 'commodit', 'exportação agrícola', 'embrapa', 'safra'] },
  { name: 'Energia & Infraestrutura',   keywords: ['petrobras', 'energia', 'petróleo', 'gás', 'pré-sal', 'combustível', 'gasolina', 'etanol', 'eletrobras'] },
  { name: 'Saúde & Pharma',             keywords: ['saúde', 'plano de saúde', 'unimed', 'hapvida', 'anvisa', 'farmácia', 'remédio', 'hospital'] },
  { name: 'Tecnologia & Startups',      keywords: ['startup', 'tecnologia', 'venture capital', 'unicórnio', 'software', 'inteligência artificial', 'totvs'] },
  { name: 'Construção Civil & Imóveis', keywords: ['construção', 'imóvel', 'mrv', 'cyrela', 'financiamento imobiliário', 'minha casa', 'aluguel', 'fii'] },
]

function getSetorOfWeek() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const isoWeek = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  return SETORES[isoWeek % SETORES.length]
}

// ─── Rotação de séries por slot/dia ──────────────────────────────────────────

const MORNING_ROTATION: Series[] = [
  'numero', 'bolsa', 'setor', 'dolar', 'emprego',
  'governo', 'preco', 'fundo', 'fintech', 'renda',
  'numero', 'bolsa', 'setor', 'dolar',
]

function selectSeries(slot: 'morning' | 'afternoon', dayOfYear: number): Series {
  if (slot === 'afternoon') {
    if (isCopaActive()) return 'copa'
    const morning = MORNING_ROTATION[dayOfYear % MORNING_ROTATION.length]
    const afternoon: Series[] = ['preco', 'setor', 'governo', 'emprego', 'bolsa', 'fundo', 'fintech', 'renda', 'dolar', 'numero']
    return afternoon.find(s => s !== morning) ?? 'preco'
  }
  return MORNING_ROTATION[dayOfYear % MORNING_ROTATION.length]
}

// ─── Helpers genéricos ────────────────────────────────────────────────────────

type BacenPoint = { data: string; valor: string }

async function fetchBacenSeries(code: number, n = 6): Promise<BacenPoint[]> {
  try {
    const res = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${n}?formato=json`,
      { signal: AbortSignal.timeout(8000) }
    )
    return await res.json()
  } catch { return [] }
}

async function fetchRss(urls: string[], maxItems = 12, keywords: string[] = []): Promise<string[]> {
  const items: string[] = []
  await Promise.allSettled(urls.map(async url => {
    try {
      const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }).then(r => r.text())
      const re = /<item>([\s\S]*?)<\/item>/g
      let m
      while ((m = re.exec(xml)) !== null) {
        const b = m[1]
        const get = (t: string) => {
          const x = b.match(new RegExp(`<${t}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${t}>|<${t}[^>]*>([\\s\\S]*?)</${t}>`))
          return x ? (x[1] || x[2] || '').trim() : ''
        }
        const title = get('title')
        const desc = get('description').replace(/<[^>]+>/g, '').slice(0, 200)
        if (!title) continue
        if (keywords.length > 0) {
          const combined = (title + ' ' + desc).toLowerCase()
          if (!keywords.some(kw => combined.includes(kw.toLowerCase()))) continue
        }
        items.push(`- ${title}: ${desc}`)
        if (items.length >= maxItems) return
      }
    } catch { /* feed off */ }
  }))
  return items.slice(0, maxItems)
}

const FINANCE_FEEDS = [
  'https://www.infomoney.com.br/feed/',
  'https://exame.com/feed/',
  'https://neofeed.com.br/feed/',
  'https://finsiders.com.br/feed/',
  'https://www.moneytimes.com.br/feed/',
  'https://www.seudinheiro.com/feed/',
]

// ─── Fetchers de dados por série ──────────────────────────────────────────────

async function fetchDadosNumero() {
  const SERIES_META: Record<string, { code: number; name: string; unit: string; story: string }> = {
    credito_pf:    { code: 7444,  name: 'Carteira de crédito — pessoa física',  unit: 'R$ bilhões',    story: 'volume total de crédito das famílias brasileiras' },
    inadimplencia: { code: 1406,  name: 'Inadimplência — pessoa física',         unit: '% da carteira', story: 'taxa de calote das famílias no sistema financeiro' },
    cambio:        { code: 20786, name: 'Taxa de câmbio — dólar (venda)',        unit: 'R$/US$',        story: 'cotação do dólar no mercado interbancário' },
    reservas:      { code: 4380,  name: 'Reservas internacionais',              unit: 'US$ bilhões',   story: 'colchão de dólares do Banco Central' },
    concessoes:    { code: 7384,  name: 'Concessões de crédito — pessoa física', unit: 'R$ bilhões/mês', story: 'quanto de crédito novo as famílias tomaram' },
    poupanca:      { code: 1361,  name: 'Captações da poupança',               unit: 'R$ bilhões',    story: 'quanto entrou ou saiu da poupança' },
    m1:            { code: 20714, name: 'M1 — papel moeda + depósitos à vista', unit: 'R$ bilhões',    story: 'dinheiro circulando na economia' },
  }
  const keys = Object.keys(SERIES_META)
  const primary = keys[new Date().getDay() % keys.length]
  const meta = SERIES_META[primary]
  const points = await fetchBacenSeries(meta.code, 6)
  if (!points.length) return null

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const delta = prev ? ((parseFloat(last.valor) - parseFloat(prev.valor)) / parseFloat(prev.valor) * 100).toFixed(2) : null
  const [cambio, inad] = await Promise.all([fetchBacenSeries(20786, 3), fetchBacenSeries(1406, 2)])

  return {
    indicador: meta.name, valor: last.valor, unidade: meta.unit, data: last.data,
    variacao: delta, story: meta.story,
    historico: points.map(p => `${p.data}: ${p.valor} ${meta.unit}`),
    cambio: cambio.length ? `R$ ${cambio[cambio.length - 1].valor}/US$ (${cambio[cambio.length - 1].data})` : null,
    inadimplencia: inad.length ? `${inad[inad.length - 1].valor}% (${inad[inad.length - 1].data})` : null,
  }
}

async function fetchDadosBolsa() {
  // brapi.dev — gratuito, limite de 3 símbolos por chamada
  type Quote = { ticker: string; change: number; price: number }
  const BATCHES = [
    ['PETR4', 'VALE3', 'ITUB4'],
    ['BBDC4', 'ABEV3', 'WEGE3'],
    ['RENT3', 'SUZB3', 'BPAC11'],
  ]

  let ibovPts: { date: string; close: number } | null = null as { date: string; close: number } | null
  let quotes: Quote[] = []

  const results = await Promise.allSettled(
    BATCHES.map(batch =>
      fetch(`https://brapi.dev/api/quote/${batch.join(',')}?fundamental=false`, { signal: AbortSignal.timeout(8000) })
        .then(r => r.json())
    )
  )

  for (const r of results) {
    if (r.status !== 'fulfilled' || r.value?.error) continue
    for (const s of (r.value.results ?? [])) {
      if (s.regularMarketChangePercent != null && s.regularMarketPrice != null) {
        quotes.push({ ticker: s.symbol, change: Number(s.regularMarketChangePercent.toFixed(2)), price: Number(s.regularMarketPrice.toFixed(2)) })
      }
    }
  }
  quotes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  const news = await fetchRss(FINANCE_FEEDS, 8, ['b3', 'bolsa', 'ações', 'ibovespa', 'mercado', 'pregão'])
  return { ibovPts, quotes, news }
}

async function fetchDadosCopa() {
  // Busca em feeds esportivos E financeiros para ter ângulo econômico real
  const newsEsporte = await fetchRss(
    ['https://ge.globo.com/rss/ge/futebol/copa-do-mundo/', 'https://www.espn.com.br/rss/futebol/'],
    15, ['copa', 'brasil', 'world cup', 'mundial', 'economia', 'mercado', 'ingresso', 'turismo', 'apostas', 'patrocinador', 'transmissão']
  )
  const newsFinancas = await fetchRss(FINANCE_FEEDS, 10, ['copa', 'world cup', 'turismo', 'apostas', 'ambev', 'globo', 'patrocinador', 'infraestrutura', 'investimento'])
  const news = [...new Set([...newsFinancas, ...newsEsporte])]
  return { news, stockContext: 'Empresas com exposição Copa: Ambev (ABEV3), Grupo Soma, operadoras de apostas (Bet365/Betano/Superbet), Globo/GLBG3, redes fast food, hotelaria, companhias aéreas.' }
}

async function fetchDadosSetor() {
  const setor = getSetorOfWeek()
  const news = await fetchRss(FINANCE_FEEDS, 12, setor.keywords)
  const cambio = await fetchBacenSeries(20786, 1)
  return { setor: setor.name, news, cambio: cambio[0]?.valor ?? null }
}

async function fetchDadosPreco() {
  const [cambio, selic, inad, conc] = await Promise.all([
    fetchBacenSeries(20786, 5),
    fetchBacenSeries(11, 5),
    fetchBacenSeries(1406, 3),
    fetchBacenSeries(7384, 3),
  ])
  let ipca: string[] = []
  try {
    const r = await fetch(
      'https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/-3/variaveis/63?localidades=N1[all]',
      { signal: AbortSignal.timeout(8000) }
    ).then(r => r.json())
    const series = r?.[0]?.resultados?.[0]?.series?.[0]?.serie
    if (series) ipca = Object.entries(series as Record<string, string>).map(([p, v]) => `${p}: ${v}%`)
  } catch { /* IBGE off */ }
  return { cambio, selic, inad, conc, ipca }
}

async function fetchDadosDolar() {
  // Usa janela de datas para garantir dados diários (ultimos/N pode retornar mensal)
  const today = new Date()
  const from  = new Date(today); from.setDate(from.getDate() - 10)
  const fmt   = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`

  const safeArr = async (url: string): Promise<BacenPoint[]> => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) }).then(r => r.json())
      return Array.isArray(r) ? r : []
    } catch { return [] }
  }

  const [cambioRange, selic, euro] = await Promise.all([
    safeArr(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?dataInicial=${fmt(from)}&dataFinal=${fmt(today)}&formato=json`),
    fetchBacenSeries(11, 1),
    safeArr(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.21619/dados?dataInicial=${fmt(from)}&dataFinal=${fmt(today)}&formato=json`),
  ])

  const cambio5d = cambioRange.slice(-5)
  const euroLast: BacenPoint | null = euro.slice(-1)[0] ?? null

  const news = await fetchRss(FINANCE_FEEDS, 6, ['dólar', 'câmbio', 'real', 'moeda', 'fed', 'federal reserve'])
  return { cambio5d, selic, euroLast, news }
}

async function fetchDadosEmprego() {
  const [rend, desemp] = await Promise.all([
    fetchBacenSeries(28544, 6),  // Rendimento médio real — PNAD Contínua
    fetchBacenSeries(24369, 6),  // Taxa de desocupação — PNAD Contínua
  ])
  const news = await fetchRss(FINANCE_FEEDS, 8, ['caged', 'emprego', 'desemprego', 'pnad', 'mercado de trabalho', 'salário', 'admissão'])
  return { rendimento: rend, desocupacao: desemp, news }
}

async function fetchDadosGoverno() {
  const [divBruta, divLiq, primario, jurosPagos] = await Promise.all([
    fetchBacenSeries(13762, 6),  // Dívida bruta governo geral (% PIB)
    fetchBacenSeries(4513, 6),   // Dívida líquida setor público (% PIB)
    fetchBacenSeries(5793, 12),  // Resultado primário acumulado 12 meses (R$ bi)
    fetchBacenSeries(4179, 6),   // Juros pagos (% PIB)
  ])
  const news = await fetchRss(FINANCE_FEEDS, 8, ['fiscal', 'dívida pública', 'resultado primário', 'tesouro', 'déficit', 'superávit', 'gastos governo'])
  return { divBruta, divLiq, primario, jurosPagos, news }
}

async function fetchDadosFundo() {
  const FUNDOS = [
    { cnpj: '11.858.294/0001-15', nome: 'Kinea Renda Imobiliária FII',          tipo: 'FII' },
    { cnpj: '97.929.213/0001-34', nome: 'Verde AM Scena FIC FIM',               tipo: 'Multimercado' },
    { cnpj: '04.305.193/0001-40', nome: 'Kapitalo Kappa FIC FIM',               tipo: 'Multimercado' },
    { cnpj: '09.431.340/0001-10', nome: 'Itaú Personnalité RF DI FIC FIRF',     tipo: 'Renda Fixa' },
    { cnpj: '08.807.635/0001-68', nome: 'XP Inflação FIC FIRF',                 tipo: 'Renda Fixa' },
    { cnpj: '18.138.913/0001-34', nome: 'BTG Pactual Digital Tesouro Selic',    tipo: 'Renda Fixa' },
    { cnpj: '12.808.980/0001-55', nome: 'Ibiuna Long Short FIC FIM',            tipo: 'Multimercado' },
  ]
  const fundo = FUNDOS[new Date().getDay() % FUNDOS.length]
  const [selic, cdi] = await Promise.all([fetchBacenSeries(11, 1), fetchBacenSeries(4389, 1)])
  const news = await fetchRss(FINANCE_FEEDS, 6, ['fundo de investimento', 'fii', 'multimercado', 'renda fixa', 'gestor', 'cota'])
  return { fundo, selic: selic[0]?.valor, cdi: cdi[0]?.valor, news }
}

async function fetchDadosFintech() {
  const FINTECHS = ['nubank', 'inter', 'c6 bank', 'pagbank', 'mercado pago', 'picpay', 'neon', 'banco pan', 'creditas', 'stark bank', 'asaas', 'celcoin']
  const fintech = FINTECHS[(new Date().getDay() + Math.ceil(new Date().getDate() / 7)) % FINTECHS.length]
  const news = await fetchRss(
    [...FINANCE_FEEDS, 'https://fintechlab.com.br/feed/'],
    10, [fintech, 'fintech', 'banco digital', 'open finance', 'pix', 'crédito digital']
  )
  return { fintech, news }
}

async function fetchDadosRenda() {
  const TEMAS = ['aplicativo de entrega', 'freelancer', 'cashback', 'renda passiva', 'afiliado', 'dropshipping', 'aluguel por temporada', 'revenda', 'trabalho remoto']
  const tema = TEMAS[new Date().getDay() % TEMAS.length]
  const [selic, cdi] = await Promise.all([fetchBacenSeries(11, 1), fetchBacenSeries(4389, 1)])
  const news = await fetchRss(FINANCE_FEEDS, 8, ['renda extra', 'freelancer', 'ganhar dinheiro', 'empreender', 'autônomo', 'mei'])
  return { tema, selic: selic[0]?.valor, cdi: cdi[0]?.valor, news }
}

// ─── Geradores de artigo ──────────────────────────────────────────────────────

const PROHIBICOES = 'PROIBIÇÕES: travessão (—), "crucial", "fundamental", "inovador", gerúndio de análise, conclusão motivacional. JAMAIS invente números, cotações, percentuais, datas ou nomes de empresas que não estejam explicitamente nos DADOS acima. Se um dado não foi fornecido, não estime nem aproxime — omita ou escreva "dados não disponíveis".'

function jsonSchema(category: string) {
  return `\n\n${PROHIBICOES}

DADOS: use SOMENTE os números da seção DADOS acima. Nunca extrapole, estime ou cite valores históricos que não estejam nos dados fornecidos.

TÍTULO: jornalístico, factual, sem o nome da série. Use os números reais dos DADOS. Exemplos do que NÃO fazer: "Bolsa em Foco: ...", "Dólar e Você: ...", "A Conta do Governo: ...". Exemplos do que fazer: "Por que a Petrobras caiu 3% e o que isso diz sobre o mercado", "Dívida pública bate 90% do PIB — o que isso muda para quem investe no Tesouro".

PARÁGRAFOS: curtos. Máximo 2-3 frases por parágrafo. Quebre parágrafos longos em vários curtos. Cada elemento do array "body" deve ter no máximo 3 frases. Prefira frases diretas sem subordinadas encadeadas.

Retorne SOMENTE JSON válido:
{
  "title": "título jornalístico sem nome da série, max 80 chars",
  "slug": "slug-sem-acento",
  "excerpt": "resumo factual com o dado central, max 155 chars",
  "category": "${category}",
  "seoKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "readingTime": 7,
  "coverQuery": "termo inglês para imagem",
  "body": ["parágrafo curto (max 3 frases).", "## Subtítulo", "parágrafo curto.", "..."],
  "igCaption": "legenda 3 parágrafos\\n\\n🔗 endinheirados.cc/blog/SLUG\\n\\n#hashtags #endinheirados",
  "igTitle": "TÍTULO CAIXA ALTA"
}`
}

async function callClaude(prompt: string): Promise<GeneratedPost> {
  const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
  const text = (msg.content[0] as { text: string }).text.trim()
  return JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
}

function recentBlock(recent: string[]) {
  return `NÃO repita temas: ${recent.slice(0, 10).join(' | ')}`
}

async function generateNumero(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosNumero()
  if (!d) throw new Error('BACEN sem dados')
  const prompt = `Você é analista financeiro do Endinheirados. Escreva análise EXCLUSIVA baseada em dados reais do Banco Central.

DADOS REAIS DO BACEN:
Indicador: ${d.indicador}
Valor atual: ${d.valor} ${d.unidade} (${d.data})
Variação vs anterior: ${d.variacao ? (Number(d.variacao) > 0 ? '+' : '') + d.variacao + '%' : 'n/d'}
Contexto: ${d.story}
Histórico: ${d.historico.join(' | ')}
${d.cambio ? `Câmbio: ${d.cambio}` : ''}
${d.inadimplencia ? `Inadimplência PF: ${d.inadimplencia}` : ''}

${recentBlock(recent)}

Baseado nos dados acima, identifique o número MAIS SURPREENDENTE ou a TENDÊNCIA MAIS RELEVANTE e escreva um artigo inteiramente sobre isso. Um ângulo, uma história, 10-12 parágrafos de profundidade real. Não tente cobrir tudo. Tom de analista que fala como gente — o dado é o gancho, mas a análise é o produto.
${jsonSchema('educação financeira')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'mofu', articleType: 'news' }
}

async function generateBolsa(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosBolsa()
  type Quote = { ticker: string; change: number; price: number }
  const ibovStr = d.ibovPts ? `${d.ibovPts.close.toLocaleString('pt-BR')} pts (${d.ibovPts.date})` : '(sem dado)'
  const quotesStr = d.quotes.slice(0, 6).map((q: Quote) => `${q.ticker}: ${q.change > 0 ? '+' : ''}${q.change}% (R$ ${q.price})`).join(' | ')
  if (!quotesStr && !d.ibovPts) throw new Error('Sem dados de bolsa — abortando geração para evitar dado inventado')
  const prompt = `Você é analista de mercado do Endinheirados. Escreva "Bolsa em Foco" — análise do pregão mais recente da B3.

DADOS (use SOMENTE estes números — não invente cotações, percentuais ou preços):
Ibovespa: ${ibovStr}
Destaques: ${quotesStr || '(sem cotações disponíveis — baseie-se apenas nas manchetes abaixo)'}
Manchetes: ${d.news.join('\n')}

${recentBlock(recent)}

Baseado SOMENTE nos dados e manchetes acima, escolha UM evento ou UM ativo que teve o movimento mais significativo. Escreva inteiramente sobre ele. Não invente preços ou percentuais que não estejam nos dados. 10-12 parágrafos. Não tente resumir o pregão inteiro.
${jsonSchema('investimentos')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'mofu', articleType: 'news' }
}

async function generateCopa(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosCopa()
  const prompt = `Você é repórter de FINANÇAS do Endinheirados. Sua editoria é dinheiro — não esporte.

NOTÍCIAS DISPONÍVEIS:
${d.news.join('\n')}

CONTEXTO DE MERCADO: ${d.stockContext}

${recentBlock(recent)}

REGRA DE OURO: só escreva se houver um ângulo FINANCEIRO concreto. Ângulos válidos:
- Quanto uma empresa específica (Ambev, Globo, operadora de apostas, hotel, aérea) está ganhando ou perdendo com a Copa
- Gastos reais do torcedor: quanto sai uma viagem, ingresso, hospedagem — com números
- Impacto no PIB, turismo ou consumo — com dado real citado na fonte
- Apostas esportivas: mercado, regulação, receita das bets
- Direitos de transmissão: quem pagou quanto, o que isso significa pra Globo/CazéTV/etc.
- Infraestrutura: quanto o governo gastou, quem ganhou as obras, retorno esperado

ÂNGULOS PROIBIDOS — se só houver isso nas notícias, abort e escreva sobre o tema financeiro mais próximo que tiver nas manchetes:
- Polêmicas, confusões ou controvérsias com jogadores (Ronaldo, Vini Jr., etc.) sem impacto financeiro direto
- Resultados de jogos, escalações, táticas
- Lesões, suspensões, dramas de bastidores
- Qualquer notícia que seria mais adequada no caderno de esportes do que no de economia

Se as notícias acima forem predominantemente esportivas sem ângulo financeiro, escolha o tema do CONTEXTO DE MERCADO e escreva sobre o impacto econômico geral da Copa de forma concreta.

Escolha UM ângulo e vá fundo: 10-12 parágrafos conectados ao bolso do leitor, com números reais.
${jsonSchema('notícias')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'tofu', articleType: 'news' }
}

async function generateSetor(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosSetor()
  if (!d.news.length) throw new Error('Sem manchetes para o setor — abortando geração para evitar dado inventado')
  const prompt = `Você é analista setorial do Endinheirados. Escreva "Setor na Lupa" sobre ${d.setor}.

MANCHETES: ${d.news.join('\n') || '(sem manchetes disponíveis — não gere artigo com dados inventados)'}
${d.cambio ? `Câmbio: R$ ${d.cambio}/US$` : ''}

${recentBlock(recent)}

Baseado SOMENTE nas manchetes acima, identifique a questão mais relevante do setor AGORA — uma empresa específica, uma mudança regulatória, uma tendência de preço, uma disputa de mercado. Escreva inteiramente sobre essa questão. Não faça um panorama geral do setor. 10-13 parágrafos com análise real, não superficial.
${jsonSchema('investimentos')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'mofu', articleType: 'news' }
}

async function generatePreco(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosPreco()
  const prompt = `Você é repórter de preços do Endinheirados. Escreva "Preço do Brasileiro" — tracking de quanto está custando viver no Brasil.

DADOS:
Câmbio: ${d.cambio.map((p: BacenPoint) => `${p.data}: R$ ${p.valor}`).join(' | ')}
Selic: ${d.selic.map((p: BacenPoint) => `${p.data}: ${p.valor}%`).join(' | ')}
IPCA mensal: ${d.ipca.join(' | ') || 'sem dado recente'}
Inadimplência PF: ${d.inad[0]?.valor ?? '?'}% (${d.inad[0]?.data ?? '?'})
Concessões crédito PF: R$ ${d.conc[0]?.valor ?? '?'} bi

${recentBlock(recent)}

Olhando os dados, escolha UM item de consumo ou UM indicador que está tendo a variação mais impactante na vida real das pessoas. Escreva inteiramente sobre isso: por que esse preço está assim, quem é afetado, quanto custa na prática, o que explica, o que a pessoa pode fazer. 10-12 parágrafos. Concreto com números reais — não generalidades.
${jsonSchema('educação financeira')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'tofu', articleType: 'news' }
}

async function generateDolar(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosDolar()
  if (!d.cambio5d.length) throw new Error('BACEN sem dados de câmbio — abortando geração para evitar dado inventado')
  const prompt = `Você é repórter do Endinheirados. Escreva "Dólar e Você" — como a variação cambial afeta o dia a dia do brasileiro.

DADOS (use SOMENTE estes números — não invente nenhum outro):
Dólar (últimos pregões): ${d.cambio5d.map((p: BacenPoint) => `${p.data}: R$ ${p.valor}`).join(' | ')}
Euro: ${d.euroLast ? `R$ ${d.euroLast.valor} (${d.euroLast.data})` : 'n/d'}
Selic: ${d.selic[0]?.valor ?? '?'}% a.d.
Manchetes: ${d.news.join('\n')}

${recentBlock(recent)}

Baseado SOMENTE nos dados de câmbio acima e nas manchetes, escolha UM impacto concreto para aprofundar — pode ser combustível, passagem aérea, um produto importado específico, ou o efeito nos investimentos. Escreva inteiramente sobre esse impacto usando apenas os números fornecidos acima. Não invente cotações, não cite valores históricos que não estejam nos dados, não extrapole. 10-12 parágrafos. Não tente cobrir todos os efeitos do câmbio ao mesmo tempo.
${jsonSchema('educação financeira')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'tofu', articleType: 'news' }
}

async function generateEmprego(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosEmprego()
  const prompt = `Você é analista de mercado de trabalho do Endinheirados. Escreva "O Emprego em Números" com dados reais.

DADOS (PNAD Contínua via BACEN):
Rendimento médio real: ${d.rendimento.map((p: BacenPoint) => `${p.data}: R$ ${p.valor}`).join(' | ')}
Taxa de desocupação: ${d.desocupacao.map((p: BacenPoint) => `${p.data}: ${p.valor}%`).join(' | ')}
Manchetes: ${d.news.join('\n')}

${recentBlock(recent)}

Olhando os dados de rendimento e desocupação, identifique o movimento mais significativo e escreva inteiramente sobre ele. Pode ser a queda do desemprego num setor específico, a estagnação do salário real, ou uma tendência nova no mercado de trabalho. Um ângulo, profundidade real, 10-12 parágrafos. Não tente cobrir o mercado de trabalho inteiro.
${jsonSchema('educação financeira')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'mofu', articleType: 'news' }
}

async function generateGoverno(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosGoverno()
  const prompt = `Você é analista fiscal do Endinheirados. Escreva "A Conta do Governo" — finanças públicas e o que significam para o investidor.

DADOS (BACEN):
Dívida bruta (% PIB): ${d.divBruta.map((p: BacenPoint) => `${p.data}: ${p.valor}%`).join(' | ')}
Dívida líquida (% PIB): ${d.divLiq.slice(-3).map((p: BacenPoint) => `${p.data}: ${p.valor}%`).join(' | ')}
Resultado primário (acum. 12m): ${d.primario.slice(-6).map((p: BacenPoint) => `${p.data}: R$ ${p.valor} bi`).join(' | ')}
Juros pagos (% PIB): ${d.jurosPagos.slice(-3).map((p: BacenPoint) => `${p.data}: ${p.valor}%`).join(' | ')}
Manchetes: ${d.news.join('\n')}

${recentBlock(recent)}

Olhando os dados fiscais, identifique UM número ou UM movimento que merece atenção agora — pode ser uma mudança no resultado primário, a dívida cruzando um limiar simbólico, ou o impacto de um gasto específico. Escreva inteiramente sobre isso: o que o número significa na prática, como afeta o Tesouro Direto, os juros e o câmbio, e o que o investidor deve considerar. 10-12 parágrafos com raciocínio real, não inventário de indicadores.
${jsonSchema('investimentos')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'mofu', articleType: 'news' }
}

async function generateFundo(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosFundo()
  const prompt = `Você é analista de fundos do Endinheirados. Escreva "Fundo no Microscópio" — análise para o investidor pessoa física.

FUNDO: ${d.fundo.nome} (${d.fundo.tipo}) — CNPJ: ${d.fundo.cnpj}
Selic: ${d.selic ?? '?'}% a.a. | CDI: ${d.cdi ?? '?'}% a.a.
Manchetes do setor: ${d.news.join('\n')}

${recentBlock(recent)}

Escolha UM aspecto desse fundo que é genuinamente interessante ou contraintuitivo — pode ser a taxa que come o retorno, uma característica de liquidez que a maioria ignora, ou um cenário específico em que ele bate o Tesouro Direto. Escreva inteiramente sobre isso com números reais. Não faça um guia completo do fundo — escolha o ponto mais revelador e vá fundo. 10-12 parágrafos honestos.
${jsonSchema('investimentos')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'mofu', articleType: 'news' }
}

async function generateFintech(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosFintech()
  const prompt = `Você é repórter de tecnologia financeira do Endinheirados. Escreva "Fintech da Semana" — análise de ${d.fintech}.

MANCHETES: ${d.news.join('\n')}

${recentBlock(recent)}

Identifique o ponto mais relevante sobre ${d.fintech} agora — pode ser um produto novo, uma mudança de taxa, uma vantagem pouco conhecida, ou uma limitação real que os usuários descobrem tarde demais. Escreva inteiramente sobre isso. Não faça um review completo da fintech — escolha o ângulo mais útil para quem considera (ou já usa) ela hoje. 10-12 parágrafos com opinião embasada, não press release.
${jsonSchema('educação financeira')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'tofu', articleType: 'news' }
}

async function generateRenda(recent: string[]): Promise<GeneratedPost> {
  const d = await fetchDadosRenda()
  const prompt = `Você é repórter de finanças pessoais do Endinheirados. Escreva "Renda Extra Real" — análise honesta de ${d.tema} com números reais.

Selic: ${d.selic ?? '?'}% a.a. | CDI: ${d.cdi ?? '?'}% a.a. (benchmarks de comparação)
Manchetes relacionadas: ${d.news.join('\n')}

${recentBlock(recent)}

Escolha UM aspecto dessa oportunidade de renda extra que a maioria não sabe ou subestima — pode ser o tempo real até o primeiro rendimento, um custo oculto que come a margem, ou a comparação honesta com simplesmente deixar na Selic. Escreva inteiramente sobre isso com números reais. Não faça um guia de como começar — aprofunde o ângulo mais revelador, especialmente se for contraintuitivo. 10-12 parágrafos. Honesto acima de tudo.
${jsonSchema('educação financeira')}`
  const p = await callClaude(prompt)
  return { ...p, funnel: 'tofu', articleType: 'news' }
}

// ─── Mapa de séries ───────────────────────────────────────────────────────────

type SeriesConfig = {
  label: string
  emoji: string
  fetchData: () => Promise<unknown>
  generate: (recent: string[]) => Promise<GeneratedPost>
  coverQuery: string
}

const SERIES_MAP: Record<Series, SeriesConfig> = {
  numero:  { label: 'O Número do Dia',     emoji: '📊', fetchData: fetchDadosNumero,  generate: generateNumero,  coverQuery: 'Brazil economy central bank data' },
  copa:    { label: 'Copa 2026',            emoji: '⚽', fetchData: fetchDadosCopa,    generate: generateCopa,    coverQuery: 'World Cup 2026 stadium Brazil' },
  setor:   { label: 'Setor na Lupa',        emoji: '🔬', fetchData: fetchDadosSetor,   generate: generateSetor,   coverQuery: 'Brazil industry sector economy' },
  preco:   { label: 'Preço do Brasileiro',  emoji: '🛒', fetchData: fetchDadosPreco,   generate: generatePreco,   coverQuery: 'Brazil supermarket inflation prices' },
  bolsa:   { label: 'Bolsa em Foco',        emoji: '📈', fetchData: fetchDadosBolsa,   generate: generateBolsa,   coverQuery: 'Brazil stock market B3 trading floor' },
  emprego: { label: 'O Emprego em Números', emoji: '💼', fetchData: fetchDadosEmprego, generate: generateEmprego, coverQuery: 'Brazil job market employment workers' },
  governo: { label: 'A Conta do Governo',   emoji: '🏛️', fetchData: fetchDadosGoverno, generate: generateGoverno, coverQuery: 'Brazil government fiscal debt economy' },
  dolar:   { label: 'Dólar e Você',         emoji: '💵', fetchData: fetchDadosDolar,   generate: generateDolar,   coverQuery: 'dollar exchange rate Brazil currency' },
  fundo:   { label: 'Fundo no Microscópio', emoji: '🔍', fetchData: fetchDadosFundo,   generate: generateFundo,   coverQuery: 'investment fund portfolio Brazil finance' },
  fintech: { label: 'Fintech da Semana',    emoji: '📱', fetchData: fetchDadosFintech, generate: generateFintech, coverQuery: 'Brazilian fintech digital bank app' },
  renda:   { label: 'Renda Extra Real',     emoji: '💰', fetchData: fetchDadosRenda,   generate: generateRenda,   coverQuery: 'Brazil side hustle extra income money' },
}

// ─── Orquestrador ─────────────────────────────────────────────────────────────

async function processOriginal(dry = false, forceSeries?: Series, force = false) {
  const nowBrt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = nowBrt.getHours()
  const dayOfYear = Math.floor((nowBrt.getTime() - new Date(nowBrt.getFullYear(), 0, 0).getTime()) / 86400000)
  const slot: 'morning' | 'afternoon' = hour < 12 ? 'morning' : 'afternoon'
  const series = forceSeries ?? selectSeries(slot, dayOfYear)
  const config = SERIES_MAP[series]

  if (dry) {
    const data = await config.fetchData()
    return { dry: true, series, label: config.label, slot, nowBrt: nowBrt.toISOString(), data }
  }

  // Trava: não publica se já saiu conteúdo DESTE CRON nas últimas 3h
  // (ignora artigos do cron de notícias — usa categoria como proxy)
  if (!force) {
    const lastOriginal: string | null = await sanity.fetch(
      `*[_type=="post" && articleType=="news" && category in ["investimentos","educação financeira"] && publishedAt >= $since]|order(publishedAt desc)[0].publishedAt`,
      { since: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
    )
    if (lastOriginal) {
      console.log(`[original] Já publicou nas últimas 3h. Pulando.`)
      return { skipped: true, reason: 'recent_publish', lastOriginal }
    }
  }

  const recent = await getRecentTitles(30)
  const post = await config.generate(recent)

  // Humaniza o corpo antes de salvar
  if (Array.isArray(post.body)) {
    post.body = await humanizePostBody(post.body)
  }

  const recentPhotos = await getRecentPhotoUrls(30)
  const serperPics = await fetchSerperImages(post.title || config.coverQuery, 2)
  const photo: Photo = serperPics[0] ?? await fetchPhoto(post.coverQuery || config.coverQuery, recentPhotos)

  const doc = await createSanityPost(post, photo)
  const slug = (doc.slug as { current: string }).current
  const docId = (doc as { _id: string })._id
  const url = `${SITE}/blog/${slug}`

  if (tgConfigured()) {
    const tgRes = await tgSendMessage(
      `${config.emoji} ${config.label} para revisão\n\n${post.title}\n\n${post.excerpt?.slice(0, 200) ?? (post.body as string[])?.[0]?.replace(/^#+\s*/, '').slice(0, 200) ?? ''}\n\n🔗 ${url}`,
      blogApprovalKeyboard(docId),
    )
    if (!tgRes?.ok) console.error('[original] Telegram falhou:', JSON.stringify(tgRes))
  }

  return { ok: true, series, label: config.label, url }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = new URL(request.url).searchParams
  const dry   = params.get('dry') === 'true'
  const force = params.get('force') === 'true'
  const forceSeries = params.get('series') as Series | null

  if (dry) {
    try {
      const result = await processOriginal(true, forceSeries ?? undefined)
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  // Em dev com force=true, roda síncrono para facilitar testes
  if (force && process.env.NODE_ENV === 'development') {
    try {
      const result = await processOriginal(false, forceSeries ?? undefined, true)
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  after(async () => {
    try {
      await processOriginal(false, forceSeries ?? undefined, force)
    } catch (err) {
      await tgAlert('Cron original', err)
    }
  })

  return NextResponse.json({ ok: true, queued: true })
}
