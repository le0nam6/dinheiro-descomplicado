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
      <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-5 text-sm">
        <p className="font-bold text-red-900 mb-2">📖 Estratégias para sair das dívidas</p>
        <div className="flex flex-col gap-1.5">
          <Link href="/blog/como-sair-das-dividas" className="text-red-700 hover:underline">→ Como sair das dívidas: plano em 7 passos</Link>
          <Link href="/blog/emprestimo-consignado-2025" className="text-red-700 hover:underline">→ Consignado: troque dívida cara por dívida barata</Link>
          <Link href="/blog/score-credito-como-aumentar" className="text-red-700 hover:underline">→ Como aumentar o score após quitar dívidas</Link>
        </div>
      </div>
    </div>
  )
}
