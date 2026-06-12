/**
 * Vercel Cron: gera post no blog + publica no Instagram
 * Roda 4x/dia: 9h (notícia), 12h (evergreen), 15h (notícia), 18h (evergreen)
 * Configurado em vercel.json
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import {
  sanity, SITE, type GeneratedPost,
  createSanityPost, buildSlideUrls, deliverCarousel, fetchPhoto,
  tgConfigured, tgSendPhoto, tgAlert, getRecentTitles, getRecentPhotoUrls, getTitlesByCategory,
} from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// --- Taxonomia de tópicos por categoria ---
// Cada entrada é um ângulo específico ainda não coberto pelo blog.
// O modelo escolhe UM que não conste nos títulos já publicados.
const TOPIC_TAXONOMY: Record<string, string[]> = {
  'ganhar dinheiro': [
    'dropshipping no Shopee e Mercado Livre: como começar sem estoque',
    'marketing de afiliados na Hotmart e Monetizze: quanto dá pra ganhar de verdade',
    'afiliado Amazon Brasil: passo a passo para o primeiro link',
    'freelancing no Workana e 99Freelas: como montar o perfil e fechar o primeiro cliente',
    'Fiverr para brasileiros: vender serviços em dólar',
    'criar e vender curso online: quanto custa e quanto pode render',
    'YouTube do zero à monetização: qual o caminho real',
    'TikTok Creator Fund no Brasil: quem pode receber e quanto',
    'Instagram como fonte de renda: quando começa a pagar de verdade',
    'newsletter paga no Substack: como brasileiros estão fazendo isso funcionar',
    'aluguel por temporada no Airbnb: quanto rende um quarto extra',
    'revendedor de cosméticos (Avon, Natura, Boticário): vale a pena hoje',
    'motorista de app (Uber, 99, InDrive): quanto se ganha por hora de verdade',
    'entregador de app (iFood, Rappi, Loggi): a conta real do custo-benefício',
    'bico de fim de semana: as opções mais bem pagas por hora',
    'como precificar o seu trabalho freelancer sem vender barato',
    'abrir MEI: quando vale a pena e o que muda no bolso',
    'CLT com CNPJ: como fazer isso de forma legal',
    'consultoria: como transformar o que você já sabe em fonte de renda',
    'vender fotos no Shutterstock e Adobe Stock: funciona para brasileiros',
    'aulas particulares online: plataformas, preço e como atrair alunos',
    'personal trainer online: como montar a clientela do zero',
    'social media freelancer: o que as empresas pagam e o que exigem',
    'copywriter freelancer: onde encontrar clientes e quanto cobrar',
    'dev freelancer: como sair do trampo fixo sem perder renda',
    'vender no eBay para o exterior: exportação simples para pessoa física',
    'print on demand: criar produtos sem estoque e vender online',
    'renda com dividendos: quanto precisa investir para ter R$1.000 por mês',
    'FIIs como renda mensal: como montar uma carteira do zero',
    'aluguel de vaga de garagem: quanto rende e como funciona',
    'venda de produtos digitais (e-books, templates, planilhas)',
    'revenda de produtos importados: o que pode e o que é ilegal',
    'agência de serviços digitais: como dois ou três freelancers crescem juntos',
    'checklist financeiro para largar a CLT com segurança',
    'quanto guardar antes de se tornar PJ ou abrir negócio',
    'renda extra na aposentadoria: o que funciona para quem tem mais de 50 anos',
    'side hustle enquanto ainda é CLT: como organizar o tempo',
    'monetizar habilidades artísticas: ilustração, design, música',
    'trabalho remoto internacional: plataformas e como receber em dólar',
    'compra e venda de domínios: o mercado de nomes de sites',
  ],
  'investimentos': [
    'Tesouro IPCA+: para quais objetivos ele é o melhor',
    'Tesouro Selic vs Tesouro IPCA+: quando trocar um pelo outro',
    'CDB vs LCI vs LCA: a diferença real no rendimento líquido',
    'FIIs de tijolo vs papel: qual é melhor para quem está começando',
    'como montar uma carteira de dividendos do zero',
    'ETF vs fundo de índice: quando um é melhor que o outro',
    'como investir com menos de R$100 por mês',
    'carteira para quem ganha salário mínimo',
    'como declarar investimentos no imposto de renda',
    'ações de small caps: risco e retorno na prática',
    'BDRs: como investir em empresas americanas pela B3',
    'criptomoedas no imposto de renda: o que precisa declarar',
    'previdência privada PGBL vs VGBL: qual vale mais para você',
    'como funcionam os fundos multimercado',
    'renda fixa vs renda variável: montar a mistura certa',
    'como avaliar se uma ação está cara ou barata (P/L, P/VP)',
    'debêntures incentivadas: o que são e quando fazem sentido',
    'investimento em ouro: como funciona no Brasil',
    'COE: o que é e por que a maioria deve evitar',
    'como rebalancear a carteira de investimentos',
    'investir para a aposentadoria: por onde começar aos 20, 30 e 40 anos',
    'fundo de emergência vs investimento: a linha que separa os dois',
    'como investir a restituição do imposto de renda',
    'investir o 13º salário: o que fazer com o dinheiro extra',
    'impacto dos juros altos nos seus investimentos em renda fixa',
    'como a Selic alta afeta quem investe em ações',
    'LCI e LCA isentas: o que muda com as novas regras',
    'spread bancário: por que o banco paga menos do que cobra',
    'como calcular o rendimento real descontando inflação',
    'investimento sustentável (ESG): faz diferença no retorno',
  ],
  'educação financeira': [
    'como montar uma planilha de controle de gastos do zero',
    'método 50/30/20: funciona para quem ganha pouco',
    'método envelope: a técnica analógica que ainda funciona',
    'como sair do cheque especial em 90 dias',
    'fundo de emergência: quanto você realmente precisa guardar',
    'como negociar dívidas com o banco: o script que funciona',
    'Serasa Limpa Nome: vale a pena ou tem armadilha',
    'educação financeira para casais: como alinhar os gastos',
    'mesada para filhos: quanto dar e como ensinar o valor',
    'como organizar as finanças depois de uma separação',
    'dívida de cartão de crédito: a matemática do buraco',
    'consórcio: quando vale e quando é cilada',
    'como usar o FGTS de forma estratégica',
    'planejamento financeiro para autônomos e PJs',
    'como economizar no supermercado sem abrir mão de qualidade',
    'assinaturas que você paga e não usa: o dinheiro invisível',
    'financiamento de carro: a conta que ninguém faz direito',
    'como planejar uma viagem sem entrar em dívida',
    'poupar vs investir: a diferença prática entre os dois',
    'como criar uma reserva para o IPTU e IPVA sem apertar',
    'o custo real de um pet: o que ninguém calcula antes de adotar',
    'saúde financeira: os sinais de que as finanças estão fora de controle',
  ],
  'cartão de crédito': [
    'como escolher o cartão de crédito certo para o seu perfil',
    'limite do cartão: como aumentar sem prejudicar o score',
    'cashback: os cartões que mais devolvem dinheiro hoje',
    'milhas aéreas: vale a pena acumular ou é ilusão',
    'cartão com anuidade zero: o que você abre mão',
    'como usar o cartão de crédito para investir o dinheiro mais tempo',
    'parcelar vs pagar à vista: quando o parcelamento compensa',
    'cartão de crédito para negativados: o que existe no mercado',
    'fatura do cartão: o que cada cobrança significa',
    'como cancelar um cartão sem prejudicar o score',
    'cartão adicional: riscos e benefícios de dar para terceiros',
    'chargeback: como funciona o estorno no cartão',
    'golpes no cartão de crédito: os mais comuns e como se proteger',
    'Nubank vs Itaú vs Bradesco: comparativo honesto de cartões',
    'cartão black e platinum: quem realmente se beneficia',
  ],
  'empréstimo': [
    'empréstimo consignado: quando é a melhor e a pior opção',
    'crédito pessoal vs empréstimo com garantia: a diferença real',
    'CDC vs leasing: o que muda na prática',
    'portabilidade de crédito: como usar para pagar menos juros',
    'empréstimo com garantia de imóvel (home equity): quando vale',
    'FGTS como garantia de empréstimo: entendendo o novo modelo',
    'cheque especial: como sair sem pedir outro empréstimo',
    'como comparar taxas de empréstimo (CET vs taxa nominal)',
    'empréstimo para negativados: o que é legítimo e o que é golpe',
    'quando é melhor pedir empréstimo do que parcelar no cartão',
  ],
  'financiamento': [
    'financiamento imobiliário: SFH vs SFI — qual muda o seu bolso',
    'FGTS no financiamento: como usar e quanto economiza',
    'financiamento pelo MCMV: quem pode e como funciona',
    'tabela SAC vs Price: a diferença real em reais',
    'amortização extra no financiamento: prazo vs parcela — o que compensa',
    'portabilidade de financiamento imobiliário: quanto pode economizar',
    'consórcio imobiliário vs financiamento: comparativo honesto',
    'financiamento de carro: o custo total que ninguém mostra',
    'score para aprovação de financiamento: o que realmente pesa',
  ],
  'previdência': [
    'INSS: como calcular quanto você vai receber na aposentadoria',
    'contribuição facultativa no INSS: vale a pena para autônomo',
    'previdência privada: como avaliar o fundo antes de contratar',
    'taxa de administração da previdência: o impacto em 30 anos',
    'portabilidade de previdência privada: quando e como fazer',
    'PGBL para quem declara no modelo completo: a conta do benefício fiscal',
    'como a previdência privada é tributada no resgate',
    'aposentadoria por invalidez vs aposentadoria por idade',
    'pensão por morte: quem tem direito e quanto recebe',
    'como regularizar contribuições em atraso no INSS',
  ],
}

// --- Busca de sugestões no Google via Serper ---
async function fetchGoogleSuggestions(query: string): Promise<string[]> {
  const key = process.env.SERPER_API_KEY
  if (!key) return []
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'br', hl: 'pt-br', num: 10 }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    const suggestions: string[] = []
    // "People also ask"
    for (const q of (data.peopleAlsoAsk || []).slice(0, 6)) {
      if (q.question) suggestions.push(q.question)
    }
    // Buscas relacionadas
    for (const r of (data.relatedSearches || []).slice(0, 6)) {
      if (r.query) suggestions.push(r.query)
    }
    return suggestions
  } catch {
    return []
  }
}

// --- Calendário de conteúdo ---

const EVERGREEN_FUNNEL: Record<number, Record<number, string>> = {
  0: { 12: 'tofu', 18: 'mofu' },
  1: { 12: 'mofu', 18: 'bofu' },
  2: { 12: 'bofu', 18: 'tofu' },
  3: { 12: 'tofu', 18: 'mofu' },
  4: { 12: 'mofu', 18: 'bofu' },
  5: { 12: 'bofu', 18: 'tofu' },
  6: { 12: 'tofu', 18: 'mofu' },
}

const CATEGORY_MAP: Record<string, string> = {
  tofu: 'educação financeira',
  mofu: 'investimentos',
  bofu: 'cartão de crédito',
}

function getSchedule() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = now.getHours()
  const day  = now.getDay()
  if (hour === 9 || hour === 15) return { type: 'news', funnel: 'tofu', hour }
  const funnel = EVERGREEN_FUNNEL[day]?.[hour] ?? 'mofu'
  return { type: 'evergreen', funnel, hour }
}

// --- Buscar notícias ---

async function fetchNews(): Promise<string> {
  const feeds = [
    'https://www.infomoney.com.br/feed/',
    'https://g1.globo.com/rss/g1/economia/',
    'https://exame.com/feed/',
  ]
  const items: Array<{ title: string; description: string; url: string; imageUrl?: string }> = []
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)

  await Promise.allSettled(feeds.map(async feedUrl => {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) })
      const xml = await res.text()
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let match
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1]
        const get = (tag: string) => {
          const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
          return m ? (m[1] || m[2] || '').trim() : ''
        }
        const title = get('title')
        const description = get('description').replace(/<[^>]+>/g, '').slice(0, 300)
        const link = get('link')
        const pubDate = get('pubDate')
        if (!title || !link) continue
        if (pubDate && new Date(pubDate) < cutoff) continue
        const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["']/) ||
                           block.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/)
        const imageUrl = mediaMatch?.[1]
        items.push({ title, description, url: link, imageUrl })
      }
    } catch { /* feed indisponível */ }
  }))
  return JSON.stringify(items.slice(0, 6))
}

// --- Gerar post com Claude ---

async function generatePost(schedule: ReturnType<typeof getSchedule>, news: string, recentTitles: string[]) {
  const { type, funnel } = schedule

  const funnelGuide = {
    tofu: 'topo de funil (awareness): tema amplo, desperta curiosidade, ideal para quem nunca investiu',
    mofu: 'meio de funil (consideration): comparações, como-fazer, aprofundamento prático',
    bofu: 'fundo de funil (decision): recomendações específicas, ranking, melhores opções do momento',
  }[funnel]

  const focusByDay = ['ganhar dinheiro', 'investimentos', 'educação financeira', 'ganhar dinheiro', 'cartão de crédito', 'investimentos', 'ganhar dinheiro']
  const focusCategory = type === 'evergreen' ? focusByDay[new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getDay()] : ''

  // Busca títulos já publicados na categoria + sugestões do Google em paralelo
  const [categoryTitles, googleSuggestions] = await Promise.all([
    focusCategory ? getTitlesByCategory(focusCategory) : Promise.resolve([] as string[]),
    focusCategory ? fetchGoogleSuggestions(`${focusCategory} finanças pessoais Brasil`) : Promise.resolve([] as string[]),
  ])

  // Monta guia de foco com taxonomia + títulos já cobertos
  let focusGuide = ''
  if (focusCategory) {
    const taxonomy = TOPIC_TAXONOMY[focusCategory] ?? []
    const coveredTitles = [...new Set([...recentTitles, ...categoryTitles])]

    const taxonomyBlock = taxonomy.length
      ? `\nLISTA DE ÂNGULOS DISPONÍVEIS para a categoria "${focusCategory}" (escolha UM que ainda não foi coberto):\n${taxonomy.map(t => `- ${t}`).join('\n')}`
      : ''

    const googleBlock = googleSuggestions.length
      ? `\nPERGUNTAS REAIS que brasileiros estão buscando no Google agora (use como inspiração de ângulo ou título):\n${googleSuggestions.map(s => `- ${s}`).join('\n')}`
      : ''

    const coveredBlock = coveredTitles.length
      ? `\nTÍTULOS JÁ PUBLICADOS nessa categoria — NÃO repita o mesmo ângulo:\n${coveredTitles.map(t => `- ${t}`).join('\n')}`
      : ''

    focusGuide = `\n\nFOCO OBRIGATÓRIO — categoria "${focusCategory}":${taxonomyBlock}${googleBlock}${coveredBlock}\n\nEscolha o ângulo mais útil e ainda não coberto. Defina "category": "${focusCategory}". ${focusCategory === 'ganhar dinheiro' ? 'NADA de "ganhar dinheiro rápido/garantido" — só caminhos reais e honestos.' : ''}`
  }

  const currentYear = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getFullYear()

  // Evita repetição global recente
  const globalAvoid = recentTitles.length
    ? `\n\nNÃO REPITA estes temas recentes de outras categorias:\n${recentTitles.slice(0, 20).map(t => `- ${t}`).join('\n')}`
    : ''

  // Para notícias, inclui imageUrl do artigo original se disponível
  let articleImageUrl: string | undefined
  let context: string
  if (type === 'news') {
    try {
      const newsItems: Array<{ title: string; description: string; url: string; imageUrl?: string }> = JSON.parse(news)
      const picked = newsItems[0]
      articleImageUrl = picked?.imageUrl || undefined
      context = `Com base nesta notícia financeira recente do mercado brasileiro:\nTítulo: ${picked?.title}\nDescrição: ${picked?.description}\nURL: ${picked?.url}\n\nCrie um post educativo que explica o impacto dessa notícia para o brasileiro comum.`
    } catch {
      context = `Com base nestas notícias financeiras recentes:\n${news}\n\nEscolha a mais relevante.`
    }
  } else {
    context = `Crie um post evergreen (${funnelGuide}) sobre finanças pessoais para o público brasileiro.`
  }
  context += focusGuide + globalAvoid

  const prompt = `${context}

Você escreve para o blog Endinheirados (endinheirados.cc), portal de finanças pessoais para brasileiros da Geração Z.

ANO ATUAL: ${currentYear}. NUNCA escreva outro ano como "este ano", "em 2025", "ano passado" sem fonte explícita — ${currentYear} é o presente. Qualquer referência temporal sem fonte deve ser atemporal ("recentemente", "hoje em dia", "nos últimos meses").

PÚBLICO-ALVO — CRÍTICO: brasileiros curiosos sobre dinheiro que NÃO são especialistas. Escreva como se fosse explicar pra um amigo que perguntou "mas como isso funciona mesmo?". Não assuma que o leitor conhece termos financeiros.

ESTILO OBRIGATÓRIO — linguagem humana, coloquial brasileira:
- Tom de amigo que entende de finanças, não de professor nem de especialista formal
- Contrações coloquiais ("pra", "pro", "tá", "né", "num", "numa") são bem-vindas quando soam naturais no contexto — nunca forçadas. O critério é: o texto leria bem em voz alta?
- Artigos e preposições corretos sempre: "do", "da", "no", "na", "ao", "à" onde a gramática exige. Sintaxe correta é inegociável — fluidez e coerência textual dependem disso.
- Comparações com o cotidiano: Nubank, Netflix, iFood, PIX, FGTS, aluguel, boleto
- Varie o ritmo organicamente: frases curtas quando o ponto é direto, mais longas quando está desenvolvendo uma ideia. NUNCA todas do mesmo tamanho — uniformidade denuncia IA.
- Começa o artigo direto no assunto — sem "Olá leitores" nem introduções genéricas
- Tenha opiniões e personalidade. Não apenas descreva — reaja ao tema quando fizer sentido.

TERMOS TÉCNICOS — obrigatório:
- Se citar qualquer termo financeiro (Selic, spread, CDB, LCI, Ibovespa, yield, hedge, etc.), SEMPRE explique no mesmo parágrafo de forma simples.
- Formato: "A taxa Selic (a taxa básica de juros do Brasil, definida pelo Banco Central) subiu novamente."
- Se houver um artigo no blog sobre o termo, sugira: "Quer entender mais sobre [TERMO]? Tem um guia completo lá no blog."

THROWBACK / ZOOM OUT — use quando necessário (especialmente em posts de notícia):
- Se o tema só faz sentido com contexto histórico ou de mercado, inclua uma seção "## Um passo atrás" (ou título específico equivalente)
- Explique de forma simples: o pano de fundo, como chegamos até aqui, por que importa agora
- Use apenas quando o contexto é realmente necessário para entender o tema

CACOETES DE IA — PROIBIÇÕES ABSOLUTAS:
- ZERO travessão (—) em qualquer contexto. Se a frase depende dele, reescreva inteira.
- Frases telegráficas empilhadas: 3+ frases seguidas com menos de 6 palavras cada são proibidas. Junte num raciocínio completo. Errado: "Não é volume. É clareza. Não é frequência. É posicionamento." Certo: "O problema não é quantidade: é se o que você manda faz sentido pra quem recebe."
- Paralelismo negativo ("Não é X. É Y.") máximo 1 vez por texto. Nunca repetido.
- Vocabulário proibido — substitua sempre: "crucial" → importante/decisivo | "fundamental" → básico/essencial | "delve"/"aprofundar" → entrar em/olhar mais de perto | "highlight" (verbo) → apontar/mostrar | "adicionalmente" → além disso/também | "no mundo atual"/"em um cenário onde" → hoje/quando | "é fundamental que" → é importante/faz sentido | "isso se traduz em" → ou seja/na prática | "evidencia"/"ressalta"/"demonstra" como gerúndio de análise → mostra/indica/deixa claro | "inovador"/"revolucionário"/"transformador" → descreva o que realmente muda
- Atribuições vagas: "especialistas afirmam", "pesquisas mostram" sem fonte real são proibidos. Use raciocínio direto.
- Gerúndio superficial no fim de frase: "evidenciando a importância de X", "demonstrando como Y" são proibidos. Quebre em frases separadas.
- Conclusões motivacionais genéricas: "o futuro é promissor para quem abraça a mudança" e variações são proibidas. Termine com algo concreto.
- Títulos de seção sem Title Case: "## Como funciona na prática", não "## Como Funciona Na Prática"
- Negrito só em termos que o leitor vai querer localizar ao rolar. Nunca em frases inteiras.

REGRAS DO CORPO (body) — CRÍTICO:
- ZERO markdown inline: sem asteriscos, sem underline, sem backticks, sem colchetes
- Textos em negrito ou itálico são PROIBIDOS — escreva em texto puro
- Subtítulos de seção começam EXATAMENTE com "## " (dois sustenidos + espaço)
- Cada item do array body é uma string: ou "## Subtítulo" ou um parágrafo simples
- Links são proibidos dentro do body

INDEPENDÊNCIA EDITORIAL — CRÍTICO quando o conteúdo cita empresas, bancos, corretoras, cartões ou produtos financeiros:
- Este NÃO é um conteúdo patrocinado. NUNCA escreva como se fosse publicidade ou parceria.
- PROIBIDO usar linguagem de venda: "abra sua conta agora", "garanta já", "a melhor escolha é", "recomendamos a empresa X", CTAs para produtos específicos, ou tom promocional de uma marca.
- Mantenha neutralidade jornalística: ao comparar empresas, apresente CRITÉRIOS objetivos (taxas, custos, o que oferece) e cite PRÓS E CONTRAS de cada uma.
- Deixe claro que qualquer ranking é uma análise editorial independente baseada em informações públicas, não indicação paga.
- O leitor deve sair informado para decidir sozinho — não empurrado para uma marca.
- Não invente dados, taxas ou números específicos de empresas. Se não tiver certeza, fale de forma genérica ("costumam cobrar", "varia conforme").

Retorne SOMENTE um JSON válido (sem texto fora do JSON):
{
  "title": "título chamativo em português, max 70 chars",
  "slug": "slug-url-amigavel-sem-acento",
  "excerpt": "resumo de até 155 chars para SEO, direto ao ponto",
  "funnel": "${funnel}",
  "category": "uma de: ganhar dinheiro | empréstimo | cartão de crédito | financiamento | investimentos | previdência | educação financeira",
  "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "readingTime": 5,
  "coverQuery": "query específica em inglês para buscar foto no Pexels. Para notícias: descreva o assunto real (ex: 'Azul airline Brazil airport plane', 'Selic interest rate Brazil bank', 'Nubank credit card Brazil'). Para evergreen: descreva a cena visual (ex: 'person counting money table', 'couple planning finances laptop'). Seja ESPECÍFICO — evite termos genéricos como 'money', 'finance', 'business'.",
  "body": [
    "## Subtítulo da primeira seção",
    "Parágrafo com texto puro, sem asteriscos nem markdown inline.",
    "Mais um parágrafo simples.",
    "## Outra seção",
    "Parágrafo puro continuando o conteúdo."
  ],
  "igCaption": "legenda instagram com 3 parágrafos de 4-5 linhas cada, tom informal genZ, sem emojis no corpo, finaliza com: \\n\\n🔗 Acesse o guia completo em endinheirados.cc/blog/SLUG\\n\\n#finançaspessoais #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados",
  "igTitle": "título em CAIXA ALTA para o card do Instagram, max 3 linhas de 25 chars",
  "carousel": [
    { "title": "headline curto do slide 2, max 40 chars CAIXA ALTA", "body": "explicação de 1 a 2 frases, linguagem genZ, max 180 chars" },
    { "title": "slide 3", "body": "..." },
    { "title": "slide 4", "body": "..." }
  ]
}

REGRAS DO CARROSSEL (campo carousel):
- Gere de 3 a 4 slides de conteúdo (eles virão DEPOIS do slide de capa e ANTES do slide final de CTA, que são gerados automaticamente).
- Cada slide ensina UMA ideia: um passo, um dado, uma dica prática. Nada de encher linguiça.
- title: manchete curtíssima e impactante. body: explicação clara e direta, tom de amigo.
- O carrossel deve fazer a pessoa entender o tema mesmo sem ler o blog — é conteúdo de valor, não teaser vazio.
- NUNCA soar como publi. Se citar empresa, mantenha neutralidade.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  const parsed = JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
  // Injeta imageUrl do artigo original se existir
  if (articleImageUrl) parsed.articleImageUrl = articleImageUrl
  return parsed
}

// --- Foto: Pexels (primário) → Unsplash (fallback) ---


// --- Handler principal ---

export async function GET(request: Request) {
  // Verifica token de segurança para evitar chamadas não autorizadas
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const schedule = getSchedule()
    console.log(`[cron/publish] Rodando às ${schedule.hour}h — tipo: ${schedule.type}, funil: ${schedule.funnel}`)

    // 1. Buscar notícias se necessário
    const news = schedule.type === 'news' ? await fetchNews() : ''

    // 2. Gerar conteúdo com Claude (evitando repetir temas recentes)
    const [recentTitles, recentPhotos] = await Promise.all([
      getRecentTitles(15),
      getRecentPhotoUrls(30),
    ])
    const post = await generatePost(schedule, news, recentTitles)
    console.log(`[cron/publish] Post gerado: "${post.title}"`)

    // 3. Foto: tenta imagem do artigo original → Pexels (sem repetir) → Unsplash
    const articleImageUrl = schedule.type === 'news' ? (post.articleImageUrl as string | undefined) : undefined
    const photo = articleImageUrl
      ? { url: articleImageUrl, alt: post.title as string, credit: 'Foto: Fonte original' }
      : await fetchPhoto(post.coverQuery as string || 'personal finance money', recentPhotos)

    // 4. Modo aprovação: cria rascunho pendente e manda os botões no Telegram.
    //    O blog e o carrossel só saem depois do seu OK.
    const coverTitle = (post.igTitle as string) || (post.title as string)
    const caption = (post.igCaption as string).replace('SLUG', post.slug as string)
    const slides = Array.isArray(post.carousel)
      ? (post.carousel as Array<{ title: string; body: string }>).filter(s => s?.title && s?.body).slice(0, 4)
      : []
    const slideUrls =
      slides.length >= 2
        ? buildSlideUrls(coverTitle, photo.url, slides)
        : [`${SITE}/api/og?title=${encodeURIComponent(coverTitle)}&photo=${encodeURIComponent(photo.url)}&cta=${encodeURIComponent('LEIA A LEGENDA')}`]

    if (!tgConfigured()) {
      // Sem Telegram: fallback publica direto (comportamento antigo)
      const doc = await createSanityPost(post as unknown as GeneratedPost, photo)
      await deliverCarousel(slideUrls, caption, `${SITE}/blog/${post.slug}`)
      return NextResponse.json({ ok: true, mode: 'auto', sanityId: doc._id, slug: post.slug })
    }

    // Guarda o rascunho pendente (inclui coverQuery p/ "trocar foto")
    const coverQuery = (post.coverQuery as string) || 'personal finance money'
    const pending = await sanity.create({
      _type: 'pendingPost',
      status: 'pending',
      createdAt: new Date().toISOString(),
      data: JSON.stringify({ post: { ...post, coverQuery }, photo, slideUrls, caption }),
    })
    const id = pending._id

    const tipo = schedule.type === 'news' ? '🔥 Notícia quente' : `📚 Evergreen (${schedule.funnel.toUpperCase()})`
    await tgSendPhoto(
      slideUrls[0],
      `🆕 Post pronto pra revisão\n\n${tipo}\n📌 ${post.title}\n\n${(post.excerpt as string)}\n\nAprovar publica no blog + manda o carrossel aqui.`,
      {
        inline_keyboard: [[
          { text: '✅ Aprovar', callback_data: `ap:${id}` },
          { text: '❌ Rejeitar', callback_data: `rj:${id}` },
        ], [
          { text: '✏️ Título', callback_data: `ed:${id}` },
          { text: '📝 Legenda', callback_data: `ec:${id}` },
          { text: '🖼 Foto', callback_data: `ph:${id}` },
        ]],
      }
    )

    return NextResponse.json({ ok: true, mode: 'approval', pendingId: id, slug: post.slug })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/publish] Erro:', message)
    await tgAlert(`Cron publish (${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`, err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
