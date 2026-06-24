/**
 * Cron jornalístico. O agendador (cron-job.org) bate de hora em hora, mas a
 * rota só gera notícia em 4 janelas por dia: 8h, 12h, 16h e 20h (horário de
 * Brasília). Fora desses slots, qualquer disparo é ignorado.
 * Publica uma notícia do mercado financeiro BR + mundo, com IMPARCIALIDADE
 * mandatória, fontes discriminadas e termômetro de imparcialidade (no front).
 * Cada notícia entra como rascunho e vai pro Telegram para aprovação manual.
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, after } from 'next/server'
import {
  sanity, SITE, type GeneratedPost, type Photo,
  createSanityPost, getRecentTitles, getRecentPhotoUrls, fetchPhoto, fetchSerperImages,
  tgAlert, tgConfigured, tgSendMessage, humanizePostBody, blogApprovalKeyboard,
  nextQueueItem, markQueueUsed,
} from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FEEDS = [
  { source: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { source: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { source: 'Exame', url: 'https://exame.com/feed/' },
  { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
  { source: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/news_285.rss' },
  { source: 'NeoFeed', url: 'https://neofeed.com.br/feed/' },
  { source: 'InvestNews', url: 'https://investnews.com.br/feed/' },
  { source: 'Money Times', url: 'https://www.moneytimes.com.br/feed/' },
  { source: 'Seu Dinheiro', url: 'https://www.seudinheiro.com/feed/' },
  { source: 'Finsiders', url: 'https://finsiders.com.br/feed/' },
]

// Janelas de publicação (hora de Brasília). O agendador bate de hora em hora,
// mas só geramos notícia nesses horários — 4 por dia.
const PUBLISH_SLOTS = [8, 12, 16, 20]

type NewsItem = { source: string; title: string; description: string; url: string; imageUrl?: string }

async function fetchNews(): Promise<NewsItem[]> {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const items: NewsItem[] = []
  await Promise.allSettled(FEEDS.map(async ({ source, url }) => {
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
        const title = get('title'), link = get('link'), pub = get('pubDate')
        if (!title || !link) continue
        if (pub && new Date(pub).getTime() < cutoff) continue
        const img = b.match(/<media:content[^>]+url=["']([^"']+)["']/) || b.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/)
        items.push({ source, title, description: get('description').replace(/<[^>]+>/g, '').slice(0, 240), url: link, imageUrl: img?.[1] })
      }
    } catch { /* feed off */ }
  }))
  return items
}

// Detecta temas saturados nas últimas 12h para forçar diversidade
function detectSaturatedThemes(recentTitles: string[]): string[] {
  const themePatterns: Record<string, RegExp> = {
    'Selic/Copom/juros Brasil': /selic|copom|taxa de juro|taxa básica/i,
    'Fed/juros EUA': /fed |federal reserve|jerome powell|juros (nos |dos )?eua|fomc/i,
    'Dólar/câmbio': /\bdólar\b|câmbio|real se|cotação do real/i,
    'Irã/Ormuz/guerra Oriente Médio': /irã|ormuz|oriente médio|hamas|israel|palestina|hezbollah/i,
    'Ibovespa/bolsa': /ibovespa|bolsa cai|bolsa sobe|b3 /i,
  }
  const saturated: string[] = []
  for (const [theme, pattern] of Object.entries(themePatterns)) {
    const hits = recentTitles.filter(t => pattern.test(t)).length
    if (hits >= 2) saturated.push(theme)
  }
  return saturated
}

async function generate(news: NewsItem[], recent: string[], saturatedThemes: string[], editorBrief?: string): Promise<GeneratedPost & { newsSources: NewsItem[] }> {
  // Embaralha as notícias para não pegar sempre as primeiras do mesmo feed
  const shuffled = [...news].sort(() => Math.random() - 0.5)
  const top = shuffled.slice(0, 20)
  const currentYear = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getFullYear()

  const diversityBlock = saturatedThemes.length > 0 ? `
DIVERSIDADE OBRIGATÓRIA — temas já muito cobertos hoje (evite salvo se for absolutamente a maior notícia do momento):
${saturatedThemes.map(t => `- ${t}`).join('\n')}
Prefira manchetes sobre: empresas e negócios, resultados corporativos, IPOs/fusões/aquisições, Copa do Mundo e impacto econômico, consumo e varejo, fintechs e tecnologia financeira, criptomoedas, empreendedorismo, comportamento financeiro do brasileiro, mercado de trabalho, imóveis, agronegócio.
` : ''
  const editorBlock = editorBrief ? `
PAUTA OBRIGATÓRIA DO EDITOR-CHEFE (prioridade máxima, acima de tudo abaixo):
"${editorBrief}"
Escreva a notícia SOBRE essa pauta. Se houver manchetes na lista relacionadas, use-as como fonte e cite. Se não houver nenhuma relacionada, escreva com base em conhecimento factual e atual do tema, mantendo imparcialidade e SEM inventar números, datas ou falas específicas. O título e o ângulo devem refletir a pauta do editor, não outra manchete.
` : ''
  const prompt = `Você é repórter de finanças do portal Endinheirados (endinheirados.cc). Escreva UMA notícia a partir das manchetes reais abaixo do mercado financeiro (Brasil e mundo).
${editorBlock}
MANCHETES DISPONÍVEIS (índice | fonte | título | resumo):
${top.map((n, i) => `${i + 1}. ${n.source} | ${n.title} | ${n.description}`).join('\n')}

NÃO repita temas já publicados:
${recent.map(t => `- ${t}`).join('\n')}
${diversityBlock}

IMPARCIALIDADE É MANDATÓRIA:
- Reporte os FATOS. Sem opinião, sem adjetivos torcedores, sem especulação apresentada como certeza.
- Se há lados/visões divergentes, apresente ambos de forma equilibrada.
- Atribua afirmações às fontes ("segundo o Banco Central", "de acordo com a InfoMoney").
- Sem alarmismo, sem clickbait. Título descritivo e honesto.
- Não invente números, datas ou falas. Se faltar dado, fale de forma genérica.
- DATAS E ANOS — REGRA CRÍTICA: O ANO ATUAL É ${currentYear}. NUNCA escreva qualquer outro ano como "ano atual", "este ano", "em 2025" ou similar — ${currentYear} é o presente. NUNCA afirme um ano futuro ou passado que NÃO esteja explicitamente na manchete/fonte. Na dúvida, seja atemporal ("recentemente", "nos próximos meses").
- Explique o impacto para o brasileiro comum de forma didática e neutra.

ÂNGULO DA MATÉRIA — ESCOLHA UM e siga a estrutura dele (NÃO use sempre o mesmo padrão "subtítulo + 1 parágrafo"):
- BREAKING: lead com o fato; depois contexto, reações, desdobramentos. Seções: o fato → o contexto → quem é afetado → o que vem agora.
- EXPLICADOR (PERGUNTA-RESPOSTA): organize o corpo em perguntas que o leitor faria como subtítulos ("## Por que isso aconteceu?", "## Quem ganha e quem perde?", "## O que muda na prática?"). Ótimo para temas complexos.
- EM NÚMEROS: abra com o dado central. Use uma seção de contexto histórico ("não acontecia isso desde...") e compare com períodos anteriores.
- ANÁLISE: vá fundo. Examine causa, efeito em cadeia, cenários possíveis, o que especialistas (citados nas fontes) dizem. A mais longa das estruturas.
- PERFIL/BASTIDORES: quando a notícia é sobre uma empresa ou pessoa, conte a trajetória, o contexto do setor, o que esse movimento sinaliza.
NÃO escolha sempre o mesmo. Varie de matéria para matéria.

O LEAD (primeiro parágrafo) precisa funcionar sozinho — pirâmide invertida, o mais importante primeiro, sem warmup ("nesta matéria você vai ver" é proibido).

PROFUNDIDADE — esta é uma matéria de verdade, não uma nota:
- O corpo deve ter de 8 a 14 parágrafos (não conte os subtítulos). Notícia rasa de 3 parágrafos é REJEITADA.
- Vá ALÉM da manchete: traga contexto que o leitor não tem (histórico, comparação com casos parecidos, o que está por trás, o que pode acontecer depois).
- Se a fonte traz dados, explore-os. Se traz uma decisão, explique o porquê e as consequências em cadeia.
- O fechamento da matéria deve seguir a notícia, não um template. Se o desdobramento natural é político, feche com o que vem a seguir. Se é de mercado, com o que os dados indicam. Conectar ao cotidiano do leitor só quando essa ligação é genuína e acrescenta algo real — não como seção obrigatória de encerramento.
- Quando fizer sentido, use uma seção em formato de lista (cada item começa com "- ") para enumerar pontos, etapas ou critérios. Isso quebra o ritmo visual.

RITMO E ESTRUTURA do corpo (body):
- Varie MUITO o comprimento dos parágrafos: alguns de 1 linha para ênfase, outros de 5-6 linhas para desenvolver. Nunca todos iguais.
- 3 a 5 subtítulos de seção, começando EXATAMENTE com "## ". Os subtítulos devem ser específicos e instigantes, não genéricos ("## O impacto nos juros" é melhor que "## Análise").
- ZERO markdown inline: sem asteriscos, sem underline, sem backticks. Texto puro.

PÚBLICO-ALVO — CRÍTICO: brasileiros curiosos sobre dinheiro e mercado financeiro que NÃO são especialistas. Escreva como se estivesse explicando pra um amigo que perguntou "mas o que isso significa, exatamente?" num happy hour. Não assuma que o leitor já conhece termos financeiros.

PERSONA DO ESCRITOR — você é o Endinheirados:
Pensa em alguém de 18 a 28 anos que trabalha com finanças, mas que nunca perdeu o senso de humor. Sabe tudo sobre o mercado, mas prefere falar como gente. Usa ironia leve quando cabe. Faz analogias com o cotidiano sem forçar. Tem opinião própria e não tem medo de dizer o que acha — com responsabilidade. É caloroso, direto, e nunca condescendente.

EXEMPLOS DE TOM que você deve buscar (não copie, inspire-se):
- Frio/errado: "O aumento da taxa básica de juros impacta negativamente o mercado de crédito."
- Quente/certo: "A Selic subiu de novo. Na prática, fica mais caro pegar dinheiro emprestado — e mais atraente deixar na renda fixa."
- Frio/errado: "Analistas divergem sobre os possíveis desdobramentos do cenário macroeconômico."
- Quente/certo: "Ninguém sabe exatamente pra onde isso vai, mas todo mundo tem um palpite diferente — e alguns deles fazem bastante sentido."
- Frio/errado: "A empresa registrou crescimento de 23% em sua receita no período."
- Quente/certo: "A empresa cresceu 23% só no último trimestre. Pra ter ideia, isso é mais do que muita gente fatura em anos."

ESTILO — linguagem humana, coloquial brasileira:
- Tom de amigo que entende de finanças, não de professor nem de jornalista formal
- Ironia e humor leve são bem-vindos quando a notícia pede — mas sem forçar e sem tirar a seriedade do fato
- Contrações coloquiais ("pra", "pro", "tá", "né", "num", "numa") são bem-vindas quando soam naturais — nunca forçadas. O critério é: o texto leria bem em voz alta?
- Artigos e preposições corretos sempre: "do", "da", "no", "na", "ao", "à" onde a gramática exige. Sintaxe correta é inegociável.
- Compare com o cotidiano: Nubank, Netflix, iFood, PIX, FGTS, aluguel, boleto, fila do banco, conta de luz
- Varie o ritmo organicamente: frases curtas quando o ponto é direto, mais longas quando está desenvolvendo. NUNCA todas do mesmo tamanho.
- Tenha personalidade. Não apenas relate fatos — reaja a eles, mostre o absurdo quando é absurdo, a ironia quando existe.

TERMOS TÉCNICOS — obrigatório:
- Se o texto citar qualquer termo financeiro (Selic, spread, yield, carry trade, drawdown, hedge, CDB, LCI, Ibovespa, IPO, etc.), SEMPRE explique no mesmo parágrafo de forma simples.
- Formato: "A taxa Selic (a taxa básica de juros do Brasil, definida pelo Banco Central) voltou a subir."
- Se houver espaço natural, sugira: "Quer entender mais sobre [TERMO]? Tem um guia no blog."

THROWBACK / ZOOM OUT — use quando a notícia precisa de contexto:
- Se a notícia só faz sentido com um pano de fundo histórico ou de mercado, inclua uma seção "## Um passo atrás" (ou título específico equivalente)
- Explique de forma simples: o que aconteceu antes, como chegamos até aqui, por que importa agora
- Use APENAS quando o contexto é realmente necessário — não em toda matéria

CACOETES DE IA — PROIBIÇÕES ABSOLUTAS:
- ZERO travessão (—) em qualquer contexto. Se a frase depende dele, reescreva inteira.
- Frases telegráficas empilhadas: 3+ frases seguidas com menos de 6 palavras cada são proibidas. Junte num raciocínio completo. Errado: "Não é volume. É clareza. Não é frequência. É posicionamento." Certo: "O problema não é quantidade: é se o que você manda faz sentido pra quem recebe."
- Paralelismo negativo ("Não é X. É Y.") máximo 1 vez por texto. Nunca repetido.
- Vocabulário proibido — substitua sempre: "crucial" → importante/decisivo | "fundamental" → básico/essencial | "delve"/"aprofundar" → entrar em/olhar mais de perto | "highlight" (verbo) → apontar/mostrar | "adicionalmente" → além disso/também | "no mundo atual"/"em um cenário onde" → hoje/quando | "é fundamental que" → é importante/faz sentido | "isso se traduz em" → ou seja/na prática | "evidencia"/"ressalta"/"demonstra" como gerúndio de análise → mostra/indica/deixa claro | "inovador"/"revolucionário"/"transformador" → descreva o que realmente muda
- Atribuições vagas: "especialistas afirmam", "pesquisas mostram", "analistas consultados", "especialistas ouvidos pelo Endinheirados" sem fonte real são PROIBIDOS. Não existem. Se não tem dado concreto com nome e origem, use raciocínio direto.
- Gerúndio superficial no fim de frase: "evidenciando a importância de X", "demonstrando como Y", "reforçando a necessidade de Z" são proibidos. Quebre em frases separadas.
- Conclusões genéricas motivacionais: "o futuro é promissor para quem abraça a mudança" e variações são proibidas. Termine com algo concreto.
- Títulos de seção sem Title Case: "## Estratégias de posicionamento", não "## Estratégias De Posicionamento"
- Negrito só em termos que o leitor vai querer localizar ao rolar. Nunca em frases inteiras.

Escolha as 1 a 3 manchetes que tratam do MESMO fato. Retorne SOMENTE JSON válido:
{
  "title": "título jornalístico, descritivo, max 75 chars",
  "slug": "slug-sem-acento",
  "excerpt": "resumo factual até 155 chars",
  "category": "notícias",
  "seoKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "readingTime": 6,
  "coverQuery": "termo em inglês específico ao tema real da notícia, para busca no Pexels",
  "body": ["lead direto e completo, sem subtítulo antes.", "## Subtítulo específico ao fato (não genérico)", "parágrafo desenvolvido.", "parágrafo curto de ênfase.", "## Outro subtítulo específico", "- item de lista um", "- item de lista dois", "parágrafo que amarra.", "## Subtítulo que fecha com o ângulo natural desta notícia", "parágrafo de fechamento concreto — o que vem a seguir, o que os dados indicam, ou o que o leitor deveria observar."],
  "igCaption": "legenda instagram informativa e neutra, 3 parágrafos, termina com \\n\\n🔗 Leia no site: endinheirados.cc/blog/SLUG\\n\\n#mercadofinanceiro #economia #noticias #investimentos #endinheirados",
  "igTitle": "título CAIXA ALTA p/ card, max 3 linhas",
  "sourceIndexes": [1, 2]
}
sourceIndexes = índices das manchetes da lista usadas como fonte.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = (msg.content[0] as { text: string }).text.trim()
  const parsed = JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
  const idxs: number[] = Array.isArray(parsed.sourceIndexes) ? parsed.sourceIndexes : [1]
  const newsSources = idxs.map((i: number) => top[i - 1]).filter(Boolean)
  return { ...parsed, category: 'notícias', funnel: 'tofu', articleType: 'news', newsSources }
}

// Retorna true se o título novo repete o mesmo assunto de algum título recente
function isTooSimilar(newTitle: string, existingTitles: string[]): boolean {
  const words = newTitle.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  return existingTitles.some(t => {
    const existing = new Set(t.toLowerCase().split(/\s+/).filter(w => w.length > 4))
    return words.filter(w => existing.has(w)).length >= 3
  })
}

// Geração + publicação da notícia (pesado: RSS + IA + foto + Sanity)
async function processNews(skipRecencyLock = false) {
  // Gate de janela + trava de recência. Em dev/force, ambos são ignorados.
  if (!skipRecencyLock) {
    // Só publica nos slots de 8h, 12h, 16h e 20h (horário de Brasília).
    const spNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    if (!PUBLISH_SLOTS.includes(spNow.getHours())) return
    // Trava de recência: se já saiu notícia na última hora, não duplica o slot.
    const last: string | null = await sanity.fetch('*[_type=="post" && articleType=="news"]|order(publishedAt desc)[0].publishedAt')
    if (last && Date.now() - new Date(last).getTime() < 90 * 60 * 1000) return
  }

  const news = await fetchNews()
  if (!news.length) return

  // Títulos das últimas 6h para checar duplicata de assunto
  const recentNewsTitles: string[] = await sanity.fetch(
    `*[_type=="post" && articleType=="news" && publishedAt >= $since]|order(publishedAt desc).title`,
    { since: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() }
  )

  // Títulos das últimas 12h para detectar temas saturados e forçar diversidade
  const recentTitles12h: string[] = await sanity.fetch(
    `*[_type=="post" && articleType=="news" && publishedAt >= $since]|order(publishedAt desc).title`,
    { since: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
  )
  const saturatedThemes = detectSaturatedThemes(recentTitles12h)

  // Pauta do editor tem prioridade sobre a escolha automática
  const queued = await nextQueueItem('noticia')

  const recent = await getRecentTitles(20)
  const post = await generate(news, recent, saturatedThemes, queued?.brief)

  // Descarta se o assunto já foi publicado nas últimas 6h (exceto pauta do editor, que sempre vale)
  if (!queued && isTooSimilar(post.title, recentNewsTitles)) {
    console.log(`[news] Assunto já coberto nas últimas 6h, pulando: "${post.title}"`)
    return
  }

  // Humaniza o corpo antes de salvar
  if (Array.isArray(post.body)) {
    post.body = await humanizePostBody(post.body)
  }

  const articleImg = post.newsSources[0]?.imageUrl
  const recentPhotos = await getRecentPhotoUrls(30)

  let photo: Photo
  if (articleImg) {
    photo = { url: articleImg, alt: post.title, credit: `Foto: ${post.newsSources[0].source}` }
  } else {
    const serperPics = await fetchSerperImages(post.title || post.coverQuery || 'mercado financeiro brasil', 1)
    photo = serperPics[0] ?? await fetchPhoto(post.coverQuery || 'stock market news', recentPhotos)
  }

  const doc = await createSanityPost(
    { ...post, articleType: 'news', sources: post.newsSources.map(s => ({ name: s.source, url: s.url })) } as unknown as GeneratedPost,
    photo,
  )
  const finalSlug = (doc.slug as { current: string }).current
  const docId = (doc as { _id: string })._id
  const blogUrl = `${SITE}/blog/${finalSlug}`

  // Marca a pauta do editor como usada
  if (queued) await markQueueUsed(queued._id, finalSlug)

  if (tgConfigured()) {
    const tgRes = await tgSendMessage(
      `📰 Notícia para revisão${queued ? ' (sua pauta)' : ''}\n\n${post.title}\n\n${post.excerpt?.slice(0, 200) ?? ''}\n\n🔗 ${blogUrl}\n\n📌 Fontes: ${post.newsSources.map((s: NewsItem) => s.source).join(', ') || '—'}`,
      blogApprovalKeyboard(docId),
    )
    if (!tgRes?.ok) console.error('[news] Telegram falhou:', JSON.stringify(tgRes))
  }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const force = new URL(request.url).searchParams.get('force') === 'true'

  // Em dev com force=true, roda síncrono para facilitar testes
  if (force && process.env.NODE_ENV === 'development') {
    try {
      await processNews(true)
      return NextResponse.json({ ok: true, forced: true })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  // Responde NA HORA e gera em background. A geração leva mais que os 30s de
  // timeout de alguns agendadores (cron-job.org free) — por isso o trabalho
  // pesado roda em after(), enquanto o agendador recebe um 200 imediato.
  after(async () => {
    try {
      await processNews(force)
    } catch (err) {
      await tgAlert('Cron notícias (slots 8/12/16/20h)', err)
    }
  })
  return NextResponse.json({ ok: true, queued: true })
}
