'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Data = { count: number; goal: number; prizeName: string }

type Variant = {
  badge: string
  headline: (d: Data) => string
  body: (d: Data) => string
  cta: string
}

const VARIANTS: Variant[] = [
  {
    // Schwartz — desejo + aspiração
    badge: 'Para os seus amigos',
    headline: () => '1h com um planejador financeiro. De graça.',
    body: ({ goal, prizeName }) =>
      `Cada pessoa que você indica nos aproxima da meta de ${goal.toLocaleString('pt-BR')} inscritos. Quando bater, sorteamos ${prizeName} — e uma consultoria financeira certificada. O tipo de coisa que custa R$ 300/hora lá fora.`,
    cta: 'Quero ganhar minha hora →',
  },
  {
    // Ogilvy — especificidade brutal
    badge: 'Programa de indicação',
    headline: () => 'Você pode ganhar 1h de consultoria financeira só por indicar um amigo.',
    body: ({ goal }) =>
      `Não é ponto fidelidade. Não é desconto em produto que você nunca vai usar. É uma hora com um profissional certificado — de graça — quando a gente bater ${goal.toLocaleString('pt-BR')} inscritos.`,
    cta: 'Participar agora →',
  },
  {
    // Sugarman — envolvimento + padrão quebrado
    badge: 'Você chegou até aqui',
    headline: () => 'Você claramente se importa com seu dinheiro.',
    body: ({ goal, prizeName }) =>
      `Seus amigos também deveriam. Manda o Endinheirados pra eles — e quando a gente bater ${goal.toLocaleString('pt-BR')} leitores, você concorre a ${prizeName} e a 1h com um planejador certificado.`,
    cta: 'Indicar agora →',
  },
  {
    // Hopkins — meta pública + prova concreta
    badge: 'Meta pública',
    headline: ({ goal, count, prizeName }) =>
      `Faltam ${(goal - count).toLocaleString('pt-BR')} inscritos. Prêmio: ${prizeName}.`,
    body: ({ goal }) =>
      `Quando a gente bater ${goal.toLocaleString('pt-BR')} leitores, o sorteio acontece. Você acelera indicando amigos — e concorre automaticamente. Simples assim.`,
    cta: 'Ver minha posição →',
  },
  {
    // Gary Halbert — inversão + medo de perder
    badge: 'Antes que você saia',
    headline: () => 'Seus amigos vão descobrir o Endinheirados de qualquer jeito.',
    body: () =>
      `A questão é: vai ser por você — e você concorre a 1h de consultoria financeira — ou vai ser por outra pessoa? Quem indica tem vantagem no sorteio. É simples assim.`,
    cta: 'Indicar antes que alguém me passe →',
  },
  {
    // Robert Collier — entrar na conversa já existente
    badge: 'Enquanto estamos nisso',
    headline: () => 'Tem gente pagando R$ 300/hora por exatamente isso.',
    body: ({ prizeName }) =>
      `Uma hora com um planejador financeiro certificado. Você pode ganhar de graça — e seus amigos entram na newsletter mais direta sobre dinheiro do Brasil. Sorteamos ${prizeName} também.`,
    cta: 'Ganhar minha consultoria →',
  },
  {
    // Dan Kennedy — direto, sem enrolação
    badge: 'Sem pegadinha',
    headline: () => 'Você não precisa comprar nada. Não precisa pagar nada.',
    body: ({ goal, prizeName }) =>
      `Só indicar um amigo. Quando bater ${goal.toLocaleString('pt-BR')} inscritos, sorteamos ${prizeName} entre todos — e quem mais indicou tem mais chances. Cada amigo que se inscrever pelo seu link conta.`,
    cta: 'Entrar no sorteio →',
  },
  {
    // Sugarman 2 — escorregador emocional
    badge: 'Você já fez a parte difícil',
    headline: () => 'Você leu. Aprendeu. Agora passa adiante.',
    body: ({ prizeName }) =>
      `Alguém em algum momento achou que finanças pessoais valiam atenção. Você concordou e chegou até aqui. Seus amigos merecem o mesmo. E você concorre a ${prizeName} e a 1h de consultoria por isso.`,
    cta: 'Compartilhar →',
  },
]

function pickVariant(seed?: string): Variant {
  if (!seed) return VARIANTS[Math.floor(Math.random() * VARIANTS.length)]
  // Determinístico via hash simples do slug para SSR/hidratação consistente
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return VARIANTS[h % VARIANTS.length]
}

export function ReferralInline({ seed }: { seed?: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [variant] = useState<Variant>(() => pickVariant(seed))

  useEffect(() => {
    Promise.all([
      fetch('/api/subscribers/count').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([countData, settings]) => {
      setData({
        count: countData.count ?? 0,
        goal: settings.subscriberGoal ?? 100,
        prizeName: settings.referralPrizeName ?? 'Psicologia Financeira',
      })
    }).catch(() => {})
  }, [])

  if (!data) return null

  return (
    <div className="my-8 border-l-4 border-green-500 bg-green-50 rounded-r-2xl px-5 py-5 not-prose">
      <p className="text-[11px] font-bold uppercase tracking-widest text-green-700 mb-2">
        {variant.badge}
      </p>
      <p className="text-base font-extrabold text-gray-900 leading-snug mb-2">
        {variant.headline(data)}
      </p>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {variant.body(data)}
      </p>
      <Link
        href="/indicar"
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
      >
        {variant.cta}
      </Link>
    </div>
  )
}
