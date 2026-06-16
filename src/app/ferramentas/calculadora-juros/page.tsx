import type { Metadata } from 'next'
import { ToolGate } from '@/components/ToolGate'
import { CalculadoraInvestimentos } from '@/app/calculadora/CalculadoraInvestimentos'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Calculadora de Juros Compostos 2026',
  description: 'Simule investimentos com aportes mensais. Compare Tesouro Selic, CDB, LCI/LCA e poupança gratuitamente.',
}

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-2"><Link href="/ferramentas" className="text-sm text-green-700 hover:underline">← Todas as ferramentas</Link></div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Calculadora de Investimentos</h1>
      <p className="text-gray-500 text-sm mb-6">Simule quanto seu dinheiro rende com aportes mensais e compare produtos financeiros.</p>
      <ToolGate toolName="Calculadora de Investimentos" toolDescription="Simule aportes mensais, compare Tesouro Selic, CDB, LCI/LCA e veja o efeito bola de neve.">
        <CalculadoraInvestimentos />
      </ToolGate>
      <div className="mt-10 space-y-5">
        <h2 className="text-xl font-bold text-gray-900">Como funciona esta calculadora?</h2>
        <p className="text-gray-600 leading-relaxed">
          A calculadora usa a fórmula de <strong>juros compostos</strong> com aportes mensais para projetar o crescimento do seu patrimônio ao longo do tempo. Você informa o valor inicial, o aporte mensal, a taxa de juros e o prazo — e a ferramenta calcula o montante final e o total de juros acumulados.
        </p>
        <p className="text-gray-600 leading-relaxed">
          As taxas padrão (Tesouro Selic, CDB, LCI/LCA, poupança) são referências históricas. As rentabilidades reais variam conforme o cenário econômico, o prazo e a instituição financeira.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Perguntas frequentes</h2>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-green-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">Como calcular juros compostos?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              A fórmula é M = C × (1 + i)^t, onde M é o montante final, C é o capital inicial, i é a taxa de juros por período e t é o número de períodos. Com aportes mensais, a fórmula é aplicada iterativamente a cada mês. Esta calculadora faz esse cálculo automaticamente.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-green-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">Qual é a diferença entre CDB e Tesouro Direto?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              O Tesouro Direto é um título do governo federal — o ativo mais seguro do Brasil. O CDB é emitido por bancos privados e é garantido pelo FGC até R$250.000. Em geral, CDBs de bancos menores pagam taxas mais altas como compensação pelo risco maior.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-green-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">LCI e LCA são melhores que CDB?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              Depende da taxa. LCI e LCA são isentas de Imposto de Renda, o que as torna mais rentáveis do que aparentam. Um CDB que paga 110% do CDI com IR de 15% entrega 93,5% do CDI líquido — menos que uma LCI de 94% do CDI. Sempre compare pela rentabilidade líquida.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-5 text-sm">
          <p className="font-bold text-green-900 mb-2">📖 Aprenda mais</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/blog/juros-compostos-como-funcionam" className="text-green-700 hover:underline">→ Juros compostos: o segredo dos ricos</Link>
            <Link href="/blog/tesouro-direto-como-investir" className="text-green-700 hover:underline">→ Tesouro Direto 2026: guia completo</Link>
            <Link href="/blog/lci-lca-o-que-e" className="text-green-700 hover:underline">→ LCI e LCA: investimento isento de IR</Link>
            <Link href="/glossario/juros-compostos" className="text-green-700 hover:underline">→ Glossário: o que são juros compostos?</Link>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Como calcular juros compostos?',
                acceptedAnswer: { '@type': 'Answer', text: 'A fórmula é M = C × (1 + i)^t, onde M é o montante final, C é o capital inicial, i é a taxa de juros por período e t é o número de períodos. Com aportes mensais, a fórmula é aplicada iterativamente a cada mês.' },
              },
              {
                '@type': 'Question',
                name: 'Qual é a diferença entre CDB e Tesouro Direto?',
                acceptedAnswer: { '@type': 'Answer', text: 'O Tesouro Direto é um título do governo federal — o ativo mais seguro do Brasil. O CDB é emitido por bancos privados e é garantido pelo FGC até R$250.000. CDBs de bancos menores pagam taxas mais altas como compensação pelo risco maior.' },
              },
              {
                '@type': 'Question',
                name: 'LCI e LCA são melhores que CDB?',
                acceptedAnswer: { '@type': 'Answer', text: 'Depende da taxa. LCI e LCA são isentas de IR. Um CDB de 110% do CDI com IR de 15% entrega 93,5% do CDI líquido — menos que uma LCI de 94% do CDI. Sempre compare pela rentabilidade líquida.' },
              },
            ],
          }),
        }}
      />
    </div>
  )
}
