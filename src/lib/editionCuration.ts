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
}

export function fmtCandidateDate(pub: string): string {
  if (!pub) return ''
  const d = new Date(pub)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

// Teclado de seleção: 1 botão por candidata (toggle) + botão final "Montar edição"
export function candidatesKeyboard(id: string, candidates: Candidate[]) {
  const rows = candidates.map(c => {
    const mark = c.selected ? '✅' : '⬜'
    const date = fmtCandidateDate(c.pubDate)
    const label = `${mark} ${c.source}${date ? ' · ' + date : ''} — ${c.title}`.slice(0, 64)
    return [{ text: label, callback_data: `et:${id}:${c.idx}` }]
  })
  const n = candidates.filter(c => c.selected).length
  rows.push([{ text: `🗞️ Montar edição (${n} escolhidas)`, callback_data: `eb:${id}` }])
  return { inline_keyboard: rows }
}
