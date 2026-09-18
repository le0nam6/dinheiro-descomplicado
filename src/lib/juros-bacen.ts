/**
 * Painel de juros ao consumidor, direto do Banco Central.
 *
 * Por que existe: o site precisa de um ativo que alguém tenha motivo para
 * citar. Texto opinativo ninguém linka; número com metodologia declarada, sim.
 * O BACEN publica semanalmente a taxa que cada instituição cobra em cada
 * modalidade de crédito — dado público, verificável, e que quase ninguém
 * apresenta de forma legível.
 *
 * O que é nosso aqui não é o número: é o recorte (as modalidades que importam
 * para pessoa física), a estatística robusta (mediana, não média, porque os
 * extremos são instituições minúsculas) e a tradução para reais.
 *
 * Fonte: olinda.bcb.gov.br — serviço público, sem autenticação.
 */

const BASE = 'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo'

/** As modalidades de pessoa física que mudam a vida de quem lê, com rótulo curto. */
const MODALIDADES: { oficial: string; curto: string; explica: string }[] = [
  { oficial: 'Cartão de crédito - rotativo total - Prefixado', curto: 'Rotativo do cartão',
    explica: 'O que incide quando você paga menos que a fatura inteira.' },
  { oficial: 'Cartão de crédito - parcelado - Prefixado', curto: 'Parcelamento da fatura',
    explica: 'Quando você aceita parcelar a fatura que não conseguiu pagar.' },
  { oficial: 'Cheque especial - Prefixado', curto: 'Cheque especial',
    explica: 'O limite que entra sozinho quando a conta fica negativa.' },
  { oficial: 'Crédito pessoal não consignado - Prefixado', curto: 'Empréstimo pessoal',
    explica: 'Empréstimo sem garantia e sem desconto em folha.' },
  { oficial: 'Crédito pessoal consignado INSS - Prefixado', curto: 'Consignado do INSS',
    explica: 'Desconto direto no benefício, por isso as taxas mais baixas.' },
  { oficial: 'Aquisição de veículos - Prefixado', curto: 'Financiamento de veículo',
    explica: 'O carro fica como garantia, o que segura a taxa.' },
]

export type TaxaBanco = { banco: string; aoAno: number; aoMes: number }

export type ModalidadeJuros = {
  curto: string
  oficial: string
  explica: string
  bancos: number
  mediana: number
  menor: TaxaBanco
  maior: TaxaBanco
  maisBaratos: TaxaBanco[]
  maisCaros: TaxaBanco[]
  /** Juros sobre R$ 1.000 em 12 meses, na menor e na maior taxa. */
  custoMenor: number
  custoMaior: number
  diferenca: number
}

export type PainelJuros = {
  inicio: string
  fim: string
  modalidades: ModalidadeJuros[]
}

type Linha = {
  InicioPeriodo: string
  FimPeriodo: string
  Modalidade: string
  InstituicaoFinanceira: string
  TaxaJurosAoMes: number | null
  TaxaJurosAoAno: number | null
}

function mediana(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Juros pagos sobre R$ 1.000 em 12 meses, à taxa efetiva anual informada. */
function custoAnual(aoAno: number): number {
  return 1000 * (aoAno / 100)
}

export async function painelDeJuros(): Promise<PainelJuros | null> {
  // Montado à mão de propósito: URLSearchParams codifica espaço como '+', e o
  // OData do BACEN devolve 400 quando o '+' aparece dentro do $filter. Tem que
  // ser %20, que é o que encodeURIComponent faz.
  const params = [
    ['$filter', "Segmento eq 'PESSOA FÍSICA'"],
    ['$orderby', 'InicioPeriodo desc'],
    ['$top', '3000'],
    ['$select', 'InicioPeriodo,FimPeriodo,Modalidade,InstituicaoFinanceira,TaxaJurosAoMes,TaxaJurosAoAno'],
    ['$format', 'json'],
  ].map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')

  let linhas: Linha[]
  try {
    const r = await fetch(`${BASE}?${params}`, {
      signal: AbortSignal.timeout(25_000),
      next: { revalidate: 21_600 },
    })
    if (!r.ok) return null
    linhas = ((await r.json()) as { value?: Linha[] }).value ?? []
  } catch {
    return null
  }
  if (!linhas.length) return null

  // A consulta vem ordenada do mais recente para o mais antigo; a primeira
  // linha define a semana publicada.
  const inicio = linhas[0].InicioPeriodo
  const semana = linhas.filter(l => l.InicioPeriodo === inicio)

  const modalidades: ModalidadeJuros[] = []
  for (const m of MODALIDADES) {
    const taxas = semana
      .filter(l => l.Modalidade === m.oficial && typeof l.TaxaJurosAoAno === 'number' && l.TaxaJurosAoAno > 0)
      .map(l => ({
        banco: l.InstituicaoFinanceira,
        aoAno: l.TaxaJurosAoAno as number,
        aoMes: (l.TaxaJurosAoMes ?? 0) as number,
      }))
      .sort((a, b) => a.aoAno - b.aoAno)

    // Menos de cinco instituições não sustenta mediana nem ranking.
    if (taxas.length < 5) continue

    const menor = taxas[0]
    const maior = taxas[taxas.length - 1]
    modalidades.push({
      curto: m.curto,
      oficial: m.oficial,
      explica: m.explica,
      bancos: taxas.length,
      mediana: mediana(taxas.map(t => t.aoAno)),
      menor,
      maior,
      maisBaratos: taxas.slice(0, 5),
      maisCaros: taxas.slice(-5).reverse(),
      custoMenor: custoAnual(menor.aoAno),
      custoMaior: custoAnual(maior.aoAno),
      diferenca: custoAnual(maior.aoAno) - custoAnual(menor.aoAno),
    })
  }

  if (!modalidades.length) return null
  return { inicio, fim: semana[0].FimPeriodo, modalidades }
}

/** 27/08/2026 a partir de 2026-08-27. */
export function dataBr(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function reais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function pct(v: number): string {
  return `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
