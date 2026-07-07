// Tipos e helpers compartilhados da curadoria da edição (cron noturno + webhook)

export type Candidate = {
  _key: string
  idx: number
  source: string
  title: string
  description: string
  url: string
  pubDate: string
  selected: boolean
  imageUrl?: string
}

export function fmtCandidateDate(pub: string): string {
  if (!pub) return ''
  const d = new Date(pub)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

// Texto da mensagem: lista numerada e LEGÍVEL (a manchete inteira aparece aqui,
// porque o botão do Telegram corta o texto). O estado ✅/⬜ vai junto de cada item.
export function candidatesMessage(date: string, candidates: Candidate[]): string {
  const dd = date.split('-').reverse().join('/')
  const n = candidates.filter(c => c.selected).length
  const header =
    `🗳️ CURADORIA DA EDIÇÃO DE ${dd}\n\n` +
    `Marque as manchetes que devem entrar tocando no número correspondente abaixo. ` +
    `Quando terminar, toque em "Montar edição". Se não escolher nada, a edição sai automática às 5h.\n\n` +
    `Selecionadas: ${n}\n\n`
  const lines = candidates.map(c => {
    const mark = c.selected ? '✅' : '⬜'
    const date = fmtCandidateDate(c.pubDate)
    return `${mark} ${c.idx + 1}. ${c.title}\n     ↳ ${c.source}${date ? ' · ' + date : ''}`
  }).join('\n\n')
  return header + lines
}

// Teclado COMPACTO: botões só com o número (+ ✅ quando marcado), 5 por linha,
// e o botão final "Montar edição". O conteúdo legível está no texto da mensagem.
export function candidatesKeyboard(id: string, candidates: Candidate[]) {
  const btns = candidates.map(c => ({
    text: `${c.idx + 1}${c.selected ? ' ✅' : ''}`,
    callback_data: `et:${id}:${c.idx}`,
  }))
  const rows: Array<Array<{ text: string; callback_data: string }>> = []
  for (let i = 0; i < btns.length; i += 5) rows.push(btns.slice(i, i + 5))
  const n = candidates.filter(c => c.selected).length
  rows.push([{ text: `🗞️ Montar edição (${n})`, callback_data: `eb:${id}` }])
  return { inline_keyboard: rows }
}
