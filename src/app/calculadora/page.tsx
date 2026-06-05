import type { Metadata } from 'next'
import { CalculadoraInvestimentos } from './CalculadoraInvestimentos'

export const metadata: Metadata = {
  title: 'Calculadora de Investimentos 2026 — Simule seu Patrimônio',
  description: 'Simule gratuitamente o crescimento do seu investimento com juros compostos. Veja quanto R$100, R$500 ou R$1.000 por mês viram em 10, 20 ou 30 anos.',
}

export default function CalculadoraPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Calculadora de Investimentos
        </h1>
        <p className="text-gray-500 text-lg">
          Descubra quanto seu dinheiro pode render com juros compostos. Simule diferentes cenários em segundos.
        </p>
      </div>
      <CalculadoraInvestimentos />
      <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm text-gray-500">
        <p className="font-semibold text-gray-700 mb-1">⚠️ Aviso importante</p>
        <p>Esta calculadora é apenas educacional e não constitui recomendação de investimento. Rentabilidades passadas não garantem resultados futuros. Consulte um profissional certificado (CFP) antes de investir.</p>
      </div>
    </div>
  )
}
