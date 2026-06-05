import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre o Endinheirados',
  description: 'Conheça o Endinheirados: nossa missão é ensinar você a ganhar dinheiro e garantir que ele nunca acabe.',
}

export default function SobrePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-center mb-8">
        <img src="/logo-endinheirados.png" alt="Endinheirados" className="h-24 w-auto object-contain" />
      </div>

      <div className="prose">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">Sobre o Endinheirados</h1>

        <blockquote className="border-l-4 border-green-500 bg-green-50 pl-4 pr-4 py-3 my-6 rounded-r-xl text-gray-700 not-italic">
          <strong>Nossa missão:</strong> ensinar você a ganhar dinheiro — e, mais importante, a garantir que ele nunca acabe.
        </blockquote>

        <p>O <strong>Endinheirados</strong> nasceu de uma ideia simples: a maioria dos conteúdos sobre dinheiro no Brasil é complicada demais, cheia de jargão, ou promete enriquecimento rápido que nunca se sustenta.</p>

        <p>Acreditamos no contrário. Ganhar dinheiro é importante, mas o que realmente muda uma vida é aprender a <strong>construir patrimônio que se perpetua</strong> — uma grana que cresce, se sustenta e dura para sempre.</p>

        <h2>O que você encontra aqui</h2>
        <ul>
          <li><strong>Educação financeira de verdade</strong> — score, orçamento, reserva de emergência, juros compostos</li>
          <li><strong>Investimentos sem mistério</strong> — Tesouro Direto, CDB, renda fixa, do básico ao avançado</li>
          <li><strong>Crédito inteligente</strong> — empréstimos, cartões e financiamentos sem cair em ciladas</li>
          <li><strong>Ferramentas práticas</strong> — como a nossa <a href="/calculadora">calculadora de investimentos</a></li>
        </ul>

        <h2>Como produzimos o conteúdo</h2>
        <p>Nosso conteúdo é pesquisado e produzido com apoio de inteligência artificial e revisado para garantir clareza e precisão. Todas as informações financeiras citadas (taxas, regras, prazos) são baseadas em fontes públicas e atualizadas para 2026.</p>

        <p>Vale lembrar: o conteúdo do Endinheirados é <strong>educacional</strong> e não substitui a orientação de um profissional financeiro certificado. Confira nossos <a href="/termos">Termos de Uso</a> para mais detalhes.</p>

        <h2>Nosso compromisso</h2>
        <p>Linguagem simples. Informação confiável. Zero promessas mirabolantes. Se você quer entender de dinheiro sem precisar de dicionário, você está no lugar certo.</p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mt-8 not-prose text-center">
          <p className="font-bold text-green-900 mb-2">Bora ficar endinheirado?</p>
          <p className="text-sm text-green-800 mb-4">Comece pelos nossos artigos mais lidos ou explore por tema.</p>
          <a href="/blog" className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors">Ver todos os artigos →</a>
        </div>
      </div>
    </div>
  )
}
