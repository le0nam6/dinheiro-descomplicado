/**
 * Digest semanal de busca, no Telegram.
 *
 * Antes este cron resumia a performance dos posts no Instagram. O canal parou
 * de ser alimentado, então o relatório virou ruído — e o dado que move o
 * projeto está no Search Console, não no Instagram.
 *
 * O relatório responde três perguntas, nesta ordem:
 *   1. A busca cresceu ou encolheu nesta semana?
 *   2. O que já está perto da primeira página e vale empurrar?
 *   3. Que tema central do portal segue enterrado?
 *
 * O GA4 fica de fora de propósito: as visitas registradas lá são do próprio
 * editor, então não há audiência para medir ainda.
 */
import { NextResponse } from 'next/server'
import { tgConfigured, tgSendMessage, tgAlert, tgEscape } from '@/lib/publish-core'
import { consultasDoSite, type LinhaConsulta } from '@/lib/search-console'

export const maxDuration = 300

type Resumo = { impressoes: number; cliques: number; posicao: number; consultas: number }

function resumir(linhas: LinhaConsulta[]): Resumo {
  const impressoes = linhas.reduce((s, l) => s + l.impressoes, 0)
  const cliques = linhas.reduce((s, l) => s + l.cliques, 0)
  // Posição média ponderada por impressão: consulta com 300 impressões pesa
  // mais que uma com 1, o que a média simples do painel ignora.
  const posicao = impressoes
    ? linhas.reduce((s, l) => s + l.posicao * l.impressoes, 0) / impressoes
    : 0
  return { impressoes, cliques, posicao, consultas: linhas.length }
}

function variacao(agora: number, antes: number): string {
  if (!antes) return agora ? 'novo' : '—'
  const p = Math.round(((agora - antes) / antes) * 100)
  return p === 0 ? 'estável' : `${p > 0 ? '+' : ''}${p}%`
}

/** Territórios centrais do portal: se estes seguem enterrados, é o alerta real. */
const CENTRAIS = [
  'juros compostos', 'fundo de emergência', 'como investir', 'score de crédito',
  'renda fixa', 'tesouro direto', 'sair das dívidas', 'imposto de renda',
  'previdência privada', 'cartão de crédito', 'pix',
]

async function montarRelatorio(): Promise<string> {
  const [semana, duasSemanas] = await Promise.all([
    consultasDoSite({ dias: 7, limite: 1000 }),
    consultasDoSite({ dias: 14, limite: 1000 }),
  ])

  if (!semana.length && !duasSemanas.length) {
    return '<b>Busca — semana</b>\n\nSem dados do Search Console. Verifique se a API segue ativa e se a service account mantém acesso.'
  }

  const agora = resumir(semana)
  // A janela de 14 dias contém a de 7; a diferença aproxima a semana anterior.
  const tudo = resumir(duasSemanas)
  const antes = {
    impressoes: Math.max(0, tudo.impressoes - agora.impressoes),
    cliques: Math.max(0, tudo.cliques - agora.cliques),
  }

  const out: string[] = ['<b>Busca — últimos 7 dias</b>', '']
  out.push(`Impressões: <b>${agora.impressoes}</b> (${variacao(agora.impressoes, antes.impressoes)})`)
  out.push(`Cliques: <b>${agora.cliques}</b> (${variacao(agora.cliques, antes.cliques)})`)
  out.push(`Posição média: <b>${agora.posicao.toFixed(1)}</b>`)
  out.push(`Consultas distintas: ${agora.consultas}`)

  const perto = semana
    .filter(l => l.posicao >= 5 && l.posicao <= 20 && l.impressoes >= 2)
    .sort((a, b) => b.impressoes - a.impressoes)
    .slice(0, 5)
  if (perto.length) {
    out.push('', '<b>Perto da página 1</b>')
    for (const l of perto) out.push(`${Math.round(l.posicao)}ª · ${l.impressoes} impr · ${tgEscape(l.consulta.slice(0, 42))}`)
  }

  const enterrados = semana
    .filter(l => l.posicao > 30 && CENTRAIS.some(c => l.consulta.toLowerCase().includes(c)))
    .sort((a, b) => b.impressoes - a.impressoes)
    .slice(0, 4)
  if (enterrados.length) {
    out.push('', '<b>Tema central enterrado</b>')
    for (const l of enterrados) out.push(`${Math.round(l.posicao)}ª · ${l.impressoes} impr · ${tgEscape(l.consulta.slice(0, 42))}`)
    out.push('<i>A página já existe. Reescrever costuma render mais que publicar tema novo.</i>')
  }

  if (!agora.impressoes) {
    out.push('', '⚠️ <b>Zero impressões na semana.</b> Verifique ações manuais no Search Console.')
  }

  return out.join('\n')
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const texto = await montarRelatorio()
    if (tgConfigured()) await tgSendMessage(texto, undefined, 'HTML')
    else console.log('[insights]', texto)
    return NextResponse.json({ ok: true })
  } catch (err) {
    await tgAlert('Digest semanal de busca', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
