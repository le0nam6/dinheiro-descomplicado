import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ferramentas Gratuitas — Calculadoras Financeiras',
  description: 'Hub de ferramentas financeiras gratuitas: calculadora de investimentos, consignado, simulador de dívidas e mais. Acesso grátis.',
}

const tools = [
  {
    href: '/ferramentas/calculadora-consignado',
    emoji: '💳',
    title: 'Calculadora de Consignado',
    desc: 'Simule o valor da parcela, o total pago e os juros do empréstimo consignado.',
    tags: ['Empréstimo', 'Popular'],
    color: 'bg-blue-50 border-blue-200',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    href: '/ferramentas/calculadora-juros',
    emoji: '📈',
    title: 'Calculadora de Juros Compostos',
    desc: 'Veja quanto rende qualquer investimento com aportes mensais ao longo do tempo.',
    tags: ['Investimentos', 'Popular'],
    color: 'bg-green-50 border-green-200',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    href: '/ferramentas/simulador-dividas',
    emoji: '🔴',
    title: 'Simulador de Quitar Dívidas',
    desc: 'Compare estratégias (avalanche vs bola de neve) e veja qual elimina suas dívidas mais rápido.',
    tags: ['Dívidas'],
    color: 'bg-red-50 border-red-200',
    tagColor: 'bg-red-100 text-red-700',
  },
  {
    href: '/calculadora',
    emoji: '📊',
    title: 'Calculadora de Patrimônio',
    desc: 'Compare Tesouro Selic, CDB, LCI/LCA e poupança e descubra onde seu dinheiro rende mais.',
    tags: ['Investimentos'],
    color: 'bg-violet-50 border-violet-200',
    tagColor: 'bg-violet-100 text-violet-700',
  },
]

export default function FerramentasPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <p className="text-4xl mb-3">🧰</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Ferramentas Financeiras Gratuitas</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Simule, calcule e tome decisões financeiras com dados reais. Acesso gratuito com cadastro único.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-12">
        {tools.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`group border rounded-2xl p-6 hover:shadow-md transition-all ${tool.color}`}
          >
            <div className="text-3xl mb-3">{tool.emoji}</div>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tool.tags.map(tag => (
                <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tool.tagColor}`}>{tag}</span>
              ))}
            </div>
            <h2 className="font-bold text-gray-900 text-base mb-1 group-hover:text-green-700 transition-colors">{tool.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{tool.desc}</p>
            <p className="text-sm font-semibold text-green-700 mt-3">Acessar grátis →</p>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
        <p className="font-bold text-gray-900 mb-1">Quer sugerir uma ferramenta?</p>
        <p className="text-sm text-gray-500 mb-3">Nos conte qual calculadora faria diferença pra você.</p>
        <Link href="/contato" className="text-sm text-green-700 font-semibold hover:underline">Enviar sugestão →</Link>
      </div>
    </div>
  )
}
