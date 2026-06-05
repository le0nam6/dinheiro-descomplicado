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
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Calculadora de Juros Compostos</h1>
      <p className="text-gray-500 text-sm mb-6">Simule quanto seu dinheiro rende com aportes mensais e compare produtos.</p>
      <ToolGate toolName="Calculadora de Juros Compostos" toolDescription="Simule investimentos e veja o efeito bola de neve ao longo do tempo.">
        <CalculadoraInvestimentos />
      </ToolGate>
      <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-5 text-sm">
        <p className="font-bold text-green-900 mb-2">📖 Aprenda mais</p>
        <div className="flex flex-col gap-1.5">
          <Link href="/blog/juros-compostos-como-funcionam" className="text-green-700 hover:underline">→ Juros compostos: o segredo dos ricos</Link>
          <Link href="/blog/tesouro-direto-como-investir" className="text-green-700 hover:underline">→ Tesouro Direto 2026: guia completo</Link>
          <Link href="/blog/lci-lca-o-que-e" className="text-green-700 hover:underline">→ LCI e LCA: investimento isento de IR</Link>
        </div>
      </div>
    </div>
  )
}
