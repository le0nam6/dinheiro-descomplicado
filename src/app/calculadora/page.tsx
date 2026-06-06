import type { Metadata } from 'next'
import { CalculadoraInvestimentos } from './CalculadoraInvestimentos'
import { ToolGate } from '@/components/ToolGate'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Calculadora de Investimentos 2026 — Simule Grátis',
  description: 'Simule quanto seu dinheiro rende com juros compostos e compare Tesouro Selic, CDB e poupança. Gratuito.',
}

export default function CalculadoraPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/ferramentas" className="text-sm text-green-700 hover:underline">← Todas as ferramentas</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Calculadora de Investimentos</h1>
        <p className="text-gray-500">Simule quanto seu dinheiro rende com juros compostos e compare produtos financeiros. Grátis.</p>
      </div>
      <ToolGate
        toolName="Calculadora de Investimentos"
        toolDescription="Simule aportes mensais, compare Tesouro Selic, CDB, LCI/LCA e veja o efeito bola de neve."
      >
        <CalculadoraInvestimentos />
      </ToolGate>
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-500">
        <p className="font-semibold text-gray-700 mb-1">⚠️ Aviso importante</p>
        <p>Ferramenta educacional — não constitui recomendação de investimento. Consulte um profissional certificado (CFP) antes de investir.</p>
      </div>
    </div>
  )
}
