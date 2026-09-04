/**
 * Ícones da interface. Um símbolo por significado.
 *
 * Antes conviviam cinco glifos diferentes para a mesma ideia de "certo" e
 * "errado" — ✓ ✅ ✗ ❌ ✕ — mais o IconCheck do Tabler. Emoji muda de desenho
 * em cada sistema operacional, não herda a cor do texto e é anunciado pelo
 * leitor de tela como "marca de seleção pesada", que não é o que a frase quer
 * dizer. Estes SVGs herdam currentColor e são sempre iguais.
 *
 * Decorativos por padrão (aria-hidden). Quando o ícone for a única informação,
 * passe um label: <Check label="incluído no plano" />.
 */
type Props = { className?: string; label?: string }

function svgProps({ className = 'w-4 h-4', label }: Props) {
  return {
    className,
    viewBox: '0 0 20 20',
    fill: 'none',
    ...(label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const }),
  }
}

const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function Check(p: Props) {
  return <svg {...svgProps(p)}><path d="M4 10.5 8 14.5 16 5.5" {...stroke} /></svg>
}

export function Close(p: Props) {
  return <svg {...svgProps(p)}><path d="M5 5l10 10M15 5L5 15" {...stroke} /></svg>
}

export function ArrowUp(p: Props) {
  return <svg {...svgProps(p)}><path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" {...stroke} /></svg>
}

export function ArrowDown(p: Props) {
  return <svg {...svgProps(p)}><path d="M10 4v12M4.5 10.5 10 16l5.5-5.5" {...stroke} /></svg>
}

export function ArrowRight(p: Props) {
  return <svg {...svgProps(p)}><path d="M4 10h12M11 5l5 5-5 5" {...stroke} /></svg>
}

export function Alert(p: Props) {
  return <svg {...svgProps(p)}><path d="M10 3.5 2.5 16.5h15L10 3.5zM10 8v3.5" {...stroke} /><circle cx="10" cy="14" r="1" fill="currentColor" /></svg>
}

/**
 * Item de lista com marcador. Substitui o padrão <li>✓ texto</li>, que
 * dependia do emoji para dar sentido e não alinhava em texto de duas linhas.
 */
export function CheckItem({
  children,
  tone = 'inherit',
}: {
  children: React.ReactNode
  /** 'inherit' segue a cor do painel em volta; use ok/no só fora de contexto colorido. */
  tone?: 'inherit' | 'ok' | 'no' | 'next'
}) {
  const Glyph = tone === 'no' ? Close : tone === 'next' ? ArrowRight : Check
  const cor = tone === 'ok' ? 'text-green-600' : tone === 'no' ? 'text-red-700' : ''
  return (
    <li className="flex gap-2.5 items-start">
      <Glyph className={`w-4 h-4 shrink-0 mt-0.5 opacity-80 ${cor}`} />
      <span className="min-w-0">{children}</span>
    </li>
  )
}

/**
 * Traduz um emoji vindo de dado salvo (ex.: settings.referralMilestones) para o
 * ícone equivalente. Os níveis do sorteio são configurados no painel e ficam
 * gravados como emoji, então não dá para trocá-los editando markup — a troca
 * acontece aqui, na renderização. Emoji sem correspondência cai no próprio
 * emoji, para nunca sumir da tela.
 */
import {
  IconSeeding, IconChartBar, IconBriefcase, IconTrophy, IconCrown, IconCoins,
  IconStar, IconRocket, IconMedal,
} from '@tabler/icons-react'

const DE_EMOJI: Record<string, typeof IconStar> = {
  '🌱': IconSeeding, '📊': IconChartBar, '💼': IconBriefcase, '🏆': IconTrophy,
  '👑': IconCrown, '💰': IconCoins, '⭐': IconStar, '🚀': IconRocket, '🥇': IconMedal,
}

export function EmojiIcon({ emoji, size = 16 }: { emoji?: string; size?: number }) {
  const C = emoji ? DE_EMOJI[emoji.trim()] : undefined
  if (!C) return <span className="text-base leading-none">{emoji}</span>
  return <C size={size} stroke={1.9} aria-hidden />
}
