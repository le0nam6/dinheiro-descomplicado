import type { Metadata } from 'next'
import { ContatoForm } from './ContatoForm'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com o Endinheirados — dúvidas, sugestões, parcerias ou questões sobre privacidade.',
}

export default function ContatoPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Fale com a gente</h1>
      <p className="text-gray-500 mb-8">
        Dúvidas, sugestões de pauta, parcerias ou questões sobre seus dados? Manda ver — a gente responde.
      </p>

      <ContatoForm />

      <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">Outras formas de contato</p>
        <p>E-mail: <a href="mailto:contato@endinheirados.online" className="text-green-700 hover:underline">contato@endinheirados.online</a></p>
        <p className="mt-1">Respondemos em até 48 horas úteis.</p>
      </div>
    </div>
  )
}
