import type { Metadata } from 'next'
import { PainelForm } from './PainelForm'

export const metadata: Metadata = {
  title: 'Meu painel de indicações — Endinheirados',
  description: 'Acesse seu painel de indicações e veja quantas pessoas você já trouxe para o Endinheirados.',
  robots: { index: false, follow: false },
}

export default function PainelPage() {
  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-4xl">🔗</p>
        <h1 className="text-2xl font-black text-gray-900">Acessar meu painel</h1>
        <p className="text-gray-500 text-sm">
          Digite o e-mail com que você se inscreveu. Vamos te mandar um link direto para o seu painel de indicações.
        </p>
      </div>
      <PainelForm />
    </div>
  )
}
