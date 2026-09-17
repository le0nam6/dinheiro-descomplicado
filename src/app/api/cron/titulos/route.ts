/**
 * Cron de reescrita de título — semanal, às terças.
 *
 * Existe porque conteúdo novo é a alavanca mais lenta que há: página nova
 * demora semanas para ranquear e meses para render clique. Enquanto isso, o
 * acervo tem 90 páginas entre a 4ª e a 20ª posição somando 3.272 impressões e
 * 31 cliques em 90 dias — CTR de 0,95%. Aí o Google já fez a parte dele: a
 * pessoa vê o resultado e não clica. Isso é título, e título conserta hoje.
 *
 * A rotina procura a página que mais deixa clique na mesa, pede um título novo
 * ancorado nas consultas reais que ela recebe e manda para você decidir. Só
 * troca com o seu ✓, e guarda o título antigo e as métricas do dia — sem isso
 * não há como saber depois se a reescrita funcionou.
 *
 * Só mexe entre a 4ª e a 10ª posição. Abaixo disso o problema não é título:
 * em página 2 quase ninguém chega, e reescrever ali é trabalho perdido.
 *
 * A janela é de 28 dias, e isso é deliberado. Com 90 dias, uma página que teve
 * 755 impressões em julho e zero desde 21/08 aparecia como candidata perfeita
 * — posição 9, CTR miserável — quando na verdade ela nem está sendo mostrada.
 * Título não conserta página que o Google parou de exibir. Se o site inteiro
 * estiver em queda, esta rotina fica quieta, e é o comportamento certo.
 */
import { NextResponse, after } from 'next/server'
import { askLLM } from '@/lib/llm'
import { consultasDoSite, consultasPorPagina } from '@/lib/search-console'
import { sanity, tgSendMessage, tgConfigured, tgAlert, tgEscape, parseJsonSafe } from '@/lib/publish-core'

export const maxDuration = 300

/** Quantas páginas levar ao Telegram por rodada. Poucas, para a decisão ser rápida. */
const QUANTAS = 2

/** Dias sem mexer de novo na mesma página, para dar tempo de medir o efeito. */
const CARENCIA = 60

/** Janela de análise. Curta de propósito: ver o presente, não a média do trimestre. */
const JANELA = 28

/** Piso de impressões na janela. Abaixo disso não há o que medir nem o que ganhar. */
const MINIMO = 15

/**
 * CTR que cada posição costuma render. São valores aproximados de mercado e é
 * assim que devem ser lidos: servem para ordenar quem está mais longe do
 * esperado, não para prometer número nenhum.
 */
function ctrEsperado(posicao: number): number {
  if (posicao <= 1.5) return 0.25
  if (posicao <= 2.5) return 0.15
  if (posicao <= 3.5) return 0.10
  if (posicao <= 5) return 0.07
  if (posicao <= 7) return 0.04
  return 0.025
}

type Alvo = {
  _id: string
  slug: string
  titulo: string
  excerpt?: string
  texto: string
  impressoes: number
  cliques: number
  posicao: number
  consultas: { termo: string; impressoes: number; posicao: number }[]
}

function slugDaUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+\/blog\//, '').replace(/\/$/, '')
}

async function candidatas(): Promise<Alvo[]> {
  const [paginas, cruzamento] = await Promise.all([
    consultasDoSite({ dias: JANELA, limite: 5000, dimensao: 'page' }),
    consultasPorPagina({ dias: JANELA, limite: 5000 }),
  ])

  const brutas = paginas
    .filter(l => l.consulta.includes('/blog/') && l.posicao >= 4 && l.posicao <= 10.5 && l.impressoes >= MINIMO)
    .map(l => ({ ...l, esperado: ctrEsperado(l.posicao) }))
    .filter(l => l.ctr < l.esperado * 0.6)
    .map(l => ({ ...l, perdidos: l.impressoes * (l.esperado - l.ctr) }))
    .sort((a, b) => b.perdidos - a.perdidos)
    .slice(0, 12)

  if (!brutas.length) return []

  const docs: {
    _id: string; slug: string; title: string; excerpt?: string
    texto: string; tituloTrocadoEm?: string
  }[] = await sanity.fetch(
    `*[_type=="post" && status=="aprovado" && slug.current in $s]{
      _id, "slug": slug.current, title, excerpt, tituloTrocadoEm, "texto": pt::text(body)
    }`,
    { s: brutas.map(l => slugDaUrl(l.consulta)) },
  ).catch(() => [])

  // Carência: página reescrita há pouco ainda não teve tempo de mostrar efeito,
  // e trocar de novo apaga a chance de atribuir a mudança a alguma coisa.
  const limite = Date.now() - CARENCIA * 86_400_000
  const porSlug = new Map(
    docs
      .filter(d => !d.tituloTrocadoEm || new Date(d.tituloTrocadoEm).getTime() < limite)
      .map(d => [d.slug, d]),
  )

  const porUrl = new Map<string, { termo: string; impressoes: number; posicao: number }[]>()
  for (const l of cruzamento) {
    const lista = porUrl.get(l.url) ?? []
    lista.push({ termo: l.consulta, impressoes: l.impressoes, posicao: l.posicao })
    porUrl.set(l.url, lista)
  }

  const alvos: Alvo[] = []
  for (const l of brutas) {
    const d = porSlug.get(slugDaUrl(l.consulta))
    if (!d) continue
    alvos.push({
      _id: d._id,
      slug: d.slug,
      titulo: d.title,
      excerpt: d.excerpt,
      texto: (d.texto ?? '').slice(0, 1400),
      impressoes: l.impressoes,
      cliques: l.cliques,
      posicao: l.posicao,
      consultas: (porUrl.get(l.consulta) ?? []).sort((a, b) => b.impressoes - a.impressoes).slice(0, 5),
    })
    if (alvos.length >= QUANTAS) break
  }
  return alvos
}

async function reescrever(a: Alvo): Promise<{ titulo: string; resumo: string; porque: string } | null> {
  const consultas = a.consultas.length
    ? a.consultas.map(q => `- "${q.termo}" (${q.impressoes} impressões, ${Math.round(q.posicao)}ª posição)`).join('\n')
    : '(o Google ocultou as consultas desta página — use o assunto do texto)'

  const prompt = `Esta página aparece na ${Math.round(a.posicao)}ª posição do Google e teve ${a.impressoes} impressões em 90 dias, mas só ${a.cliques} clique(s). O texto está bom; o título é que não faz a pessoa clicar.

TÍTULO ATUAL: ${a.titulo}
RESUMO ATUAL: ${a.excerpt ?? '(sem resumo)'}

CONSULTAS QUE TRAZEM ESSA PÁGINA:
${consultas}

COMEÇO DO ARTIGO:
${a.texto}

Escreva um título novo e um resumo novo.

REGRAS DO TÍTULO
- No máximo 62 caracteres. Conte antes de responder.
- Use as palavras da consulta, na ordem em que a pessoa digitou.
- Prometa exatamente o que o artigo entrega. Se o artigo traz número concreto (valor, percentual, prazo), use esse número copiado do texto acima. Se o texto não traz número, não invente nenhum.
- Sem "descubra", sem "veja como", sem reticências, sem promessa vazia.
- Português do Brasil, sem inicial maiúscula em toda palavra.

REGRAS DO RESUMO
- Até 155 caracteres. É o que aparece embaixo do título no Google.
- Diga, concreto, o que a pessoa leva da leitura. Não repita o título com outras palavras.

Responda só com JSON: {"titulo": "...", "resumo": "...", "porque": "uma frase sobre o que mudou e por que deve render mais clique"}`

  try {
    const raw = await askLLM({ prompt, tier: 'smart', maxTokens: 700, label: 'titulos' })
    const r = await parseJsonSafe<{ titulo?: string; resumo?: string; porque?: string }>(raw)
    if (!r?.titulo || !r?.resumo) return null
    // Título muito longo é cortado na busca, e o corte costuma comer a promessa.
    if (r.titulo.length > 75) return null
    return { titulo: r.titulo.trim(), resumo: r.resumo.trim(), porque: (r.porque ?? '').trim() }
  } catch (err) {
    console.error('[titulos] falha ao reescrever:', err instanceof Error ? err.message : err)
    return null
  }
}

async function processar() {
  const alvos = await candidatas()
  if (!alvos.length) {
    console.log('[titulos] nenhuma página fora do esperado nesta semana')
    return
  }

  for (const a of alvos) {
    const novo = await reescrever(a)
    if (!novo) continue

    const doc = await sanity.create({
      _type: 'tituloSugerido',
      status: 'sugerido',
      postId: a._id,
      slug: a.slug,
      tituloAntes: a.titulo,
      excerptAntes: a.excerpt,
      tituloDepois: novo.titulo,
      excerptDepois: novo.resumo,
      porque: novo.porque,
      // Marco zero da medição: sem guardar isto, daqui a dois meses ninguém
      // sabe dizer se o título novo melhorou alguma coisa.
      impressoesAntes: a.impressoes,
      cliquesAntes: a.cliques,
      posicaoAntes: a.posicao,
      criadoEm: new Date().toISOString(),
    })

    if (!tgConfigured()) {
      console.log(`[titulos] sugestão para ${a.slug}: ${novo.titulo}`)
      continue
    }

    const texto = [
      '<b>Título perdendo clique</b>',
      `${Math.round(a.posicao)}ª posição · ${a.impressoes} impressões · ${a.cliques} clique(s) em 90 dias`,
      '',
      `<b>Hoje:</b> ${tgEscape(a.titulo)}`,
      `<b>Proposta:</b> ${tgEscape(novo.titulo)}`,
      '',
      `<i>${tgEscape(novo.porque)}</i>`,
      '',
      `https://portalendinheirados.com.br/blog/${a.slug}`,
    ].join('\n')

    await tgSendMessage(texto, {
      inline_keyboard: [[
        { text: '✓ Trocar', callback_data: `ta:${doc._id}` },
        { text: '✕ Manter', callback_data: `tr:${doc._id}` },
      ]],
    }, 'HTML')
  }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  after(async () => {
    try {
      await processar()
    } catch (err) {
      await tgAlert('Cron de títulos', err)
    }
  })
  return NextResponse.json({ ok: true, queued: true })
}
