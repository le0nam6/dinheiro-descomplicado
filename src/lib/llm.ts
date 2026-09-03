/**
 * Camada única de acesso a LLM, com failover automático entre provedores.
 *
 * A Anthropic continua sendo a primária: enquanto a chave dela estiver válida e
 * com crédito, nada muda no texto publicado. Se ela falhar por chave inválida,
 * crédito zerado, rate limit ou instabilidade, a chamada cai sozinha para a
 * cadeia de modelos gratuitos do OpenRouter e o cron termina o trabalho.
 *
 * Todo acesso a modelo no projeto passa por aqui. Não instancie SDK de LLM
 * direto em rota — senão aquele ponto fica sem rede de proteção.
 */
import Anthropic from '@anthropic-ai/sdk'

/**
 * 'fast' = tarefas curtas e estruturadas (títulos, legendas, reparo de JSON).
 * 'smart' = redação longa de artigo, onde a qualidade do texto pesa mais.
 */
export type Tier = 'fast' | 'smart'

type Step =
  | { provider: 'anthropic'; model: string }
  | { provider: 'openai-compat'; vendor: OpenAICompatVendor; model: string }

type OpenAICompatVendor = 'openrouter' | 'groq'

const OPENAI_COMPAT: Record<OpenAICompatVendor, { url: string; envKey: string }> = {
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', envKey: 'OPENROUTER_API_KEY' },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', envKey: 'GROQ_API_KEY' },
}

// Modelos gratuitos do OpenRouter, em ordem de preferência.
//
// A ordem saiu de um teste real com o prompt de notícia do pipeline, medindo se
// o modelo devolve JSON válido no schema, em português, sem as palavras banidas
// do humanizador. Resultado em 03/09/2026:
//   minimax-m3      JSON ok, 2715 chars de corpo, 8.6s  <- único com corpo cheio
//   nemotron-ultra  JSON ok,  713 chars de corpo, 31.8s
//   dots-3-note     JSON ok,  416 chars de corpo, 17.0s
// Reprovados: gemma-4-31b e glm-5.2 (429 upstream), nemotron-super (resposta
// vazia), ling-3.0-fin (estourou o budget pensando), inkling (403).
//
// Modelo gratuito sai do ar sem aviso, por isso a cadeia tem três degraus.
const OPENROUTER_FREE = [
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'dots-studio/dots-3-note-preview:free',
]

function chainFor(tier: Tier): Step[] {
  const primary = tier === 'smart' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'
  const steps: Step[] = []

  // Com o saldo da Anthropic zerado, cada chamada gastaria uma ida-e-volta só
  // pra tomar 400. LLM_SKIP_ANTHROPIC=1 tira ela da cadeia até você recarregar.
  if (process.env.LLM_SKIP_ANTHROPIC !== '1') {
    steps.push({ provider: 'anthropic', model: primary })
  }

  const freeList = process.env.OPENROUTER_MODELS?.split(',').map(m => m.trim()).filter(Boolean)
    ?? OPENROUTER_FREE
  for (const model of freeList) {
    steps.push({ provider: 'openai-compat', vendor: 'openrouter', model })
  }

  // Groq entra na cadeia só se a chave existir. Definir GROQ_MODEL e GROQ_API_KEY
  // no ambiente adiciona mais um degrau sem precisar mexer em código.
  const groqModel = process.env.GROQ_MODEL
  if (groqModel && process.env.GROQ_API_KEY) {
    steps.push({ provider: 'openai-compat', vendor: 'groq', model: groqModel })
  }

  return steps
}

export type AskOptions = {
  prompt: string
  tier?: Tier
  system?: string
  maxTokens?: number
  /** Rótulo curto pra identificar a chamada no log. */
  label?: string
}

export type AskResult = {
  text: string
  /** Qual degrau da cadeia respondeu. 'anthropic' significa que nada falhou. */
  provider: string
  model: string
  /** true quando a Anthropic falhou e um gratuito assumiu. */
  usedFallback: boolean
}

/**
 * A Anthropic devolve HTTP 400 (invalid_request_error) quando o saldo acabou,
 * não 402. Confirmado em 03/09/2026 com a mensagem "Your credit balance is too
 * low to access the Anthropic API". Por isso NÃO dá pra tratar 400 como erro de
 * prompt e abortar: é justamente o caso em que o fallback precisa entrar.
 *
 * A cadeia sempre tenta o próximo degrau, qualquer que seja o erro. Um prompt
 * realmente malformado custa no máximo uma chamada gratuita desperdiçada, e a
 * exceção final continua sendo a do primeiro degrau. Parar o pipeline é caro;
 * tentar de novo é barato.
 */
function isBillingError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return msg.includes('credit balance')
    || msg.includes('insufficient')
    || msg.includes('quota')
    || msg.includes('billing')
}

async function callAnthropic(step: Extract<Step, { provider: 'anthropic' }>, o: AskOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw Object.assign(new Error('ANTHROPIC_API_KEY ausente'), { status: 401 })

  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model: step.model,
    max_tokens: o.maxTokens ?? 4096,
    ...(o.system ? { system: o.system } : {}),
    messages: [{ role: 'user', content: o.prompt }],
  })
  const block = msg.content[0]
  const text = block && block.type === 'text' ? block.text : ''
  if (!text.trim()) throw new Error('Anthropic devolveu resposta vazia')
  return text
}

async function callOpenAICompat(
  step: Extract<Step, { provider: 'openai-compat' }>,
  o: AskOptions,
): Promise<string> {
  const { url, envKey } = OPENAI_COMPAT[step.vendor]
  const apiKey = process.env[envKey]
  if (!apiKey) throw Object.assign(new Error(`${envKey} ausente`), { status: 401 })

  const messages: { role: string; content: string }[] = []
  if (o.system) messages.push({ role: 'system', content: o.system })
  messages.push({ role: 'user', content: o.prompt })

  // Timeout próprio: o cron da Vercel corta em 300s e um modelo gratuito lento
  // travaria a rota inteira em vez de deixar o próximo degrau tentar.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 90_000)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // O OpenRouter usa esses dois pra atribuir o tráfego ao site.
        ...(step.vendor === 'openrouter'
          ? { 'HTTP-Referer': 'https://portalendinheirados.com.br', 'X-Title': 'Dinheiro Descomplicado' }
          : {}),
      },
      body: JSON.stringify({
        model: step.model,
        max_tokens: o.maxTokens ?? 4096,
        messages,
      }),
    })
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw Object.assign(new Error(`${step.vendor} ${res.status}: ${detail.slice(0, 200)}`), { status: res.status })
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string }; finish_reason?: string }[]
    error?: { message?: string }
  }
  if (data.error?.message) throw new Error(`${step.vendor}: ${data.error.message}`)

  const choice = data.choices?.[0]
  const text = choice?.message?.content ?? ''
  if (!text.trim()) {
    // Acontece com modelo de raciocínio que gasta o budget inteiro pensando.
    throw new Error(`${step.vendor} devolveu resposta vazia (finish=${choice?.finish_reason})`)
  }
  return text
}

/**
 * Faz a chamada percorrendo a cadeia até alguém responder.
 * Só lança se todos os degraus falharem — e aí o erro é o do primeiro degrau,
 * que é o que realmente interessa investigar.
 */
export async function askLLMDetailed(o: AskOptions): Promise<AskResult> {
  const tier = o.tier ?? 'fast'
  const chain = chainFor(tier)
  const tag = o.label ? `[llm:${o.label}]` : '[llm]'
  let firstError: unknown = null

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i]
    const name = step.provider === 'anthropic' ? 'anthropic' : step.vendor
    try {
      const text = step.provider === 'anthropic'
        ? await callAnthropic(step, o)
        : await callOpenAICompat(step, o)

      if (i > 0) console.warn(`${tag} respondido por ${name}/${step.model} (fallback, degrau ${i})`)
      return { text: text.trim(), provider: name, model: step.model, usedFallback: i > 0 }
    } catch (err) {
      if (i === 0) firstError = err
      const reason = err instanceof Error ? err.message : String(err)
      console.error(`${tag} ${name}/${step.model} falhou: ${reason}`)

      if (step.provider === 'anthropic' && isBillingError(err)) {
        console.error(
          `${tag} ATENÇÃO: a conta da Anthropic está sem crédito. O pipeline segue ` +
          `rodando nos modelos gratuitos, com qualidade de texto menor. ` +
          `Recarregue em console.anthropic.com/settings/billing.`,
        )
      }

      if (i === chain.length - 1) break
    }
  }

  throw firstError ?? new Error('Nenhum provedor de LLM respondeu')
}

/** Atalho pra quando só o texto interessa. */
export async function askLLM(o: AskOptions): Promise<string> {
  return (await askLLMDetailed(o)).text
}
