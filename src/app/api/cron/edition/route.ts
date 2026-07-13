/**
 * Edição diária — o compilado curado do mercado (estilo "The News").
 * Roda todo dia às ~5h (BRT) via GitHub Actions.
 * Curadoria com profundidade das notícias de Brasil e Mundo que impactam o
 * mercado financeiro (inclusive política). Objetivo: o leitor sair mais
 * inteligente em poucos minutos. Publica em /edicao/[data] e avisa no Telegram.
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, after } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { nanoid } from 'nanoid'
import { sanity, SITE, tgAlert, tgConfigured, fetchPhoto, nextQueueItem, markQueueUsed } from '@/lib/publish-core'
import { sendEditionCampaign } from '@/lib/brevo'
import { getEditorialContext } from '@/lib/rag'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FEEDS = [
  { source: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { source: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { source: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
  { source: 'Exame', url: 'https://exame.com/economia/feed/' },
  { source: 'Valor (Brazil Journal)', url: 'https://braziljournal.com/feed/' },
  { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
  { source: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/news_285.rss' },
  { source: 'Investing.com Mundo', url: 'https://br.investing.com/rss/news_25.rss' },
  { source: 'Suno Research', url: 'https://www.suno.com.br/noticias/feed/' },
  { source: 'Money Times', url: 'https://www.moneytimes.com.br/feed/' },
  { source: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/economia/feed/rss' },
  { source: 'NeoFeed', url: 'https://neofeed.com.br/feed/' },
  { source: 'InvestNews', url: 'https://investnews.com.br/feed/' },
  { source: 'Seu Dinheiro', url: 'https://www.seudinheiro.com/feed/' },
  { source: 'Finsiders', url: 'https://finsiders.com.br/feed/' },
  // Fontes usadas pelo The News (Geral/Night) e TNS Money — mapeadas lendo edições reais
  { source: 'Folha (Mercado)', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
  { source: 'CNN Brasil', url: 'https://admin.cnnbrasil.com.br/feed/' },
  { source: 'Estadão Economia', url: 'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/economia/' },
  { source: 'BBC Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml' },
  { source: 'The Guardian Business', url: 'https://www.theguardian.com/uk/business/rss' },
  { source: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
]

// Termos no título que indicam conteúdo completamente fora de pauta (esportes, entretenimento)
const OFF_TOPIC: string[] = [
  'copa do mundo', 'copa america', 'copa do nordeste', 'copa do brasil', 'copa libertadores',
  'seleção brasileira', 'seleção sub-', 'escalação', 'convocação da seleção',
  'treino da seleção', 'torcida', 'campeonato brasileiro', 'campeonato paulista',
  'premier league', 'champions league', 'série a', 'série b',
  'big brother', 'bbb', 'paredão', 'eliminação do', 'celebridade', 'famoso',
  'fofoca', 'affair', 'reality show', 'novela das',
]

function isOffTopic(item: { title: string; description: string }): boolean {
  const text = (item.title + ' ' + item.description).toLowerCase()
  return OFF_TOPIC.some(kw => text.includes(kw))
}

type NewsItem = { source: string; title: string; description: string; url: string; imageUrl?: string }

async function fetchNews(): Promise<NewsItem[]> {
  const cutoff = Date.now() - 30 * 60 * 60 * 1000
  const items: NewsItem[] = []
  await Promise.allSettled(FEEDS.map(async ({ source, url }) => {
    try {
      const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(7000) }).then(r => r.text())
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
        // Imagem da própria matéria (media:content, media:thumbnail, enclosure ou <img> no description)
        const img =
          b.match(/<media:content[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i) ||
          b.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
          b.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i) ||
          b.match(/<img[^>]+src=["']([^"']+)["']/i)
        const item = { source, title, description: get('description').replace(/<[^>]+>/g, '').slice(0, 260), url: link, imageUrl: img?.[1] }
        if (!isOffTopic(item)) items.push(item)
      }
    } catch { /* feed off */ }
  }))
  return items
}

type Story = {
  emoji: string
  tag: string
  headline: string
  hook: string
  what: string
  why: string
  imageQuery?: string
  sourceIndexes: number[]
}
type WordOfDay = { word: string; meaning: string; application: string }
type Curation = {
  title: string
  punchline: string
  intro: string
  closing: string
  readingTime: number
  stories: Story[]
  wordOfDay?: WordOfDay
  curiosity?: string
  recommendation?: string
  reflection?: string
}

async function curate(news: NewsItem[], previousHeadlines: string[], weekday: string, todayLabel: string, forced = false, recentWords: string[] = [], recentPunchlines: string[] = []): Promise<{ curation: Curation; news: NewsItem[] }> {
  // No modo curado (forced), o editor já escolheu — usa TODAS as manchetes recebidas.
  const pool = forced ? news : news.slice(0, 70)
  const isFriday = weekday === 'sexta-feira'
  const isSunday = weekday === 'domingo'
  const currentYear = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getFullYear()

  const ragContext = await getEditorialContext(
    'newsletter financeira tom de voz abertura estrutura título matéria',
    ['abertura', 'tom', 'estrutura', 'titulo', 'zoom-out'],
  )

  const prompt = `Você é o editor-chefe do "Endinheirados" (portalendinheirados.com.br). Monte a EDIÇÃO DIÁRIA: uma curadoria do que aconteceu de mais importante no mercado financeiro — Brasil e Mundo — que impacta a vida financeira das pessoas. Inclua POLÍTICA, mas só quando ela afeta o mercado (juros, câmbio, fiscal, eleições, regulação, etc.).

HOJE É ${weekday.toUpperCase()}, ${todayLabel}.

REFERÊNCIA DE TOM: newsletter "The News" — direto, inteligente, escaneável, leve mas preciso. Parece uma mensagem de um amigo de 18 a 28 anos que entende muito de finanças: explica sem condescendência, tem personalidade, usa ironia quando cabe, não é chato nem frio. A pessoa deve sair MAIS INTELIGENTE e com VONTADE DE COMPARTILHAR.

PERSONA — você é o Endinheirados:
Caloroso, curioso, bem-humorado. Não tem medo de dizer o que acha. Usa o cotidiano pra explicar o complexo (Nubank, iFood, boleto, aluguel). Reage às notícias em vez de só reportá-las. Quando algo é absurdo, diz que é absurdo. Quando é surpreendente, demonstra surpresa. Escreve como gente, não como robô.

EXEMPLOS DE TOM (não copie, inspire-se no espírito):
- Frio/errado: "O cenário macroeconômico apresenta incertezas relevantes."
- Quente/certo: "O mercado tá nervoso, e com razão: tem muita coisa acontecendo ao mesmo tempo."
- Frio/errado: "A medida pode impactar negativamente os consumidores de baixa renda."
- Quente/certo: "Quem vai sentir mais no bolso é quem já tá no limite do orçamento."

MANCHETES REAIS DAS ÚLTIMAS HORAS (índice | fonte | título | resumo):
${pool.map((n, i) => `${i + 1}. ${n.source} | ${n.title} | ${n.description}`).join('\n')}

NÃO repita o que saiu na edição de ontem:
${previousHeadlines.length ? previousHeadlines.map(h => `- ${h}`).join('\n') : '(primeira edição)'}
${ragContext}
REGRAS EDITORIAIS:
${forced
  ? '- As manchetes acima foram ESCOLHIDAS A DEDO pelo editor-chefe. Use TODAS elas — não descarte por relevância. Apenas AGRUPE as que tratam do mesmo fato numa única matéria.\n- REGRA CRÍTICA NO MODO CURADO: o campo "headline" de cada matéria deve reproduzir o título original da fonte com fidelidade máxima — pode ajustar gramática menor, mas NUNCA mude o sentido, a ironia ou as palavras-chave. O editor escolheu aquele título por um motivo.'
  : `- Selecione de 5 a 7 assuntos REALMENTE relevantes para o mercado financeiro. Priorize o que move juros, câmbio, bolsa, inflação, emprego e o bolso do brasileiro.
- VETO ABSOLUTO — JAMAIS inclua na edição: Copa do Mundo, qualquer campeonato de futebol/esporte, notícia de celebridade, fofoca, novela, entretenimento, BBB ou reality show. Mesmo que dominem as manchetes do dia, ignore completamente. Prefira uma edição com menos matérias do que incluir lixo.
- Manchetes da fonte "Endinheirados (publicado hoje)" são notícias que já saíram no nosso próprio site durante o dia — priorizá-las é desejável, pois reforça a cobertura do que já noticiamos.`}
- Agrupe manchetes que tratam do MESMO fato numa única matéria.
- IMPARCIALIDADE mandatória: reporte fatos, sem opinião torcedora, sem alarmismo, sem clickbait, sem inventar números.
- FONTES — REGRA CRÍTICA: NUNCA cite o nome de portais ou veículos dentro do texto das matérias ("segundo o InfoMoney", "de acordo com o G1", "conforme o Valor", "a Reuters noticiou" etc.). Escreva os fatos diretamente, como se fossem de conhecimento próprio. Se for atribuir algo a uma instituição oficial (Banco Central, governo, empresa), use o nome da instituição — nunca o do portal que noticiou. As fontes jornalísticas existem nos bastidores; o leitor não precisa saber qual feed trouxe a informação.
- DATAS E ANOS — REGRA CRÍTICA: O ANO ATUAL É ${currentYear}. Hoje é ${todayLabel} de ${currentYear}. NUNCA escreva outro ano como "este ano", "em 2025" ou similar — ${currentYear} é o presente. NUNCA afirme um ano, mês ou data específica que NÃO esteja explicitamente na manchete/resumo da fonte. Na dúvida, seja atemporal: "recentemente", "nos próximos meses", "em breve".
- Português BR coloquial e humano. Sem markdown, sem asteriscos.

CACOETES DE IA — PROIBIÇÕES ABSOLUTAS (todos os campos de texto):
- ZERO travessão (—) em qualquer contexto. Se a frase depende dele, reescreva inteira.
- Contrações coloquiais ("pra", "pro", "tá", "né", "num", "numa") são bem-vindas quando soam naturais no contexto — nunca forçadas. O critério é: o texto leria bem em voz alta?
- Artigos e preposições corretos sempre: "do", "da", "no", "na", "ao", "à" onde a gramática exige. Sintaxe correta é inegociável — fluidez e coerência textual dependem disso.
- Varie o ritmo organicamente: frases curtas quando o ponto é direto, mais longas quando está desenvolvendo. NUNCA todas do mesmo tamanho.
- Frases telegráficas empilhadas proibidas: 3+ frases seguidas com menos de 6 palavras cada. Errado: "Não é volume. É clareza. Não é frequência. É posicionamento." Certo: "O problema não é quantidade: é se o que você manda faz sentido pra quem recebe."
- Paralelismo negativo ("Não é X. É Y.") máximo 1 vez por texto inteiro. Nunca repetido.
- Vocabulário proibido: "crucial" → importante/decisivo | "fundamental" → básico/essencial | "adicionalmente" → além disso | "no mundo atual"/"em um cenário onde" → hoje/quando | "é fundamental que" → é importante/faz sentido | "isso se traduz em" → ou seja/na prática | "evidencia"/"ressalta" como gerúndio de análise → mostra/indica | "inovador"/"transformador" → descreva o que muda de verdade
- Atribuições vagas sem fonte real ("especialistas afirmam", "pesquisas mostram") são proibidas. Use raciocínio direto ou cite a fonte real disponível nas manchetes.
- Gerúndio superficial no fim de frase proibido: "evidenciando a importância de X", "demonstrando como Y", "reforçando a necessidade de Z". Quebre em frases separadas.
- Conclusões motivacionais genéricas proibidas: "o futuro é promissor para quem abraça a mudança". Feche com observação concreta ou opinião real.
- Punchline e intro: evite clichês de newsletter ("Bom dia, leitor!", "Hoje temos muito conteúdo"). Seja direto, específico, com personalidade.

PUNCHLINE ("punchline") — A PRIMEIRA COISA QUE O LEITOR VÊ:
1 frase curta (no máximo 12 palavras), impactante, que qualquer pessoa entenda NA HORA.
- É UNIVERSAL e AUTOSSUFICIENTE: faz sentido completo sozinha, sem precisar ter lido nenhuma matéria, sem depender de contexto do dia. Alguém que NUNCA vai abrir a edição tem que entender e sentir.
- É motivacional e informal, no espírito de um conselho de mesa de bar, de um tapa na cara amigável, ou de uma palavra de apoio — MAS NUNCA cite esses termos ("conselho", "tapa", "bar", "apoio") na frase.
- PROIBIDO: citar notícia específica, empresa, número, evento, ano ou jargão (ex.: "carry trade", "Selic", "Ibovespa"). Nada que exija explicação.
- Tema: dinheiro, disciplina, escolhas, tempo, liberdade financeira — verdades atemporais sobre a vida e o bolso.
- Tom de quem fala olhando no olho, sem rodeio. Exemplos de ESPÍRITO (não copie, crie uma nova):
  → "Quem não cuida do próprio dinheiro acaba trabalhando pelo dos outros."
  → "Dinheiro guardado é liberdade comprada antecipada."
  → "O boleto não tem dó de quem não se planejou."
  → "Quem controla o pouco hoje, comanda o muito amanhã."
- NÃO é a manchete. NÃO é genérica/clichê vazio. Tem que ter verdade e peso, e ser entendida por todo mundo.
${recentPunchlines.length ? `- PROIBIDO repetir — punchlines já usadas nas últimas edições (não use frases iguais nem muito parecidas): ${recentPunchlines.map(p => `"${p}"`).join(' | ')}` : ''}

ESTRUTURA DA ABERTURA ("intro"):
Escreva 2 a 3 frases que abram a manhã com personalidade — como um bom-dia inteligente que o leitor recebe às 5h.
- NUNCA comece com "Hoje", "Nesta edição", "Bom dia" ou clichê de newsletter.
- NÃO resuma nem antecipe as matérias. O leitor vai ver o sumário e as histórias logo depois — não é papel do intro adiantar o que vem.
- As notícias são das últimas 24 horas. Não escreva frases como "aconteceu hoje" ou "hoje vimos" pois o dia ainda mal começou.
- Pode ser uma observação sobre o humor do mercado, uma provocação, uma reflexão ligeira sobre o momento econômico, ou um ângulo humano sobre o que o brasileiro vai sentir ao longo do dia.
- Tom: alguém que chegou cedo, já leu tudo, e agora te conta o clima antes de você começar o dia.
- Exemplos de estilo (adapte ao momento real, não copie):
  → "Tem coisa mexendo no câmbio, nos juros e no bolso de quem paga aluguel. Não é um dia qualquer. Bora."
  → "Enquanto a maioria ainda dorme, o mercado já decidiu o humor da semana. A boa notícia é que você já acordou sabendo o que ele decidiu."
  → "O mundo financeiro não tirou férias. O brasileiro também não pode. Por isso você tá aqui às 5h lendo isso."

ESTRUTURA DE CADA MATÉRIA — VARIE, não use sempre o mesmo molde:
O leitor NÃO pode sentir que todas as matérias têm a mesma forma. Algumas são curtas e diretas, outras têm o impacto tecido na narrativa, outras separam fato e consequência. Escolha por matéria.

Campos:

1. "hook" — 1 frase de abertura que fisga antes dos fatos. Não é a manchete — é o ângulo humano, a ironia, ou o número mais impactante. NEM TODA matéria precisa de hook: deixe vazio ("") nas mais secas/técnicas, para criar contraste de ritmo. Exemplos:
   → "Essa decisão vai aparecer na sua conta de luz em breve."
   → "Seis meses atrás, ninguém apostaria nisso."

2. "what" — o relato factual. Varie o formato e o COMPRIMENTO conforme o tipo de notícia:
   - Sequência de eventos: narre em ordem cronológica
   - Decisão/política: contextualize o que foi decidido e quem decidiu
   - Dado numérico central: abra com o número
   - Tendência: compare com o período anterior
   - Algumas matérias devem ser curtas (1-2 frases secas). Outras mais desenvolvidas (até 5 frases). NÃO padronize em "2-4 frases" sempre.

3. "why" — o impacto prático no bolso do leitor. REGRA CRÍTICA: NÃO É OBRIGATÓRIO.
   - Para a maioria, escreva 1-2 frases de impacto neutro e didático (use analogia do cotidiano quando ajudar).
   - Para matérias onde o impacto JÁ ESTÁ ÓBVIO no "what", ou que são meramente informativas, deixe "why" VAZIO ("") — isso evita a sensação de fórmula repetida.
   - Mire em deixar 1 ou 2 das matérias sem "why". O contraste é o que faz a edição não parecer um molde.

4. "tag" e "emoji" — editoria curta (ex.: "Juros", "Câmbio", "Bolsa", "Política", "Global", "Cripto", "Economia") e 1 emoji representativo.

5. "imageQuery" — SEMPRE preencha: termo de busca EM INGLÊS para uma foto que ilustre a matéria (ex.: "oil tanker strait", "brazil central bank building", "stock market traders"). É o plano B caso a foto da própria matéria não esteja disponível — então descreva de forma concreta e específica ao tema. Toda matéria terá imagem.

CONTEXTO CRUZADO (só se precisar): se uma matéria fica mais clara lembrando algo de OUTRA matéria da mesma edição, costure uma frase curta de retomada ("como vimos nos juros acima, ..."). Use isso com PARCIMÔNIA — só quando ajuda de verdade o entendimento. Não force.

FECHO DA EDIÇÃO ("closing"):
1 frase final que amarra o dia — pode ser uma reflexão, uma projeção para o próximo passo, ou uma observação que conecta as histórias do dia. NUNCA é "Até amanhã", "Boa semana" ou clichê.
Exemplos de estilo:
→ "Enquanto os mercados digerem tudo isso, o brasileiro segue fazendo conta no celular."
→ "O que acontece nos próximos dias vai definir se foi um susto ou o começo de algo maior."

BLOCOS EXTRAS (deixam a edição mais viva — preencha todos os pedidos abaixo):
REGRA DE FORMATO para TODOS os blocos extras: texto puro, sem asteriscos, sem negrito/itálico markdown, sem marcadores de lista (nada de "•", "-", "1️⃣"), sem numeração emoji. Frases corridas normais.

"wordOfDay" — PALAVRA DO DIA: um conceito, fenômeno ou palavra de QUALQUER área do conhecimento — psicologia, filosofia, biologia, história, linguística, física, antropologia, sociologia, economia comportamental, neurociência. NÃO priorize finanças; o restante da edição já é sobre dinheiro.
  - "word": escolha um termo DIFERENTE e ORIGINAL. Evite os mais óbvios e famosos (Dunning-Kruger, Zeigarnik, viés de confirmação). Prefira conceitos menos conhecidos que sejam genuinamente interessantes.
  - PROIBIDO usar o formato "Efeito [Nome]" ou qualquer palavra/conceito que comece com "Efeito". Há um universo enorme de conceitos — explore outros campos.
${recentWords.length ? `  - PROIBIDO repetir — já usados nas últimas edições: ${recentWords.join(', ')}` : ''}
  - "meaning": o que significa, em linguagem simples (1-2 frases).
  - "application": como se aplica na vida real, em EXATAMENTE 3 frases curtas e práticas.

"curiosity" — CURIOSIDADE DO DIA: 2-3 frases sobre uma curiosidade real e interessante de QUALQUER área — história, ciência, comportamento humano, natureza, tecnologia, sociedade. Não precisa ter relação com finanças. Algo que faça o leitor pensar "não sabia disso". Pode conectar com a data de hoje se houver algo historicamente relevante.
${isFriday ? '\n"recommendation" — É SEXTA: recomende UMA série OU UM livro (pode ter relação leve com dinheiro, ambição, negócios, ou só ser muito bom). 2-3 frases dizendo o que é e por que vale.' : ''}
${isSunday ? '\n"reflection" — É DOMINGO: escreva uma reflexão curta (2-3 frases) sobre dinheiro, tempo, escolhas ou propósito. Tom de quem pensa alto num domingo à tarde, sem ser piegas nem clichê de autoajuda.' : ''}

TÍTULO DA EDIÇÃO ("title") — REGRAS OBRIGATÓRIAS:
- Máximo 70 caracteres (limite SEO)
- Deve conter a keyword principal do dia (ex: "Dólar", "Selic", "Copom", "Bitcoin", "Ibovespa", "Petróleo", "Lula", nome de empresa relevante)
- Tom direto, jornalístico, sem clickbait, sem ponto de exclamação
- Formatos válidos: "[Fato A] e [Fato B]: o que importa hoje" ou "[Fato principal] — o que muda no seu bolso" ou "[Keyword sobe/cai/decide] e [consequência direta]"
- Exemplos válidos: "Dólar sobe e Copom mantém juros: o que muda no seu bolso" / "Bitcoin passa dos R$ 600 mil e FIIs pagam dividendo recorde" / "Ibovespa cai 1,2% e inflação surpreende: entenda o que aconteceu"
- PROIBIDO: "Edição de DD de mês", títulos genéricos sem keyword, títulos com mais de 70 chars

Retorne SOMENTE JSON válido:
{
  "title": "título temático máx 70 chars com keyword do dia",
  "punchline": "frase curta universal sobre dinheiro/vida, entendida por qualquer um, sem citar notícia/empresa/ano (máx 12 palavras)",
  "intro": "abertura com personalidade (2-3 frases)",
  "closing": "fecho da edição (1 frase)",
  "readingTime": 4,
  "stories": [
    {
      "emoji": "📈",
      "tag": "Juros",
      "headline": "manchete curta e descritiva",
      "hook": "frase de abertura que fisga (ou \"\" se a matéria for seca)",
      "what": "o relato factual (comprimento variável)",
      "why": "impacto no bolso (ou \"\" quando já está óbvio no what)",
      "imageQuery": "termo em inglês p/ foto, específico ao tema (sempre preencher)",
      "sourceIndexes": [1, 4]
    }
  ],
  "wordOfDay": { "word": "...", "meaning": "...", "application": "três frases." },
  "curiosity": "..."${isFriday ? ',\n  "recommendation": "..."' : ''}${isSunday ? ',\n  "reflection": "..."' : ''}
}
LEMBRE: deixe hook vazio em algumas e why vazio em 1-2 — a variação no texto é o que diferencia a edição de um molde repetido. imageQuery sempre preenchido.
sourceIndexes = números das manchetes (da lista) usadas como fonte de cada matéria.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = (msg.content[0] as { text: string }).text.trim()
  const curation = JSON.parse(text.replace(/^```json\n?|\n?```$/g, '')) as Curation

  // Rede de segurança: remove markdown/marcadores que o modelo às vezes insere
  // nos campos de texto puro (asteriscos, bullets, numeração emoji).
  const clean = (s?: string) => (s || '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^[\s>]*[•\-*]\s+/gm, '')
    .replace(/\d️⃣\s*/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  curation.punchline = clean(curation.punchline)
  curation.curiosity = clean(curation.curiosity)
  curation.recommendation = clean(curation.recommendation)
  curation.reflection = clean(curation.reflection)
  if (curation.wordOfDay) {
    curation.wordOfDay.word = clean(curation.wordOfDay.word)
    curation.wordOfDay.meaning = clean(curation.wordOfDay.meaning)
    curation.wordOfDay.application = clean(curation.wordOfDay.application)
  }
  return { curation, news: pool }
}

async function fetchMarketSnapshot(): Promise<Array<{ label: string; value: string; changePct: number }>> {
  try {
    const d = await fetch(`${SITE}/api/quotes`, { signal: AbortSignal.timeout(7000) }).then(r => r.json())
    if (!d?.ok) return []
    const want = ['USDBRL', 'EURBRL', '^BVSP', 'BTCBRL']
    return (d.quotes as Array<{ symbol: string; label: string; price: number; changePct: number; kind: string }>)
      .filter(q => want.includes(q.symbol))
      .map(q => ({
        label: q.label,
        value: (q.kind === 'moeda' || q.kind === 'cripto' ? 'R$ ' : '') + q.price.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
        changePct: q.changePct,
      }))
  } catch { return [] }
}

// Imagem da página da matéria (og:image / twitter:image) quando o RSS não traz foto
async function ogImage(pageUrl: string): Promise<string | undefined> {
  try {
    const html = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }).then(r => r.text())
    const head = html.slice(0, 60000) // og tags ficam no <head>
    const m =
      head.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      head.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    const url = m?.[1]
    if (url && /^https?:\/\//.test(url)) return url
  } catch { /* página off / timeout */ }
  return undefined
}

// Resolve a imagem de uma matéria na ordem: foto do RSS → og:image da página →
// Pexels/Unsplash (segundo plano). Evita repetir imagens já usadas.
async function resolveStoryImage(
  sources: NewsItem[],
  imageQuery: string,
  fallbackQuery: string,
  used: Set<string>,
): Promise<{ _type: string; url: string; alt: string; credit: string } | undefined> {
  // 1) Foto da própria matéria (RSS)
  for (const src of sources) {
    if (src.imageUrl && !used.has(src.imageUrl)) {
      used.add(src.imageUrl)
      return { _type: 'image', url: src.imageUrl, alt: src.title, credit: `Foto: ${src.source}` }
    }
  }
  // 2) og:image da página da matéria
  for (const src of sources) {
    const og = await ogImage(src.url)
    if (og && !used.has(og)) {
      used.add(og)
      return { _type: 'image', url: og, alt: src.title, credit: `Foto: ${src.source}` }
    }
  }
  // 3) Banco de imagens (Pexels → Unsplash)
  const q = (imageQuery || fallbackQuery || 'finance money').trim()
  try {
    const photo = await fetchPhoto(q)
    if (photo.url && !used.has(photo.url)) {
      used.add(photo.url)
      return { _type: 'image', url: photo.url, alt: photo.alt, credit: photo.credit }
    }
  } catch { /* sem foto */ }
  return undefined
}

function brtDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

// Dia da semana em pt-BR (ex.: "terça-feira") no fuso de Brasília
function brtWeekday(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' })
}

// Rótulo "DD de mês" para a curiosidade do dia
function brtDayLabel(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' })
}

function editionTitle(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00')
  return `Edição de ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}`
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reqUrl = new URL(request.url)
  const previewMode = reqUrl.searchParams.get('preview') === '1'
  const forceSync = previewMode || (reqUrl.searchParams.get('force') === 'true' && process.env.NODE_ENV === 'development')

  // A geração da edição (Claude) passa dos 30s de timeout do cron-job.org.
  // Modo normal: responde 200 na hora e gera em background. Preview/force: roda síncrono.
  const work = async () => {
    try {
    const date = brtDate()
    // Modo rascunho: gera uma edição de teste com slug próprio, sem tocar na
    // edição publicada do dia, sem Telegram e sem invalidar a home.
    const preview = new URL(request.url).searchParams.get('preview') === '1'
    const previewSlug = `rascunho-${Date.now().toString(36).slice(-5)}`

    if (!preview) {
      const existing = await sanity.fetch('*[_type=="edition" && slug.current==$d][0]._id', { d: date })
      if (existing) return NextResponse.json({ ok: true, message: 'Edição de hoje já publicada', date })
    }

    // Curadoria humana (noite anterior): se o editor escolheu manchetes via
    // Telegram, usa SÓ essas. Senão, segue a curadoria automática.
    const curated = preview ? null : await sanity.fetch(
      '*[_type=="pendingEdition" && date==$d && status=="selected"]|order(createdAt desc)[0]{_id, candidates}', { d: date }
    )
    const forcedNews: NewsItem[] = curated
      ? (curated.candidates || []).filter((c: { selected: boolean }) => c.selected).map((c: { source: string; title: string; description: string; url: string }) => ({
          source: c.source, title: c.title, description: c.description, url: c.url,
        }))
      : []
    const useCurated = forcedNews.length > 0

    const rawNews = useCurated ? forcedNews : await fetchNews()

    // Posts de notícia já publicados HOJE via cron de news — entram no topo do pool
    // como candidatos prioritários (já passaram pelo filtro de relevância do news cron)
    const todayStart = `${date}T00:00:00Z`
    const todayPosts: Array<{ title: string; excerpt: string; slug: { current: string } }> = await sanity.fetch(
      `*[_type=="post" && articleType=="news" && publishedAt >= $start]|order(publishedAt desc){title,excerpt,"slug":slug.current}`,
      { start: todayStart }
    ).catch(() => [])

    const todayAsNews: NewsItem[] = todayPosts.map(p => ({
      source: 'Endinheirados (publicado hoje)',
      title: p.title,
      description: p.excerpt || '',
      url: `${SITE}/blog/${p.slug}`,
    }))

    // Candidatos do dia vêm PRIMEIRO para garantir que o Claude os veja
    const news = useCurated ? forcedNews : [...todayAsNews, ...rawNews]
    if (news.length < 4) return NextResponse.json({ ok: false, message: 'Notícias insuficientes' }, { status: 200 })

    const prev: string[] = await sanity.fetch('*[_type=="edition"] | order(date desc)[0].stories[].headline')
    const [recentWords, recentPunchlines]: [string[], string[]] = await Promise.all([
      sanity.fetch('*[_type=="edition" && defined(wordOfDay.word)] | order(date desc)[0...30].wordOfDay.word').then((r: unknown[]) => r.filter(Boolean) as string[]),
      sanity.fetch('*[_type=="edition" && defined(punchline)] | order(date desc)[0...20].punchline').then((r: unknown[]) => r.filter(Boolean) as string[]),
    ])
    const [{ curation, news: pool }, marketSnapshot, lastNumber] = await Promise.all([
      curate(news, prev || [], brtWeekday(date), brtDayLabel(date), useCurated, recentWords, recentPunchlines),
      fetchMarketSnapshot(),
      sanity.fetch<number | null>('*[_type=="edition" && defined(number)] | order(number desc)[0].number'),
    ])
    const editionNumber = (lastNumber ?? 0) + 1
    // marca a seleção como usada (não bloqueia em caso de falha de permissão)
    if (useCurated && curated?._id) { try { await sanity.patch(curated._id).set({ status: 'used' }).commit() } catch { /* ignore */ } }

    // Imagem em TODAS as matérias. Prioridade: foto da própria matéria (RSS) →
    // og:image da página → Pexels/Unsplash. Sequencial p/ não repetir imagem.
    const usedPhotoUrls = new Set<string>()
    const stories: Array<Record<string, unknown>> = []
    for (const s of curation.stories || []) {
      const idxs = Array.isArray(s.sourceIndexes) ? s.sourceIndexes : []
      const srcItems = idxs.map(i => pool[i - 1]).filter(Boolean)
      const sources = srcItems.map(n => ({ _type: 'source', _key: nanoid(6), name: n.source, url: n.url }))
      const fallbackQuery = `${s.tag || ''} finance brazil`.trim()
      const image = await resolveStoryImage(srcItems, s.imageQuery || '', fallbackQuery, usedPhotoUrls)
      stories.push({
        _type: 'story', _key: nanoid(8),
        emoji: s.emoji || '•', tag: s.tag || '', headline: s.headline,
        hook: s.hook || '',
        what: s.what, why: s.why, sources,
        ...(image ? { image } : {}),
      })
    }

    const queuedCuriosity = null // fila editorial é para conteúdo separado, não para a edição

    const wod = curation.wordOfDay
    const slugValue = preview ? previewSlug : date
    const thematicTitle = (curation.title && curation.title.length <= 120 && !curation.title.startsWith('Edição de'))
      ? curation.title
      : editionTitle(date)
    // publishedAt = 5h BRT (UTC-3 = 8h UTC) da data da edição, independente de quando o cron rodou
    const publishedAt = new Date(`${date}T08:00:00.000Z`).toISOString()
    await sanity.create({
      _type: 'edition',
      date,
      number: preview ? undefined : editionNumber,
      slug: { _type: 'slug', current: slugValue },
      title: preview ? `[RASCUNHO] ${thematicTitle}` : thematicTitle,
      publishedAt,
      punchline: curation.punchline || '',
      intro: curation.intro || '',
      closing: curation.closing || '',
      readingTime: curation.readingTime || Math.max(3, Math.round(stories.length * 0.8)),
      stories,
      marketSnapshot: marketSnapshot.map(m => ({ _type: 'quote', _key: nanoid(6), ...m })),
      ...(wod?.word ? { wordOfDay: { _type: 'wordOfDay', word: wod.word, meaning: wod.meaning || '', application: wod.application || '' } } : {}),
      ...(curation.curiosity ? { curiosity: curation.curiosity } : {}),
      ...(curation.recommendation ? { recommendation: curation.recommendation } : {}),
      ...(curation.reflection ? { reflection: curation.reflection } : {}),
    })

    const url = `${SITE}/edicao/${slugValue}`

    // No modo rascunho não mexe em cache nem avisa o Telegram
    if (!preview) {
      revalidateTag('edition', 'max')
      revalidatePath('/', 'page')
      revalidatePath('/edicao', 'page')
      revalidatePath(`/edicao/${date}`, 'page')
      if (tgConfigured()) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🗞️ Edição publicada (${stories.length} matérias)\n\n${curation.title}\n${url}`,
          }),
        }).catch(() => {})
      }
      // Envia campanha de e-mail para inscritos no Brevo
      sendEditionCampaign({
        date,
        title: curation.title || '',
        url,
        punchline: curation.punchline,
        intro: curation.intro,
        closing: curation.closing,
        readingTime: curation.readingTime || Math.max(3, Math.round(stories.length * 0.8)),
        marketSnapshot,
        stories,
        wordOfDay: curation.wordOfDay,
        curiosity: curation.curiosity,
        recommendation: curation.recommendation,
        reflection: curation.reflection,
      }).catch(e => tgAlert('Brevo sendEditionCampaign', e))
    }

    return NextResponse.json({ ok: true, preview, date, stories: stories.length, url })
  } catch (err) {
    await tgAlert('Cron edição diária (5h)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
  }

  if (forceSync) {
    return (await work()) ?? NextResponse.json({ ok: true })
  }
  after(work)
  return NextResponse.json({ ok: true, queued: true })
}
