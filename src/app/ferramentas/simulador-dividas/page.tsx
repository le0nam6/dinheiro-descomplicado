import type { Metadata } from 'next'
import { ToolGate } from '@/components/ToolGate'
import { SimuladorDividas } from './SimuladorDividas'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Simulador de Quitação de Dívidas 2026',
  description: 'Compare as estratégias avalanche e bola de neve e descubra qual elimina suas dívidas mais rápido.',
}

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-2"><Link href="/ferramentas" className="text-sm text-green-700 hover:underline">← Todas as ferramentas</Link></div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Simulador de Quitação de Dívidas</h1>
      <p className="text-gray-500 text-sm mb-6">Compare as estratégias avalanche (maior juro primeiro) e bola de neve (menor dívida primeiro).</p>
      <ToolGate toolName="Simulador de Dívidas" toolDescription="Descubra qual estratégia elimina suas dívidas mais rápido e economiza mais juros.">
        <SimuladorDividas />
      </ToolGate>
      <div className="mt-10 space-y-5">
        <h2 className="text-xl font-bold text-gray-900">Como funciona este simulador?</h2>
        <p className="text-gray-600 leading-relaxed">
          O simulador aplica juros compostos mensalmente sobre cada dívida, subtrai os pagamentos mínimos e distribui o valor extra conforme a estratégia escolhida. Quando uma dívida é quitada, o valor da parcela liberado é automaticamente cascateado para a próxima da fila.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Se os juros de uma dívida superarem os pagamentos mensais, o simulador indica que a quitação é impossível nessas condições — sinal de que é urgente negociar a taxa ou aumentar o valor pago.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Perguntas frequentes</h2>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-red-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">O que é a estratégia Avalanche?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              Na estratégia Avalanche, você paga o mínimo em todas as dívidas e direciona o valor extra para a que tem a maior taxa de juros. Matematicamente é a mais eficiente: minimiza o total pago em juros e quita as dívidas mais rápido no médio prazo.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-red-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">O que é a estratégia Bola de Neve?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              Na estratégia Bola de Neve, você ataca primeiro a dívida com o menor saldo, independente da taxa. Quitar uma dívida rapidamente gera motivação e libera uma parcela mensal para atacar a próxima. É mais cara em juros, mas mais eficaz para quem precisa de vitórias rápidas para não desistir.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-red-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">O que fazer quando a dívida aparece como "impossível quitar"?</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">
              Significa que os juros mensais superam o total de pagamentos — a dívida cresce mais rápido do que você consegue pagar. As saídas são: aumentar o valor extra aplicado, negociar a taxa de juros diretamente com o credor ou buscar portabilidade para uma instituição com taxas menores.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-5 text-sm">
          <p className="font-bold text-red-900 mb-2">📖 Estratégias para sair das dívidas</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/blog/como-sair-das-dividas" className="text-red-700 hover:underline">→ Como sair das dívidas: plano em 7 passos</Link>
            <Link href="/blog/emprestimo-consignado-2025" className="text-red-700 hover:underline">→ Consignado: troque dívida cara por dívida barata</Link>
            <Link href="/blog/score-credito-como-aumentar" className="text-red-700 hover:underline">→ Como aumentar o score após quitar dívidas</Link>
            <Link href="/glossario/score-de-credito" className="text-red-700 hover:underline">→ Glossário: o que é score de crédito?</Link>
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
                name: 'O que é a estratégia Avalanche de quitação de dívidas?',
                acceptedAnswer: { '@type': 'Answer', text: 'Na estratégia Avalanche, você paga o mínimo em todas as dívidas e direciona o valor extra para a que tem a maior taxa de juros. É a mais eficiente matematicamente: minimiza o total pago em juros.' },
              },
              {
                '@type': 'Question',
                name: 'O que é a estratégia Bola de Neve de quitação de dívidas?',
                acceptedAnswer: { '@type': 'Answer', text: 'Na Bola de Neve, você ataca primeiro a dívida com o menor saldo, independente da taxa. Quitar uma dívida rapidamente gera motivação e libera a parcela para a próxima. Pode custar mais em juros, mas funciona melhor psicologicamente.' },
              },
              {
                '@type': 'Question',
                name: 'O que fazer quando a dívida é impossível de quitar?',
                acceptedAnswer: { '@type': 'Answer', text: 'Quando os juros mensais superam o total de pagamentos, a dívida cresce indefinidamente. É urgente: aumentar o valor extra pago, negociar a taxa com o credor, ou buscar portabilidade de crédito para taxas menores.' },
              },
            ],
          }),
        }}
      />
    </div>
  )
}
