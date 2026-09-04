/**
 * Posts quase iguais gerados em duplicidade pelo pipeline.
 *
 * A trava de similaridade comparava o titulo novo com getRecentTitles(20), ou
 * seja, os 20 ultimos posts. No ritmo de ate 18 posts/dia isso cobria pouco
 * mais de um dia, entao o mesmo tema reaparecia dias depois e passava batido —
 * daí os slugs terminados em -2 e -3. A janela virou temporal em
 * getRecentTitlesSince(), o que impede novos casos; este mapa cuida dos 14 que
 * ja estao publicados.
 *
 * Cada chave e o slug duplicado; o valor e o slug que fica como versao boa
 * (a mais longa de cada grupo). O duplicado continua acessivel, mas aponta
 * canonical pro escolhido e sai do sitemap, para o Google consolidar o sinal
 * num endereco so em vez de ver conteudo repetido.
 */
export const DUPLICATE_CANONICAL: Record<string, string> = {
  'poupanca-morta-onde-dinheiro-rende-verdade-2026': 'poupanca-morta-onde-dinheiro-rende-2026',
  'poupanca-morta-onde-dinheiro-rende-verdade-2026-2': 'poupanca-morta-onde-dinheiro-rende-2026',
  'cdb-lci-tesouro-direto-qual-rende-mais': 'tesouro-direto-vs-cdb-qual-rende-mais-2',
  'tesouro-direto-vs-cdb-qual-rende-mais-3': 'tesouro-direto-vs-cdb-qual-rende-mais-2',
  'imobiliaria-digital-ganhar-aluguel-sem-ser-dono-2': 'imobiliaria-digital-ganhar-aluguel-sem-ser-dono',
  'produtores-agro-buscam-novos-mercados-apos-tarifa-trump': 'agro-troca-eua-novos-mercados-tarifa-trump',
  'aulas-particulares-online-plataformas-preco-como-atrair-alunos': 'aulas-particulares-online-ganhar-dinheiro',
  'gestoras-fogem-kit-brasil-dolár-copom': 'gestoras-fogem-kit-brasil-correm-dolar-antes-copom',
  'dividendos-quanto-investir-mil-reais-mes': 'renda-dividendos-quanto-investir-mil-reais-mes',
  'renda-imovel-modelos-comparacao-2026': 'renda-imovel-2026-aluguel-temporada-airbnb',
  'inflacao-renda-fixa-nao-basta-comece-investir': 'inflacao-renda-fixa-nao-basta-comece-investir-2',
  'lci-lca-rendimento-real-inflacao': 'lci-lca-rendimento-real-inflacao-2',
  'calculadora-rendimento-real-inflacao-2': 'calculadora-rendimento-real-inflacao',
  'gol-compra-jatos-embraer-estrategia': 'gol-compra-jatos-embraer-1-8-bilhoes',
}

/** Slug canonico de um post: ele mesmo, ou o escolhido quando e duplicata. */
export function canonicalSlug(slug: string): string {
  return DUPLICATE_CANONICAL[slug] ?? slug
}

export function isDuplicate(slug: string): boolean {
  return slug in DUPLICATE_CANONICAL
}
