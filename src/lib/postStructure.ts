// Extrai estrutura do corpo (PortableText) para índice (TOC) e FAQ schema

type Block = {
  _type?: string
  style?: string
  children?: { text?: string }[]
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function blockText(b: Block): string {
  return (b.children || []).map(c => c.text || '').join('')
}

// Títulos H2 para o índice navegável
export function extractHeadings(body: Block[]): { text: string; id: string }[] {
  if (!body) return []
  return body
    .filter(b => b._type === 'block' && b.style === 'h2')
    .map(b => {
      const text = blockText(b)
      return { text, id: slugifyHeading(text) }
    })
    .filter(h => h.text.trim())
}

// Pergunta (h4) + resposta (próximo bloco normal) para FAQ schema
export function extractFaqs(body: Block[]): { q: string; a: string }[] {
  if (!body) return []
  const faqs: { q: string; a: string }[] = []
  for (let i = 0; i < body.length; i++) {
    const b = body[i]
    if (b._type === 'block' && b.style === 'h4') {
      const q = blockText(b).trim()
      // próxima resposta = primeiro bloco normal com texto
      let a = ''
      for (let j = i + 1; j < body.length; j++) {
        const nb = body[j]
        if (nb._type === 'block' && nb.style === 'normal') { a = blockText(nb).trim(); break }
        if (nb._type === 'block' && (nb.style === 'h2' || nb.style === 'h3' || nb.style === 'h4')) break
      }
      if (q && a) faqs.push({ q, a })
    }
  }
  return faqs
}
