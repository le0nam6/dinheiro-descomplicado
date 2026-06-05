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

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm">
        <p className="font-bold text-blue-900 mb-2">📖 Entenda antes de contratar</p>
        <div className="flex flex-col gap-1">
          <Link href="/blog/emprestimo-consignado-2025" className="text-blue-700 hover:underline">→ Empréstimo consignado: como funciona e melhores taxas</Link>
          <Link href="/blog/emprestimo-pessoal-2026" className="text-blue-700 hover:underline">→ Consignado vs empréstimo pessoal: qual escolher</Link>
        </div>
      </div>
    </div>
  )
}
