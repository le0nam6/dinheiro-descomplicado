import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Equipe Editorial — Como produzimos nosso conteúdo',
  description: 'Conheça a equipe editorial do Endinheirados, nossa metodologia de pesquisa e o compromisso com informação financeira confiável.',
}

export default function AutorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-3xl shrink-0">💰</div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Equipe Editorial Endinheirados</h1>
          <p className="text-gray-500 text-sm">Finanças pessoais explicadas com clareza e responsabilidade</p>
        </div>
      </div>

      <div className="prose">
        <p>O <strong>Endinheirados</strong> é um portal de educação financeira dedicado a tornar o mundo do dinheiro acessível a todos os brasileiros. Nossa missão é simples: ajudar você a <strong>ganhar dinheiro e garantir que ele nunca acabe</strong>.</p>

        <h2>Como produzimos nosso conteúdo</h2>
        <p>Nosso processo editorial combina <strong>pesquisa de fontes oficiais</strong> (Banco Central, Receita Federal, B3, instituições financeiras) com tecnologia de inteligência artificial para produção em escala, sempre sob <strong>curadoria e revisão editorial</strong> para garantir clareza e precisão.</p>

        <blockquote>Todo conteúdo financeiro citado — taxas, regras, prazos — é baseado em fontes públicas e atualizado para 2026.</blockquote>

        <h2>Nosso compromisso com você</h2>
        <ul>
          <li><strong>Transparência:</strong> indicamos quando há links de afiliados ou publicidade</li>
          <li><strong>Independência:</strong> nosso conteúdo não é pago por bancos ou corretoras para favorecê-los</li>
          <li><strong>Responsabilidade:</strong> deixamos claro que conteúdo educacional não substitui um profissional certificado</li>
          <li><strong>Atualização:</strong> revisamos os dados conforme as regras e taxas mudam</li>
        </ul>

        <h2>Aviso importante</h2>
        <p>O conteúdo do Endinheirados tem caráter <strong>informativo e educacional</strong>. Não somos uma instituição financeira nem consultoria de investimentos registrada na CVM. Antes de decisões financeiras importantes, consulte um profissional certificado e avalie seu perfil. Veja nossos <Link href="/termos">Termos de Uso</Link>.</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mt-8 text-center">
        <p className="font-bold text-green-900 mb-3">Fale com a equipe</p>
        <Link href="/contato" className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors">Entrar em contato →</Link>
      </div>
    </div>
  )
}
