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
  /** Posição na lista do autocomplete: 0 é a mais buscada. */
  posicaoNaLista?: number
  /** Base que gerou o termo, quando veio do autocomplete. */
  base?: string
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
  // Antes isto caía para 0.25 e descartava o caso mais importante que os dados
  // mostraram: 'juros compostos' na 89ª, 'o que são ações' na 85ª, 'fundo de
  // emergência' na 77ª. São os temas centrais do portal, com página publicada,
  // enterrados na página 8. Não é pauta nova — é página existente que precisa
  // ser refeita, e ignorá-las era jogar fora o sinal mais útil do relatório.
  return 0.60
}

/** 2. DEMANDA — impressões acumuladas, em escala log para não deixar um pico dominar. */
function demanda(impressoes?: number, posicaoNaLista?: number): number {
  if (impressoes) return Math.min(1, Math.log10(impressoes + 1) / 2.5)  // ~316 satura
  // Sem impressão (termo que o site ainda não alcança), a posição na lista do
  // autocomplete é o sinal disponível: o Google ordena por volume de busca.
  if (posicaoNaLista != null) return Math.max(0.25, 1 - posicaoNaLista * 0.08)
  return 0.2
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
/**
 * Assuntos que vetam a pauta mesmo quando ela cita uma palavra do território.
 *
 * Veio da simulação com os dados reais: 'quanto dinheiro a copa do mundo
 * movimenta' tirou nota 92 e liderou a lista, porque contém "dinheiro". O site
 * está na 10ª posição para isso, então proximidade e demanda o empurraram ao
 * topo — e a primeira sugestão do sistema teria sido escrever sobre a Copa.
 * 'dieta marketing ganhar dinheiro online' passou pelo mesmo buraco.
 */
const VETADOS = [
  'copa do mundo', 'futebol', 'seleção', 'selecao', 'olimpíada', 'olimpiada',
  'bbb', 'novela', 'celebridade', 'famoso', 'signo', 'horóscopo', 'horoscopo',
  'afiliado', 'afiliados', 'associado amazon', 'marketplace', 'dropshipping',
  'marketing digital', 'dieta', 'emagrec', 'apostas', 'bet', 'jogo do tigrin',
]

/**
 * Palavras genéricas demais para qualificar sozinhas. 'dinheiro' aparece em
 * qualquer assunto; só conta como território quando acompanhada de um termo
 * de fato financeiro.
 */
const FRACAS = ['dinheiro', 'renda', 'banco', 'fundo', 'reserva']

function noTerritorio(termo: string): boolean {
  if (contem(termo, VETADOS)) return false
  if (!contem(termo, TERRITORIO)) return false
  // Se o único sinal for uma palavra fraca, exige um segundo sinal.
  const t = termo.toLowerCase()
  const fortes = TERRITORIO.filter(x => !FRACAS.includes(x))
  return fortes.some(x => t.includes(x)) || FRACAS.filter(x => t.includes(x)).length >= 2
}

const PESOS = {
  proximidade: 0.30,
  demanda: 0.22,
  durabilidade: 0.28,
  lacuna: 0.20,
}

/**
 * Encaixe deixou de ser um fator de 8% e virou eliminatório.
 *
 * Motivo, nos dados reais do Search Console: das 688 consultas em que o site
 * aparece, só 218 são de finanças. E as poucas que rankeiam bem são acidentais
 * — 'sam altman' na 1ª, 'bauducco mondelez' na 6ª, 'randon opa' na 9ª, 'copa do
 * mundo' na 10ª. Como proximidade é o fator de maior peso, essas subiriam ao
 * topo da lista de pautas e o cron sugeriria escrever sobre a Copa.
 *
 * Fora do território, a pauta nem entra na disputa.
 */

export function pontuar(c: Candidata): PautaPontuada {
  const fatores = {
    proximidade: proximidade(c.posicao),
    demanda: demanda(c.impressoes, c.posicaoNaLista),
    durabilidade: durabilidade(c.termo),
    lacuna: lacuna(c.jaCoberto, c.posicao),
  }
  if (!noTerritorio(c.termo)) {
    return { ...c, nota: 0, fatores, porque: 'fora do território de finanças' }
  }
  const nota = Object.entries(PESOS)
    .reduce((s, [k, p]) => s + fatores[k as keyof typeof fatores] * p, 0)

  return { ...c, nota: Math.round(nota * 100), fatores, porque: explicar(c, fatores) }
}

/** Frase curta que justifica a nota, para o editor decidir sem abrir planilha. */
function explicar(c: Candidata, f: Record<string, number>): string {
  const partes: string[] = []
  if (c.posicao != null && c.posicao > 7 && c.posicao <= 20) {
    partes.push(`já aparece na ${Math.round(c.posicao)}ª, perto de virar página 1`)
  } else if (c.posicao != null && c.posicao <= 7) {
    partes.push(`já está na ${Math.round(c.posicao)}ª posição`)
  } else if (c.posicao != null && c.posicao > 40) {
    partes.push(`REFORÇAR: tema central enterrado na ${Math.round(c.posicao)}ª posição`)
  } else if (c.posicao != null) {
    partes.push(`hoje na ${Math.round(c.posicao)}ª posição`)
  }
  if (c.impressoes) partes.push(`${c.impressoes} impressões em 90 dias`)
  if (f.durabilidade >= 0.85) partes.push('assunto perene')
  else if (f.durabilidade <= 0.2) partes.push('assunto perecível')
  if (f.lacuna <= 0.2) partes.push('já há página parecida')
  return partes.join(' · ') || 'termo novo no território do portal'
}

/**
 * Tema de um termo: as duas primeiras palavras longas, em ordem.
 * "como sair das dívidas com agiota" e "como sair das dívidas rápido" caem no
 * mesmo tema, e é isso que permite limitar quantas variações da mesma ideia
 * ocupam a lista.
 */
/**
 * Tema de uma candidata, para limitar variações da mesma ideia por rodada.
 *
 * Quando o termo veio do autocomplete, a base que o gerou é a resposta exata —
 * não há por que adivinhar. Tentei duas heurísticas de texto antes e as duas
 * falharam: as palavras mais longas ordenadas separavam "dívidas altas" de
 * "dívidas e investir", e as três primeiras palavras não agrupavam quando a
 * base tinha só duas ("como investir" rendia cinco temas distintos).
 */
function tema(c: Candidata): string {
  if (c.base) return c.base.toLowerCase()
  return c.termo.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(Boolean).slice(0, 3).join(' ')
}

/** Quantas variações do mesmo tema cabem numa rodada. */
const POR_TEMA = 2

export function ranquear(cs: Candidata[], top = 8): PautaPontuada[] {
  const vistos = new Set<string>()
  return cs
    .map(pontuar)
    .filter(p => {
      // Assinatura sem acento, sem palavra curta e com ordem normalizada: assim
      // 'juros compostos o que é' e 'o que são juros compostos' contam como uma
      // pauta só, em vez de ocuparem duas vagas das oito com o mesmo assunto.
      const k = p.termo
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .sort()
        .join(' ')
      if (vistos.has(k)) return false
      vistos.add(k)
      return true
    })
    .sort((a, b) => b.nota - a.nota)
    // Diversidade por tema. Sem isto, uma base como "como sair das dívidas"
    // rendia dez variações com nota idêntica e tomava a lista inteira — que é
    // a mesma sensação de repetição, só que dentro de uma rodada só.
    .reduce<PautaPontuada[]>((acc, p) => {
      if (acc.length >= top) return acc
      const t = tema(p)
      if (acc.filter(x => tema(x) === t).length >= POR_TEMA) return acc
      acc.push(p)
      return acc
    }, [])
}
