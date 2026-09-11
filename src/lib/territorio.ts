/**
 * Filtro de território editorial.
 *
 * Os feeds do cron de notícia são de economia, não de finanças pessoais, e a
 * diferença aparecia direto no que saía publicado: Bombardier, Sigma Lithium,
 * Opep+, iene, ilha de bilionário. É notícia legítima e completamente fora do
 * que este site tem chance de responder — e são páginas assim que fizeram 55%
 * do acervo nunca aparecer em busca alguma.
 *
 * A regra tem três partes. Cobertura de empresa e de mercado externo é vetada
 * de saída. Passa o que tem gancho com algo que o leitor tem, paga ou recebe.
 * E mudança de regra (Banco Central, CVM, "entra em vigor") só conta quando o
 * texto diz o que muda para ele — sem essa exigência o gancho aprovava desde
 * suspensão de carne na UE até qualquer portaria.
 *
 * Mora fora da rota de propósito: é a regra que decide o que o site publica, e
 * regra assim precisa ser testável sem subir o Next inteiro.
 * Ver scripts/testar-territorio.mjs.
 */
export type ItemDeFeed = { title: string; description: string }

/** Algo que o leitor tem, paga ou recebe. Um destes basta. */
export const GANCHOS = [
  /\bselic\b|\bcopom\b|taxa b(á|a)sica|taxa de juros|juros compostos|juros do (cart|cheque|rotativo)/i,
  /imposto de renda|\birpf\b|declara(ç|c)(ã|a)o de imposto|restitui(ç|c)(ã|a)o|\bleão\b/i,
  /\bfgts\b|\binss\b|aposentadoria|previd(ê|e)ncia|\bbpc\b|abono salarial|\bpis\b|\bpasep\b/i,
  /\bpix\b|poupan(ç|c)a|tesouro direto|tesouro ipca|\bcdb\b|renda fixa|\blci\b|\blca\b/i,
  /\bfii\b|fundos? imobili(á|a)ri|\betf\b|carteira de investimento/i,
  /sal(á|a)rio m(í|i)nimo|bolsa fam(í|i)lia|aux(í|i)lio|p(é|e)-de-meia|vale-(refei(ç|c)(ã|a)o|alimenta(ç|c)(ã|a)o)/i,
  /cart(ã|a)o de cr(é|e)dito|rotativo|anuidade|fatura|\bcdc\b|consignado|empr(é|e)stimo|cr(é|e)dito pessoal/i,
  /financiamento (imobili(á|a)rio|de ve(í|i)culo)|casa pr(ó|o)pria|\bsfh\b|\bsfi\b|cons(ó|o)rcio/i,
  /conta de luz|bandeira tarif(á|a)ria|tarifa de (á|a)gua|g(á|a)s de cozinha|\biptu\b|\bipva\b|licenciamento/i,
  /\bipca\b|infla(ç|c)(ã|a)o|cesta b(á|a)sica|pre(ç|c)o (dos|de) alimento/i,
  /score de cr(é|e)dito|serasa|nome sujo|negativado|superendividamento|renegocia(ç|c)(ã|a)o de d(í|i)vida/i,
  /golpe (do|da|no)|fraude banc(á|a)ria|clonagem de cart(ã|a)o/i,
]

/** Fora do alcance: cobertura de empresa e de mercado externo. */
export const FORA = [
  // Empresa: fusão, resultado, executivo, ação isolada. O leitor não decide nada.
  /fus(ã|a)o|aquisi(ç|c)(ã|a)o|\bopa\b|balan(ç|c)o (do|da|de)|lucro l(í|i)quido|receita l(í|i)quida/i,
  /\bceo\b|presidente d[ao] conselho|renuncia|assume o comando|conselho de administra(ç|c)(ã|a)o/i,
  // Commodity e macro externo.
  /petr(ó|o)leo|\bopep\b|min(é|e)rio de ferro|celulose|alum(í|i)nio|l(í|i)tio|soja|milho|frango|carne/i,
  /\bfed\b|federal reserve|\bbce\b|banco central europeu|\bpib\b (dos|da) (eua|china|zona)/i,
  /\biene\b|libra esterlina|wall street|nasdaq|s&p 500|d(í|i)vida dos eua/i,
  /trump|biden|elei(ç|c)(ã|a)o (nos|dos) eua|guerra|conflito|oriente m(é|e)dio/i,
  /bilion(á|a)rio|fortuna de|patrim(ô|o)nio de|lista da forbes/i,
]

/** Mudança de regra. Sozinha não basta — precisa dizer o que muda para quem lê. */
const REGULATORIO = /banco central|\bcvm\b|\bcmn\b|nova regra|passa a valer|entra em vigor|sancionad[ao]/i

/** Objeto concreto do leitor, exigido junto do regulatório. */
const OBJETO_DO_LEITOR = /corretora|investidor|poupan(ç|c)a|conta banc(á|a)ria|cart(ã|a)o|empr(é|e)stimo|financiamento|aposentadoria|\bfgts\b|\binss\b|\bpix\b|sal(á|a)rio|consumidor/i

export function noTerritorio(n: ItemDeFeed): boolean {
  const txt = `${n.title} ${n.description}`
  if (FORA.some(re => re.test(txt))) return false
  if (GANCHOS.some(re => re.test(txt))) return true
  return REGULATORIO.test(txt) && OBJETO_DO_LEITOR.test(txt)
}
