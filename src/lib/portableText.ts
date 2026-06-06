// Conversão bidirecional Markdown <-> PortableText (compartilhado pelo admin e scripts)

function uid() { return Math.random().toString(36).slice(2, 10) }

type Span = { _type: string; _key: string; text: string; marks: string[] }
type MarkDef = { _key: string; _type: string; href: string }

// Suporta **negrito** e [texto](url) — gera children + markDefs
function parseInline(text: string): { children: Span[]; markDefs: MarkDef[] } {
  const children: Span[] = []
  const markDefs: MarkDef[] = []
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0, m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) children.push({ _type: 'span', _key: uid(), text: text.slice(last, m.index), marks: [] })
    if (m[1] !== undefined) {
      children.push({ _type: 'span', _key: uid(), text: m[1], marks: ['strong'] })
    } else {
      const key = uid()
      markDefs.push({ _key: key, _type: 'link', href: m[3] })
      children.push({ _type: 'span', _key: uid(), text: m[2], marks: [key] })
    }
    last = regex.lastIndex
  }
  if (last < text.length) children.push({ _type: 'span', _key: uid(), text: text.slice(last), marks: [] })
  if (!children.length) children.push({ _type: 'span', _key: uid(), text, marks: [] })
  return { children, markDefs }
}

function makeBlock(style: string, text: string) {
  const { children, markDefs } = parseInline(text)
  return { _type: 'block', _key: uid(), style, markDefs, children }
}

export function markdownToBlocks(markdown: string) {
  const lines = markdown.split('\n')
  const blocks: Record<string, unknown>[] = []
  let listItems: { text: string; style: string }[] = []

  const flushList = () => {
    if (!listItems.length) return
    listItems.forEach(({ text, style }) => {
      const { children, markDefs } = parseInline(text)
      blocks.push({ _type: 'block', _key: uid(), style: 'normal', listItem: style, level: 1, markDefs, children })
    })
    listItems = []
  }

  let tableLines: string[] = []
  const flushTable = () => {
    if (tableLines.length < 2) { tableLines = []; return }
    const rows = tableLines
      .filter(l => !/^\s*\|?[\s:|-]+\|?\s*$/.test(l) || !l.includes('-'))
      .map(l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim().replace(/\*\*/g, '')))
    if (rows.length) blocks.push({ _type: 'table', _key: uid(), rows: rows.map(cells => ({ _key: uid(), cells })) })
    tableLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('|')) { flushList(); tableLines.push(trimmed); continue }
    else if (tableLines.length) flushTable()
    if (!trimmed) { flushList(); continue }
    if (line.startsWith('#### ')) { flushList(); blocks.push(makeBlock('h4', line.slice(5).trim())); continue }
    if (line.startsWith('### ')) { flushList(); blocks.push(makeBlock('h3', line.slice(4).trim())); continue }
    if (line.startsWith('## ')) { flushList(); blocks.push(makeBlock('h2', line.slice(3).trim())); continue }
    if (line.startsWith('> ')) { flushList(); blocks.push(makeBlock('blockquote', line.slice(2).trim())); continue }
    if (line.startsWith('- ') || line.startsWith('* ')) { listItems.push({ text: line.slice(2).trim(), style: 'bullet' }); continue }
    if (/^\d+\.\s/.test(line)) { listItems.push({ text: line.replace(/^\d+\.\s/, '').trim(), style: 'number' }); continue }
    flushList()
    if (trimmed) blocks.push(makeBlock('normal', trimmed))
  }
  flushList()
  flushTable()
  return blocks.filter((b) => b._type === 'table' || (b.children as { text?: string }[])?.some(s => s.text?.trim()))
}

// PortableText -> Markdown (para editar)
export function blocksToMarkdown(blocks: Record<string, unknown>[]): string {
  if (!blocks) return ''
  const lines: string[] = []
  for (const b of blocks) {
    if (b._type === 'table') {
      const rows = (b.rows as { cells: string[] }[]) || []
      rows.forEach((row, i) => {
        lines.push('| ' + row.cells.join(' | ') + ' |')
        if (i === 0) lines.push('|' + row.cells.map(() => '---').join('|') + '|')
      })
      lines.push('')
      continue
    }
    const children = (b.children as { text: string; marks?: string[] }[]) || []
    const markDefs = (b.markDefs as { _key: string; href: string }[]) || []
    const text = children.map(c => {
      const linkMark = c.marks?.find(mk => markDefs.some(d => d._key === mk))
      if (linkMark) {
        const href = markDefs.find(d => d._key === linkMark)?.href || ''
        return `[${c.text}](${href})`
      }
      return c.marks?.includes('strong') ? `**${c.text}**` : c.text
    }).join('')
    const style = b.style as string
    const listItem = b.listItem as string | undefined
    if (listItem === 'bullet') lines.push(`- ${text}`)
    else if (listItem === 'number') lines.push(`1. ${text}`)
    else if (style === 'h2') { lines.push(''); lines.push(`## ${text}`) }
    else if (style === 'h3') { lines.push(''); lines.push(`### ${text}`) }
    else if (style === 'h4') { lines.push(''); lines.push(`#### ${text}`) }
    else if (style === 'blockquote') { lines.push(''); lines.push(`> ${text}`) }
    else { lines.push(''); lines.push(text) }
  }
  return lines.join('\n').trim()
}
