/**
 * Critério de relevância de pauta.
 *
 * O que os dados dizem hoje: 980 posts publicados, 4.990 impressões em três
 * meses, posição média 25. Isso é cerca de 5 impressões por post, e posição 25
 * é a terceira página da busca. O CTR de 0,7% é o esperado para a posição 25 —
 * ou seja, o problema não é o título, é não chegar perto do topo.
 *
 * A conclusão que orienta este arquivo: num domínio de três meses, disputar
 * notícia quente contra G1, InfoMoney e Exame é briga perdida — eles publicam
 * o mesmo fato em minutos e têm anos de autoridade. Das 980 publicações, 724
 * são notícia perecível. O que um site novo consegue ganhar é cauda longa
 * perene: a pergunta específica que ninguém respondeu direito.
 *
 * Daí os cinco fatores abaixo. Eles são explícitos de propósito: dá para
 * discutir e ajustar peso, o que não dava quando "relevância" era implícita.
 */

export type Candidata = {
  termo: string
  /** Impressões que o site já teve para este termo (Search Console). */
  impressoes?: number
  /** Posição média atual, quando o site já aparece. */
  posicao?: number
  /** Similaridade com o que já foi publicado (0 a 1), vinda do RAG. */
  jaCoberto?: number
  /** De onde a candidata veio. */
  origem: 'search-console' | 'busca-relacionada' | 'editor'
}

export type PautaPontuada = Candidata & {
  nota: number
  fatores: Record<string, number>
  porque: string
}

/** Termos que indicam pergunta prática — o formato que cauda longa premia. */
const MARCAS_DE_CAUDA_LONGA = [
  'como', 'quanto', 'vale a pena', 'qual', 'o que é', 'por que',
  'quando', 'onde', 'passo a passo', 'sem', 'com nome sujo', 'para iniciantes',
]

/** Assuntos com validade curta: perdem valor em dias. */
const MARCAS_PERECIVEIS = [
  'hoje', 'agora', 'ao vivo', 'ontem', 'nesta', 'nesta segunda', 'nesta terça',
  'nesta quarta', 'nesta quinta', 'nesta sexta', 'fecha', 'fechou', 'abre',
  'sobe', 'cai', 'anuncia', 'divulga', 'confirma',
]

function contem(termo: string, marcas: string[]): boolean {
  const t = termo.toLowerCase()
  return marcas.some(m => t.includes(m))
}

/**
 * 1. PROXIMIDADE — o fator de maior peso.
 *
 * Termo em que o site já está entre a 8ª e a 30ª posição é o melhor alvo que
 * existe: o Google já entendeu que o site responde àquilo, falta uma página
 * dedicada e melhor. Sair da 12ª para a 5ª rende muito mais tráfego do que
 * criar da estaca zero, onde a partida é da posição 80.
 */
function proximidade(posicao?: number): number {
  if (posicao == null) return 0.35            // termo novo: aposta neutra
  if (posicao <= 3) return 0.10               // já ganhou, mexer rende pouco
  if (posicao <= 7) return 0.55               // perto do topo, vale empurrar
  if (posicao <= 20) return 1.00              // zona de maior retorno
  if (posicao <= 40) return 0.70
  return 0.25                                 // longe demais para uma página só
}

/** 2. DEMANDA — impressões acumuladas, em escala log para não deixar um pico dominar. */
function demanda(impressoes?: number): number {
  if (!impressoes) return 0.2
  return Math.min(1, Math.log10(impressoes + 1) / 2.5)   // ~316 impressões satura
}

/**
 * 3. DURABILIDADE — separa o que rende por anos do que morre em dois dias.
 *
 * É o fator que responde à queixa de relevância baixa: o pipeline vinha
 * produzindo notícia perecível, que compete de frente com veículo grande e
 * some da busca na semana seguinte.
 */
function durabilidade(termo: string): number {
  if (contem(termo, MARCAS_PERECIVEIS)) return 0.15
  if (contem(termo, MARCAS_DE_CAUDA_LONGA)) return 1.0
  const palavras = termo.trim().split(/\s+/).length
  if (palavras >= 5) return 0.85              // cauda longa costuma ser perene
  if (palavras >= 3) return 0.6
  return 0.35                                 // termo curto e genérico: disputado demais
}

/**
 * 4. LACUNA — penaliza o que já foi coberto, a menos que a página existente
 * esteja indo mal. Evita publicar a décima variação do mesmo assunto, que foi
 * o que gerou os 12 grupos de duplicata.
 */
function lacuna(jaCoberto?: number, posicao?: number): number {
  if (jaCoberto == null) return 0.8
  if (jaCoberto < 0.6) return 1.0             // assunto novo
  // já existe página parecida: só vale se ela estiver mal posicionada
  if (posicao != null && posicao > 15) return 0.65
  return 0.15
}

/** 5. ENCAIXE — o termo pertence ao território do portal? */
const TERRITORIO = [
  'dívida', 'divida', 'investir', 'investimento', 'renda', 'juros', 'selic',
  'cdi', 'tesouro', 'poupança', 'poupanca', 'cartão', 'cartao', 'crédito',
  'credito', 'empréstimo', 'emprestimo', 'financiamento', 'imposto', 'ir ',
  'aposentadoria', 'previdência', 'previdencia', 'economizar', 'dinheiro',
  'salário', 'salario', 'fgts', 'pix', 'banco', 'score', 'nome sujo',
  'orçamento', 'orcamento', 'reserva', 'ações', 'acoes', 'fundo', 'cdb',
]
function encaixe(termo: string): number {
  return contem(termo, TERRITORIO) ? 1.0 : 0.3
}

const PESOS = {
  proximidade: 0.32,
  demanda: 0.22,
  durabilidade: 0.24,
  lacuna: 0.14,
  encaixe: 0.08,
}

export function pontuar(c: Candidata): PautaPontuada {
  const fatores = {
    proximidade: proximidade(c.posicao),
    demanda: demanda(c.impressoes),
    durabilidade: durabilidade(c.termo),
    lacuna: lacuna(c.jaCoberto, c.posicao),
    encaixe: encaixe(c.termo),
  }
  const nota = Object.entries(PESOS)
    .reduce((s, [k, p]) => s + fatores[k as keyof typeof fatores] * p, 0)

  return { ...c, nota: Math.round(nota * 100), fatores, porque: explicar(c, fatores) }
}

/** Frase curta que justifica a nota, para o editor decidir sem abrir planilha. */
function explicar(c: Candidata, f: Record<string, number>): string {
  const partes: string[] = []
  if (c.posicao != null && c.posicao > 7 && c.posicao <= 20) {
    partes.push(`já aparece na ${Math.round(c.posicao)}ª posição, perto de virar página 1`)
  } else if (c.posicao != null && c.posicao <= 7) {
    partes.push(`já está na ${Math.round(c.posicao)}ª posição`)
  } else if (c.posicao != null) {
    partes.push(`hoje na ${Math.round(c.posicao)}ª posição`)
  }
  if (c.impressoes) partes.push(`${c.impressoes} impressões em 90 dias`)
  if (f.durabilidade >= 0.85) partes.push('assunto perene')
  else if (f.durabilidade <= 0.2) partes.push('assunto perecível')
  if (f.lacuna <= 0.2) partes.push('já há página parecida')
  return partes.join(' · ') || 'termo novo no território do portal'
}

export function ranquear(cs: Candidata[], top = 8): PautaPontuada[] {
  const vistos = new Set<string>()
  return cs
    .map(pontuar)
    .filter(p => {
      const k = p.termo.toLowerCase().trim()
      if (vistos.has(k)) return false
      vistos.add(k)
      return true
    })
    .sort((a, b) => b.nota - a.nota)
    .slice(0, top)
}
