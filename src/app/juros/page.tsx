import type { Metadata } from 'next'
import { painelDeJuros, dataBr, reais, pct } from '@/lib/juros-bacen'

const SITE = 'https://portalendinheirados.com.br'

/** Seis horas: o BACEN publica uma vez por semana, não adianta bater mais. */
export const revalidate = 21600

export const metadata: Metadata = {
  title: 'Quanto cada banco cobra de juros — dados do Banco Central',
  description:
    'A taxa que cada instituição cobra no rotativo do cartão, cheque especial, empréstimo pessoal, consignado e financiamento de veículo. Dado oficial do Banco Central, atualizado toda semana.',
  alternates: { canonical: `${SITE}/juros` },
}

export default async function JurosPage() {
  const painel = await painelDeJuros()

  if (!painel) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Quanto cada banco cobra de juros</h1>
        <p className="text-gray-500">
          O Banco Central não respondeu agora. Os dados voltam assim que o serviço deles normalizar.
        </p>
      </div>
    )
  }

  const campeao = [...painel.modalidades].sort((a, b) => b.diferenca - a.diferenca)[0]

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Dados do Banco Central · semana de {dataBr(painel.inicio)} a {dataBr(painel.fim)}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Quanto cada banco cobra de juros
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          A mesma dívida custa preços radicalmente diferentes dependendo de onde você a contrata.
          No {campeao.curto.toLowerCase()}, {campeao.bancos} instituições cobram de{' '}
          <strong className="text-gray-900">{pct(campeao.menor.aoAno)}</strong> a{' '}
          <strong className="text-gray-900">{pct(campeao.maior.aoAno)}</strong> ao ano — uma diferença de{' '}
          <strong className="text-gray-900">{reais(campeao.diferenca)}</strong> em juros para cada R$ 1.000
          que ficarem doze meses em aberto.
        </p>
      </header>

      <div className="space-y-6">
        {painel.modalidades.map(m => (
          <section key={m.oficial} className="border border-gray-200 rounded-2xl p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{m.curto}</h2>
              <span className="text-sm text-gray-500">{m.bancos} instituições</span>
            </div>
            <p className="text-sm text-gray-500 mb-5">{m.explica}</p>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Mediana</p>
                <p className="text-2xl font-extrabold text-gray-900">{pct(m.mediana)}</p>
                <p className="text-xs text-gray-500 mt-1">ao ano</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Menor taxa</p>
                <p className="text-2xl font-extrabold text-green-700">{pct(m.menor.aoAno)}</p>
                <p className="text-xs text-gray-500 mt-1">{m.menor.banco}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Maior taxa</p>
                <p className="text-2xl font-extrabold text-gray-900">{pct(m.maior.aoAno)}</p>
                <p className="text-xs text-gray-500 mt-1">{m.maior.banco}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Em R$ 1.000 mantidos doze meses: <strong>{reais(m.custoMenor)}</strong> de juros na menor
              taxa, <strong>{reais(m.custoMaior)}</strong> na maior. Diferença de{' '}
              <strong className="text-gray-900">{reais(m.diferenca)}</strong>.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-2">Cinco mais baratos</p>
                <ol className="space-y-1">
                  {m.maisBaratos.map(t => (
                    <li key={t.banco} className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-600 truncate">{t.banco}</span>
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{pct(t.aoAno)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Cinco mais caros</p>
                <ol className="space-y-1">
                  {m.maisCaros.map(t => (
                    <li key={t.banco} className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-600 truncate">{t.banco}</span>
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{pct(t.aoAno)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Como estes números são apurados</h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            A fonte é o Banco Central, que publica semanalmente a taxa média cobrada por cada
            instituição em cada modalidade de crédito. Esta página lê esse dado direto da API pública
            e mostra a semana mais recente disponível — aqui, {dataBr(painel.inicio)} a {dataBr(painel.fim)}.
          </p>
          <p>
            Usamos a <strong>mediana</strong>, não a média. Os extremos costumam ser instituições
            pequenas, com carteira reduzida, e uma média seria puxada por elas. A mediana mostra o que
            se paga no meio do mercado.
          </p>
          <p>
            A conversão para reais assume R$ 1.000 mantidos por doze meses à taxa efetiva anual
            informada, sem amortização. É uma referência de comparação entre instituições, não uma
            simulação de contrato: na prática o rotativo do cartão raramente passa de alguns meses, e
            financiamento é amortizado ao longo do prazo.
          </p>
          <p>
            Modalidade com menos de cinco instituições fica de fora, porque mediana e ranking não se
            sustentam com amostra pequena.
          </p>
          <p>
            Dado aberto e verificável em{' '}
            <a href="https://dadosabertos.bcb.gov.br/dataset/taxas-de-juros-de-operacoes-de-credito"
               className="text-green-700 underline" rel="noopener" target="_blank">
              dadosabertos.bcb.gov.br
            </a>. Se for citar, o crédito é do Banco Central; o recorte e a conta em reais são nossos.
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: 'Juros ao consumidor por instituição financeira no Brasil',
            description:
              'Taxa de juros cobrada por cada instituição financeira nas principais modalidades de crédito para pessoa física, com mediana e faixa por modalidade.',
            url: `${SITE}/juros`,
            temporalCoverage: `${painel.inicio}/${painel.fim}`,
            license: 'https://creativecommons.org/licenses/by/4.0/',
            isBasedOn: 'https://dadosabertos.bcb.gov.br/dataset/taxas-de-juros-de-operacoes-de-credito',
            creator: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
            spatialCoverage: { '@type': 'Country', name: 'Brasil' },
            variableMeasured: painel.modalidades.map(m => ({
              '@type': 'PropertyValue',
              name: m.curto,
              description: `Taxa de juros ao ano — mediana de ${m.bancos} instituições`,
              value: m.mediana,
              unitText: '% ao ano',
            })),
          }),
        }}
      />
    </div>
  )
}
