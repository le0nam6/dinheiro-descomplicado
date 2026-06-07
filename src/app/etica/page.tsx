import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política Editorial e de Imparcialidade · Endinheirados',
  description: 'Como produzimos nosso conteúdo: uso de IA, verificação de fontes, compromisso com a imparcialidade e correções.',
}

export default function EticaPage() {
  return (
    <article className="max-w-2xl mx-auto prose">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Política Editorial</h1>
      <p className="text-gray-500 mb-8">Transparência sobre como o Endinheirados produz e publica conteúdo.</p>

      <h2 className="text-xl font-bold mt-8 mb-2 text-gray-900">Imparcialidade é inegociável</h2>
      <p className="text-gray-700 mb-4">Nas notícias de mercado, nosso compromisso é reportar os fatos sem viés. Apresentamos os diferentes lados de um tema, atribuímos afirmações às suas fontes e evitamos alarmismo, opinião disfarçada de fato e clickbait. Cada notícia traz um termômetro de imparcialidade onde você, leitor, avalia nossa cobertura — e o resultado é público e ao vivo.</p>

      <h2 className="text-xl font-bold mt-8 mb-2 text-gray-900">Uso de inteligência artificial</h2>
      <p className="text-gray-700 mb-4">Parte do nosso conteúdo é produzido com auxílio de IA a partir de fontes jornalísticas públicas e confiáveis, sempre citadas ao final das matérias. A IA acelera a curadoria e a redação, mas seguimos princípios editoriais rígidos: não inventamos dados, números ou falas, e priorizamos precisão sobre velocidade.</p>

      <h2 className="text-xl font-bold mt-8 mb-2 text-gray-900">Fontes</h2>
      <p className="text-gray-700 mb-4">Toda notícia lista as fontes que a embasaram, com links diretos. Acreditamos que o leitor tem o direito de checar a origem da informação.</p>

      <h2 className="text-xl font-bold mt-8 mb-2 text-gray-900">Correções e atualizações</h2>
      <p className="text-gray-700 mb-4">Quando uma matéria é corrigida ou atualizada, registramos a data da alteração. Erros acontecem; o que importa é corrigi-los de forma transparente.</p>

      <h2 className="text-xl font-bold mt-8 mb-2 text-gray-900">Conteúdo patrocinado</h2>
      <p className="text-gray-700 mb-4">Quando um conteúdo é pago ou patrocinado, ele é claramente identificado com um selo. Conteúdo editorial e publicitário nunca se misturam sem aviso.</p>

      <h2 className="text-xl font-bold mt-8 mb-2 text-gray-900">Não é recomendação financeira</h2>
      <p className="text-gray-700 mb-4">Nosso conteúdo é informativo e educacional. Não constitui recomendação de investimento nem consultoria financeira. Consulte um profissional certificado antes de tomar decisões.</p>

      <p className="text-sm text-gray-400 mt-10">Dúvidas sobre nossa cobertura? Fale com a gente em <a href="/contato" className="text-green-700 underline">/contato</a>.</p>
    </article>
  )
}
