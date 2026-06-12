/**
 * Vercel Cron (a cada 2h): vertical jornalística.
 * Publica uma notícia do mercado financeiro BR + mundo, com IMPARCIALIDADE
 * mandatória, fontes discriminadas e termômetro de imparcialidade (no front).
 * Auto-publica no blog e notifica no Telegram.
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, after } from 'next/server'
import {
  sanity, SITE, type GeneratedPost, type Photo,
  createSanityPost, getRecentTitles, fetchPhoto, tgAlert, tgConfigured,
} from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FEEDS = [
  { source: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { source: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { source: 'Exame', url: 'https://exame.com/feed/' },
  { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
  { source: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/news_285.rss' },
]

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

async function generate(news: NewsItem[], recent: string[]): Promise<GeneratedPost & { newsSources: NewsItem[] }> {
  const top = news.slice(0, 12)
  const prompt = `Você é repórter de finanças do portal Endinheirados (endinheirados.cc). Escreva UMA notícia a partir das manchetes reais abaixo do mercado financeiro (Brasil e mundo).

MANCHETES DISPONÍVEIS (índice | fonte | título | resumo):
${top.map((n, i) => `${i + 1}. ${n.source} | ${n.title} | ${n.description}`).join('\n')}

NÃO repita temas já publicados:
${recent.map(t => `- ${t}`).join('\n')}

IMPARCIALIDADE É MANDATÓRIA:
- Reporte os FATOS. Sem opinião, sem adjetivos torcedores, sem especulação apresentada como certeza.
- Se há lados/visões divergentes, apresente ambos de forma equilibrada.
- Atribua afirmações às fontes ("segundo o Banco Central", "de acordo com a InfoMoney").
- Sem alarmismo, sem clickbait. Título descritivo e honesto.
- Não invente números, datas ou falas. Se faltar dado, fale de forma genérica.
- DATAS E ANOS — REGRA CRÍTICA: NUNCA afirme um ano, mês ou data específica que NÃO esteja explicitamente na manchete/fonte. É PROIBIDO escrever "em 2025", "ainda em 2025", "até 2026" se isso não veio da fonte. Na dúvida, seja atemporal ("recentemente", "nos próximos meses").
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
- Inclua uma seção que conecta a notícia ao bolso do brasileiro comum — mas SEM o rótulo mecânico "por que importa".
- Quando fizer sentido, use uma seção em formato de lista (cada item começa com "- ") para enumerar pontos, etapas ou critérios. Isso quebra o ritmo visual.

RITMO E ESTRUTURA do corpo (body):
- Varie MUITO o comprimento dos parágrafos: alguns de 1 linha para ênfase, outros de 5-6 linhas para desenvolver. Nunca todos iguais.
- 3 a 5 subtítulos de seção, começando EXATAMENTE com "## ". Os subtítulos devem ser específicos e instigantes, não genéricos ("## O impacto nos juros" é melhor que "## Análise").
- ZERO markdown inline: sem asteriscos, sem underline, sem backticks. Texto puro.

PÚBLICO-ALVO — CRÍTICO: brasileiros curiosos sobre dinheiro e mercado financeiro que NÃO são especialistas. Escreva como se estivesse explicando pra um amigo que perguntou "mas o que isso significa, exatamente?". Não assuma que o leitor já conhece termos financeiros.

ESTILO — linguagem humana, coloquial brasileira:
- Tom de amigo que entende de finanças, não de professor nem de jornalista formal
- Use contrações naturais: "pra", "pro", "tá", "né", "num", "numa"
- Frases como alguém falaria, não como escreveria num relatório
- Compare com o cotidiano: Nubank, Netflix, iFood, PIX, FGTS, aluguel, boleto
- Varie o ritmo organicamente: frases curtas quando o ponto é direto, mais longas quando está desenvolvendo uma ideia. NUNCA todas do mesmo tamanho — uniformidade denuncia IA.
- Tenha opiniões e personalidade. Não apenas relate fatos — reaja a eles quando fizer sentido.

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
- Atribuições vagas: "especialistas afirmam", "pesquisas mostram" sem fonte real são proibidos. Se não tem dado concreto, use raciocínio direto.
- Gerúndio superficial no fim de frase: "evidenciando a importância de X", "demonstrando como Y", "reforçando a necessidade de Z" são proibidos. Quebre em frases separadas.
- Conclusões genéricas motivacionais: "o futuro é promissor para quem abraça a mudança" e variações são proibidas. Termine com algo concreto.
- Títulos de seção sem Title Case: "## Estratégias de posicionamento", não "## Estratégias De Posicionamento"
- Negrito só em termos que o leitor vai querer localizar ao rolar. Nunca em frases inteiras.

Escolha as 1 a 3 manchetes que tratam do MESMO fato. Retorne SOMENTE JSON válido:
{
  "title": "título jornalístico, descritivo, max 75 chars",
  "slug": "slug-sem-acento",
  "excerpt": "resumo factual até 155 chars",
  "category": "investimentos",
  "seoKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "readingTime": 6,
  "coverQuery": "termo em inglês específico ao tema real da notícia, para busca no Pexels",
  "body": ["lead direto e completo, sem subtítulo antes.", "## Subtítulo específico e instigante", "parágrafo desenvolvido.", "parágrafo curto de ênfase.", "## Outra seção", "- item de lista um", "- item de lista dois", "parágrafo que amarra.", "## O que isso muda no seu bolso", "parágrafo de impacto sem rótulo mecânico.", "parágrafo de fechamento com o que observar a seguir."],
  "igCaption": "legenda instagram informativa e neutra, 3 parágrafos, termina com \\n\\n🔗 Leia no site: endinheirados.cc/blog/SLUG\\n\\n#mercadofinanceiro #economia #noticias #investimentos #endinheirados",
  "igTitle": "título CAIXA ALTA p/ card, max 3 linhas",
  "sourceIndexes": [1, 2]
}
sourceIndexes = índices das manchetes da lista usadas como fonte.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = (msg.content[0] as { text: string }).text.trim()
  const parsed = JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
  const idxs: number[] = Array.isArray(parsed.sourceIndexes) ? parsed.sourceIndexes : [1]
  const newsSources = idxs.map((i: number) => top[i - 1]).filter(Boolean)
  return { ...parsed, funnel: 'tofu', articleType: 'news', newsSources }
}

// Geração + publicação da notícia (pesado: RSS + IA + foto + Sanity)
async function processNews() {
  // Trava de recência: se já saiu notícia nos últimos 50 min, não publica.
  // Deixa GitHub (:00) e cron-job.org (:30) serem backup um do outro sem
  // duplicar — mantém a cadência em ~1/hora.
  const last: string | null = await sanity.fetch('*[_type=="post" && articleType=="news"]|order(publishedAt desc)[0].publishedAt')
  if (last && Date.now() - new Date(last).getTime() < 50 * 60 * 1000) return

  const news = await fetchNews()
  if (!news.length) return

  const recent = await getRecentTitles(20)
  const post = await generate(news, recent)

  const articleImg = post.newsSources[0]?.imageUrl
  const photo: Photo = articleImg
    ? { url: articleImg, alt: post.title, credit: `Foto: ${post.newsSources[0].source}` }
    : await fetchPhoto(post.coverQuery || 'stock market news')

  const doc = await createSanityPost(
    { ...post, articleType: 'news', sources: post.newsSources.map(s => ({ name: s.source, url: s.url })) } as unknown as GeneratedPost,
    photo,
  )
  const finalSlug = (doc.slug as { current: string }).current
  const blogUrl = `${SITE}/blog/${finalSlug}`

  if (tgConfigured()) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `📰 Notícia publicada\n\n${post.title}\n${blogUrl}\n\nFontes: ${post.newsSources.map((s: NewsItem) => s.source).join(', ')}` }),
    }).catch(() => {})
  }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Responde NA HORA e gera em background. A geração leva mais que os 30s de
  // timeout de alguns agendadores (cron-job.org free) — por isso o trabalho
  // pesado roda em after(), enquanto o agendador recebe um 200 imediato.
  after(async () => {
    try {
      await processNews()
    } catch (err) {
      await tgAlert('Cron notícias (1h)', err)
    }
  })
  return NextResponse.json({ ok: true, queued: true })
}
