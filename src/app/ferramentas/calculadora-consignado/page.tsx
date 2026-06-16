import type { Metadata } from 'next'
import { ToolGate } from '@/components/ToolGate'
import { CalculadoraConsignado } from './CalculadoraConsignado'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Calculadora de Empréstimo Consignado 2026 — Simule Grátis',
  description: 'Simule o empréstimo consignado: valor da parcela, total pago, juros e margem disponível. Ferramenta gratuita.',
}

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-2">
        <Link href="/ferramentas" className="text-sm text-green-700 hover:underline">← Todas as ferramentas</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Calculadora de Empréstimo Consignado</h1>
        <p className="text-gray-500 text-sm">Simule parcela, juros totais e margem disponível. Resultados imediatos e gratuitos.</p>
      </div>

      <ToolGate
        toolName="Calculadora de Consignado"
        toolDescription="Simule sua parcela, total pago e veja se cabe no seu orçamento."
      >
        <CalculadoraConsignado />
      </ToolGate>

      <div className="mt-10 space-y-5">
        <h2 className="text-xl font-bold text-gray-900">Como funciona esta calculadora?</h2>
        <p className="text-gray-600 leading-relaxed">
          A calculadora simula o empréstimo consignado usando a fórmula de financiamento com juros compostos (Tabela Price). Informe o valor desejado, a taxa de juros mensal e o número de parcelas — e a ferramenta calcula o valor de cada parcela, o total pago e o custo total em juros.
        </p>
        <p className="text-gray-600 leading-relaxed">
          O consignado tem desconto direto em folha, o que reduz o risco para o banco e permite taxas menores que o crédito pessoal tradicional. Por lei, a parcela não pode comprometer mais de 35% do salário líquido.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Perguntas frequentes</h2>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-blue-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">O que é empréstimo consignado?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              Empréstimo consignado é um crédito com desconto automático em folha de pagamento ou benefício do INSS. Como o risco de inadimplência é menor (o banco "pega" o dinheiro antes de você), as taxas de juros costumam ser menores que outras modalidades de crédito pessoal.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-blue-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">Qual é a taxa máxima do consignado?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              O Conselho Nacional de Previdência Social (CNPS) define os limites para aposentados e pensionistas do INSS periodicamente. Para servidores públicos e trabalhadores privados CLT, os limites variam conforme o convênio da empresa com o banco. Em 2026, a taxa para consignado INSS está limitada a 1,80% ao mês.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-blue-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">Consignado ou empréstimo pessoal: qual escolher?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              Se você tem acesso ao consignado, ele quase sempre é a melhor opção: taxas menores, prazos maiores e sem risco de cair em dívida espiral. O empréstimo pessoal faz sentido quando você não tem margem consignável disponível ou precisa de um valor acima do permitido em folha.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm">
          <p className="font-bold text-blue-900 mb-2">📖 Entenda antes de contratar</p>
          <div className="flex flex-col gap-1">
            <Link href="/blog/emprestimo-consignado-2025" className="text-blue-700 hover:underline">→ Empréstimo consignado: como funciona e melhores taxas</Link>
            <Link href="/blog/emprestimo-pessoal-2026" className="text-blue-700 hover:underline">→ Consignado vs empréstimo pessoal: qual escolher</Link>
            <Link href="/glossario/score-de-credito" className="text-blue-700 hover:underline">→ Glossário: o que é score de crédito?</Link>
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
                name: 'O que é empréstimo consignado?',
                acceptedAnswer: { '@type': 'Answer', text: 'Empréstimo consignado é um crédito com desconto automático em folha de pagamento ou benefício do INSS. Como o risco de inadimplência é menor, as taxas de juros costumam ser menores que outras modalidades de crédito pessoal.' },
              },
              {
                '@type': 'Question',
                name: 'Qual é a taxa máxima do consignado INSS?',
                acceptedAnswer: { '@type': 'Answer', text: 'Em 2026, a taxa para consignado INSS está limitada a 1,80% ao mês, conforme definição do Conselho Nacional de Previdência Social (CNPS). Para servidores públicos e CLT, os limites variam conforme convênio.' },
              },
              {
                '@type': 'Question',
                name: 'Consignado ou empréstimo pessoal: qual escolher?',
                acceptedAnswer: { '@type': 'Answer', text: 'Se você tem acesso ao consignado, ele quase sempre é a melhor opção: taxas menores, prazos maiores e sem risco de dívida espiral. O empréstimo pessoal faz sentido quando não há margem consignável disponível.' },
              },
            ],
          }),
        }}
      />
    </div>
  )
}
