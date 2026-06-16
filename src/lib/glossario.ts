export type GlossarioTerm = {
  slug: string
  name: string
  shortDef: string
  body: string[]       // parágrafos
  faqs: { q: string; a: string }[]
  related: string[]    // slugs de termos relacionados
}

export const terms: GlossarioTerm[] = [
  {
    slug: 'selic',
    name: 'Taxa Selic',
    shortDef: 'Taxa básica de juros da economia brasileira, definida pelo Banco Central a cada 45 dias.',
    body: [
      'A Selic (Sistema Especial de Liquidação e de Custódia) é a taxa de juros básica do Brasil. O Comitê de Política Monetária (Copom) do Banco Central se reúne a cada 45 dias para defini-la.',
      'Ela serve de referência para praticamente tudo: empréstimos, financiamentos e a maioria dos investimentos de renda fixa. Quando a Selic sobe, crédito fica mais caro e investimentos conservadores rendem mais. Quando cai, acontece o inverso.',
      'Investimentos atrelados à Selic — como Tesouro Selic e fundos DI — seguem automaticamente qualquer mudança. É por isso que acompanhar a Selic é essencial para qualquer decisão financeira.',
    ],
    faqs: [
      { q: 'O que é a taxa Selic?', a: 'A Selic é a taxa básica de juros da economia brasileira, definida pelo Copom (Banco Central) a cada 45 dias. Ela serve de referência para empréstimos, financiamentos e investimentos de renda fixa.' },
      { q: 'Como a Selic afeta meus investimentos?', a: 'Investimentos como Tesouro Selic, CDBs e fundos DI rendem próximo à Selic. Quando a taxa sobe, esses investimentos rendem mais; quando cai, rendem menos.' },
      { q: 'Qual é a diferença entre Selic e CDI?', a: 'São taxas quase idênticas na prática. A Selic é definida pelo Banco Central e regula o mercado interbancário de títulos públicos. O CDI é calculado pela B3 para empréstimos entre bancos e costuma ficar 0,1 p.p. abaixo da Selic.' },
    ],
    related: ['cdi', 'tesouro-direto', 'rentabilidade-liquida'],
  },
  {
    slug: 'cdi',
    name: 'CDI',
    shortDef: 'Taxa de empréstimos entre bancos, calculada diariamente pela B3. Principal referência da renda fixa.',
    body: [
      'O CDI (Certificado de Depósito Interbancário) é a taxa que os bancos cobram uns dos outros em empréstimos de curtíssimo prazo — geralmente de um dia. A B3 calcula e divulga esse índice diariamente.',
      'Na prática, o CDI fica muito próximo da Selic (cerca de 0,1 p.p. abaixo). Ele é o benchmark mais usado da renda fixa brasileira: CDBs, LCIs, LCAs e fundos de renda fixa geralmente divulgam seu rendimento como "% do CDI".',
      'Quando você vê um CDB pagando "110% do CDI", significa que vai render 10% a mais que a taxa CDI. Entender o CDI é fundamental para comparar investimentos de renda fixa corretamente.',
    ],
    faqs: [
      { q: 'O que é CDI?', a: 'CDI (Certificado de Depósito Interbancário) é a taxa de juros cobrada em empréstimos entre bancos no Brasil. É calculada diariamente pela B3 e serve de referência para a maioria dos investimentos de renda fixa.' },
      { q: 'CDI e Selic são a mesma coisa?', a: 'Não, mas são muito próximas. A Selic é definida pelo Banco Central. O CDI é calculado pela B3 e fica em torno de 0,1 p.p. abaixo da Selic. Para fins práticos de comparação de investimentos, as duas costumam ser usadas de forma intercambiável.' },
      { q: '100% do CDI é um bom investimento?', a: '100% do CDI é a rentabilidade de referência da renda fixa. Um investimento que paga exatamente 100% do CDI é equivalente ao benchmark do mercado. Investimentos acima de 100% do CDI estão superando a referência; abaixo, ficam aquém.' },
    ],
    related: ['selic', 'lci-lca', 'rentabilidade-liquida'],
  },
  {
    slug: 'juros-compostos',
    name: 'Juros Compostos',
    shortDef: 'Juros calculados sobre o capital mais os juros já acumulados — o efeito "juros sobre juros".',
    body: [
      'Nos juros compostos, o rendimento de cada período é incorporado ao capital e passa a render também no período seguinte. É o oposto dos juros simples, onde o rendimento é sempre calculado sobre o valor original.',
      'Exemplo: R$1.000 a 1% ao mês. Com juros simples, em 12 meses você teria R$1.120. Com juros compostos, R$1.126,83. A diferença parece pequena no curto prazo — mas em 10 anos a distância é enorme.',
      'O mesmo efeito que faz investimentos crescerem exponencialmente é o que torna dívidas de cartão de crédito e cheque especial devastadoras. Juros compostos trabalham a favor de quem investe e contra quem está endividado.',
    ],
    faqs: [
      { q: 'O que são juros compostos?', a: 'Juros compostos são calculados sobre o capital inicial somado aos juros já acumulados em períodos anteriores. Isso cria um crescimento exponencial — diferente dos juros simples, que incidem sempre sobre o valor original.' },
      { q: 'Qual a fórmula dos juros compostos?', a: 'M = C × (1 + i)^t, onde M é o montante final, C é o capital inicial, i é a taxa de juros por período e t é o número de períodos.' },
      { q: 'Por que os juros compostos são chamados de "oitava maravilha do mundo"?', a: 'A frase é atribuída a Albert Einstein e reflete o poder do crescimento exponencial: pequenas taxas aplicadas por longos períodos geram resultados surpreendentes. Investir cedo é mais eficiente do que investir mais tarde com valores maiores.' },
    ],
    related: ['selic', 'tesouro-direto', 'rentabilidade-liquida'],
  },
  {
    slug: 'tesouro-direto',
    name: 'Tesouro Direto',
    shortDef: 'Programa do governo federal que permite comprar títulos públicos pela internet a partir de R$30.',
    body: [
      'Criado em 2002, o Tesouro Direto é o programa do Tesouro Nacional que democratizou o acesso a títulos da dívida pública federal. Qualquer pessoa física pode investir a partir de R$30 por uma corretora.',
      'São três tipos principais: Tesouro Selic (rende próximo à Selic, liquidez diária, ideal para reserva de emergência), Tesouro IPCA+ (rende inflação + taxa prefixada, protege o poder de compra) e Tesouro Prefixado (taxa garantida na compra, independente do que acontecer com os juros).',
      'É considerado o investimento mais seguro do Brasil — o risco é do governo federal, que pode imprimir dinheiro para honrar dívidas. A taxa de custódia da B3 é de 0,2% ao ano sobre os títulos com valor acima de R$10.000.',
    ],
    faqs: [
      { q: 'O que é Tesouro Direto?', a: 'Tesouro Direto é o programa do Tesouro Nacional que permite que pessoas físicas comprem títulos da dívida pública federal pela internet. É o investimento mais seguro do Brasil, com aporte mínimo a partir de R$30.' },
      { q: 'Qual Tesouro Direto escolher?', a: 'Depende do objetivo: Tesouro Selic para reserva de emergência (liquidez diária, sem risco de perda); Tesouro IPCA+ para proteção contra inflação no longo prazo; Tesouro Prefixado quando você quer garantir uma taxa independente do cenário futuro.' },
      { q: 'Tesouro Direto tem Imposto de Renda?', a: 'Sim. A alíquota de IR é regressiva: 22,5% até 180 dias, 20% de 181 a 360 dias, 17,5% de 361 a 720 dias, e 15% acima de 720 dias. O IR é recolhido automaticamente na saída.' },
    ],
    related: ['selic', 'cdi', 'rentabilidade-liquida'],
  },
  {
    slug: 'lci-lca',
    name: 'LCI e LCA',
    shortDef: 'Letras de Crédito Imobiliário e do Agronegócio — investimentos isentos de Imposto de Renda para pessoa física.',
    body: [
      'LCI (Letra de Crédito Imobiliário) e LCA (Letra de Crédito do Agronegócio) são títulos emitidos por bancos para captar recursos para financiar esses dois setores. Para o investidor pessoa física, o grande diferencial é a isenção total de Imposto de Renda.',
      'Isso muda completamente a comparação com outros investimentos. Uma LCA que paga 90% do CDI pode ser mais rentável que um CDB de 105% do CDI — porque o CDB vai ter IR descontado (15% a 22,5%, dependendo do prazo), enquanto a LCA entrega o valor bruto diretamente.',
      'O prazo mínimo costuma ser de 90 dias (LCI) ou 90 a 180 dias (LCA). Ambas são garantidas pelo FGC até R$250.000 por CPF por instituição, assim como CDBs e poupança.',
    ],
    faqs: [
      { q: 'O que é LCI e LCA?', a: 'LCI (Letra de Crédito Imobiliário) e LCA (Letra de Crédito do Agronegócio) são investimentos de renda fixa emitidos por bancos, isentos de Imposto de Renda para pessoa física. O banco usa o dinheiro captado para financiar esses setores específicos.' },
      { q: 'LCI e LCA são seguros?', a: 'Sim. São garantidos pelo FGC (Fundo Garantidor de Créditos) até R$250.000 por CPF por instituição financeira — o mesmo limite da poupança e dos CDBs.' },
      { q: 'Como comparar LCI/LCA com CDB?', a: 'Para comparar, calcule a rentabilidade líquida do CDB descontando o IR. Fórmula simples: taxa bruta × (1 - alíquota IR). Ex: CDB a 110% CDI com IR de 15% = 93,5% CDI líquido. Se a LCI pagar acima de 93,5% CDI, ela é mais rentável.' },
    ],
    related: ['cdi', 'rentabilidade-liquida', 'tesouro-direto'],
  },
  {
    slug: 'score-de-credito',
    name: 'Score de Crédito',
    shortDef: 'Pontuação de 0 a 1.000 que mede a probabilidade de você pagar dívidas em dia.',
    body: [
      'O score de crédito é calculado por birôs como Serasa e Boa Vista com base no histórico financeiro da pessoa: pagamentos em dia, tempo de relacionamento com credores, uso do crédito disponível, presença no Cadastro Positivo e dados públicos de inadimplência.',
      'Pontuações acima de 700 costumam resultar em aprovação mais fácil de crédito e taxas de juros menores. Abaixo de 300, o acesso ao crédito fica muito restrito. A faixa entre 300 e 700 varia bastante conforme a instituição.',
      'O score sobe com consistência: pagar contas no vencimento, manter o CPF limpo, ter contas abertas há bastante tempo e não utilizar mais de 30% do limite disponível são os fatores com maior impacto positivo.',
    ],
    faqs: [
      { q: 'O que é score de crédito?', a: 'Score de crédito é uma pontuação de 0 a 1.000 (no Serasa) que mede a probabilidade de uma pessoa pagar suas dívidas em dia. Bancos e financeiras usam essa pontuação para decidir se concedem crédito e em quais condições.' },
      { q: 'Como aumentar o score de crédito?', a: 'As ações mais eficazes são: pagar todas as contas no vencimento, limpar o nome se estiver negativado, manter o Cadastro Positivo ativo, não utilizar mais de 30% do limite do cartão e evitar solicitar muito crédito ao mesmo tempo.' },
      { q: 'Score alto garante aprovação de crédito?', a: 'Não garante, mas aumenta muito as chances. Cada banco usa seus próprios critérios além do score — renda comprovada, comprometimento do salário, tempo de emprego e histórico com a própria instituição são fatores complementares.' },
    ],
    related: ['fgts', 'pgbl-vgbl'],
  },
  {
    slug: 'pgbl-vgbl',
    name: 'PGBL e VGBL',
    shortDef: 'Modalidades de previdência privada com diferenças no tratamento do Imposto de Renda.',
    body: [
      'PGBL (Plano Gerador de Benefício Livre) e VGBL (Vida Gerador de Benefício Livre) são as duas modalidades de previdência privada aberta no Brasil. A diferença central está na tributação.',
      'No PGBL, as contribuições podem ser deduzidas da base de cálculo do IR na declaração completa — até 12% da renda bruta anual. Mas na saída (resgate ou aposentadoria), o IR incide sobre o valor total acumulado, incluindo o capital investido.',
      'No VGBL, não há dedução na entrada. Porém, na saída o IR incide apenas sobre os rendimentos, não sobre o capital investido. Regra prática: PGBL para quem faz declaração completa e tem mais de 12% da renda para investir em previdência; VGBL para os demais casos.',
    ],
    faqs: [
      { q: 'Qual a diferença entre PGBL e VGBL?', a: 'A diferença é tributária. O PGBL permite deduzir até 12% da renda bruta no IR (declaração completa), mas na saída o IR incide sobre o total. O VGBL não tem dedução, mas o IR na saída incide só sobre o rendimento, não sobre o capital.' },
      { q: 'PGBL ou VGBL: qual escolher?', a: 'Se você faz declaração completa do IR e investe até 12% da renda em previdência, o PGBL é mais eficiente (você antecipa o benefício fiscal). Para quem usa a declaração simplificada ou já ultrapassou os 12%, o VGBL costuma ser melhor.' },
      { q: 'Previdência privada é um bom investimento?', a: 'Depende do plano e das taxas. Planos com taxa de administração acima de 1,5% ao ano costumam perder para alternativas mais simples como Tesouro Direto ou fundos de baixo custo. Avalie sempre a taxa de administração, tabela de IR (progressiva ou regressiva) e liquidez antes de contratar.' },
    ],
    related: ['fgts', 'rentabilidade-liquida'],
  },
  {
    slug: 'fgts',
    name: 'FGTS',
    shortDef: 'Fundo de Garantia do Tempo de Serviço — depósito mensal obrigatório do empregador equivalente a 8% do salário.',
    body: [
      'O FGTS (Fundo de Garantia do Tempo de Serviço) é um fundo criado em 1966 para proteger o trabalhador formal (CLT). O empregador deposita 8% do salário bruto todo mês em uma conta vinculada na Caixa Econômica Federal.',
      'O rendimento é de 3% ao ano + TR (Taxa Referencial), historicamente muito abaixo da inflação. Isso significa que, ao longo dos anos, o poder de compra do saldo costuma ser corroído.',
      'O saque é permitido em situações específicas: demissão sem justa causa (com multa de 40% do saldo pelo empregador), aposentadoria, compra do primeiro imóvel, doenças graves e algumas outras hipóteses. Desde 2019, o Saque-Aniversário permite retirar parte do saldo todo ano, mas abre mão da multa rescisória.',
    ],
    faqs: [
      { q: 'O que é FGTS?', a: 'O FGTS (Fundo de Garantia do Tempo de Serviço) é um depósito mensal obrigatório do empregador equivalente a 8% do salário bruto do trabalhador CLT. O saldo fica em uma conta na Caixa Econômica Federal e pode ser sacado em situações específicas.' },
      { q: 'Quando posso sacar o FGTS?', a: 'As principais situações de saque são: demissão sem justa causa, demissão por acordo mútuo (50% do saldo), aposentadoria, compra do primeiro imóvel, doenças graves (câncer, HIV etc.) e o Saque-Aniversário (anual, abre mão da multa rescisória).' },
      { q: 'O FGTS rende bem?', a: 'Não. O FGTS rende apenas 3% ao ano + TR, o que historicamente fica abaixo da inflação. Na prática, o saldo perde poder de compra ao longo dos anos. Por isso, especialistas recomendam não ver o FGTS como investimento, mas como uma reserva emergencial para o caso de demissão.' },
    ],
    related: ['pgbl-vgbl', 'score-de-credito'],
  },
  {
    slug: 'rentabilidade-liquida',
    name: 'Rentabilidade Líquida',
    shortDef: 'O retorno real de um investimento após descontar impostos e taxas.',
    body: [
      'A rentabilidade bruta é o rendimento nominal de um investimento. A rentabilidade líquida é o que sobra para o investidor depois de descontar Imposto de Renda e taxas de administração ou custódia.',
      'Exemplo prático: um CDB que rende 13% ao ano (bruto), com IR de 15% (prazo acima de 2 anos), entrega 11,05% ao ano líquido. Uma LCA que paga 10,5% ao ano é isenta de IR — e portanto mais rentável nesse cenário.',
      'Nunca compare investimentos pela taxa bruta. Sempre calcule a rentabilidade líquida. O cálculo básico para renda fixa tributada: rentabilidade líquida = taxa bruta × (1 − alíquota IR).',
    ],
    faqs: [
      { q: 'O que é rentabilidade líquida?', a: 'Rentabilidade líquida é o retorno de um investimento após o desconto de Imposto de Renda e taxas (administração, custódia). É o valor que de fato entra no seu bolso — diferente da rentabilidade bruta, que ignora esses descontos.' },
      { q: 'Como calcular a rentabilidade líquida?', a: 'Para renda fixa: Rentabilidade líquida = taxa bruta × (1 − alíquota IR). Exemplo: CDB a 12% com IR de 17,5% = 12% × 0,825 = 9,9% ao ano líquido. Para fundos, desconte também a taxa de administração antes do IR.' },
      { q: 'Por que a rentabilidade líquida importa na comparação de investimentos?', a: 'Porque a alíquota de IR e as taxas variam muito entre produtos. Um investimento com rentabilidade bruta menor pode ser mais vantajoso se for isento de IR (como LCI, LCA e poupança). Comparar somente taxas brutas leva a escolhas erradas.' },
    ],
    related: ['cdi', 'lci-lca', 'tesouro-direto'],
  },
  {
    slug: 'diversificacao',
    name: 'Diversificação de Carteira',
    shortDef: 'Estratégia de distribuir o capital em ativos diferentes para reduzir risco sem abrir mão de retorno.',
    body: [
      'Diversificar é aplicar na prática o princípio "não coloque todos os ovos na mesma cesta." Ao investir em ativos com comportamentos diferentes — renda fixa, ações, fundos imobiliários, câmbio — a queda de um tende a ser compensada pela estabilidade ou alta dos outros.',
      'A diversificação eficiente não depende de quantidade de ativos, mas de correlação. Ter 20 ações do mesmo setor não é diversificar. Misturar ativos que reagem de formas diferentes ao mesmo evento econômico — isso é.',
      'Importante: a diversificação elimina o risco específico de cada ativo (risco da empresa, do setor), mas não elimina o risco sistêmico (crises econômicas que afetam tudo). Para reduzir o risco sistêmico, é possível diversificar internacionalmente.',
    ],
    faqs: [
      { q: 'O que é diversificação de carteira?', a: 'Diversificação de carteira é a estratégia de distribuir o capital entre diferentes tipos de investimento (renda fixa, ações, fundos imobiliários, câmbio etc.) para reduzir o risco. A ideia é que ativos distintos não caem todos ao mesmo tempo.' },
      { q: 'Quantos ativos preciso para diversificar?', a: 'Não há número mágico. Estudos mostram que a maior parte do benefício da diversificação em ações brasileiras é obtida com 10 a 15 papéis de setores diferentes. O mais importante é que os ativos tenham baixa correlação entre si, não o número total.' },
      { q: 'Diversificação elimina todos os riscos?', a: 'Não. A diversificação elimina o risco específico (de uma empresa ou setor), mas não o risco sistêmico — aquele que afeta toda a economia ao mesmo tempo, como uma crise financeira global ou uma recessão. Para mitigar o risco sistêmico, diversificação internacional é uma das estratégias.' },
    ],
    related: ['rentabilidade-liquida', 'tesouro-direto', 'lci-lca'],
  },
]

export function getTermBySlug(slug: string): GlossarioTerm | undefined {
  return terms.find(t => t.slug === slug)
}
