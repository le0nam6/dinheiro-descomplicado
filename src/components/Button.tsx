/**
 * Botão único do sistema. Substitui as 22 variantes de classe que existiam
 * espalhadas pelos componentes, com 11 combinações diferentes de padding.
 *
 * A regra da direção B está travada aqui: a ação primária é ÂMBAR, nunca
 * verde. O verde é a marca e o sinal de alta do mercado ao mesmo tempo, e
 * usá-lo em botão fazia o leitor parar para decidir se aquilo era um clique
 * ou um dado. Por isso não existe variante verde preenchida.
 *
 * O âmbar também sempre vem com tinta escura: com texto branco o contraste
 * cai para 2.17:1 e reprova em AA. Com a tinta escura fica em 7.92:1.
 */
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  // Ação principal da tela. Só uma por vista.
  primary: 'bg-action text-action-ink hover:bg-action-hover shadow-sm',
  // Ação secundária: contorno, sem preenchimento.
  secondary: 'bg-white text-gray-900 border border-gray-200 hover:border-green-600 hover:text-green-700',
  // Ação terciária e navegação. Aqui o verde pode aparecer, porque é texto
  // com sublinhado no hover — lê como link, não como alvo preenchido.
  ghost: 'text-green-700 hover:text-green-800 hover:underline underline-offset-4',
}

// Padding em múltiplos de 4. min-h garante o alvo de toque de 44px que a
// WCAG 2.5.8 pede, exceto no tamanho compacto, que é para uso em linha.
const SIZE: Record<Size, string> = {
  sm: 'text-xs px-3 py-2 gap-1.5 rounded-ui',
  md: 'text-sm px-4 py-3 gap-2 rounded-ui min-h-11',
  lg: 'text-base px-6 py-3.5 gap-2 rounded-card min-h-12',
}

const BASE =
  'inline-flex items-center justify-center font-semibold leading-none ' +
  'transition-colors disabled:opacity-40 disabled:pointer-events-none ' +
  'whitespace-nowrap [&_svg]:shrink-0'

type Common = {
  variant?: Variant
  size?: Size
  full?: boolean
  children: ReactNode
  className?: string
}

function classes({ variant = 'primary', size = 'md', full, className = '' }: Common) {
  return [BASE, VARIANT[variant], SIZE[size], full ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ')
}

export function Button({
  variant, size, full, children, className, ...rest
}: Common & Omit<ComponentProps<'button'>, keyof Common>) {
  return (
    <button className={classes({ variant, size, full, children, className })} {...rest}>
      {children}
    </button>
  )
}

/** Mesma aparência do Button, mas navega. Use quando o destino é uma URL. */
export function ButtonLink({
  variant, size, full, children, className, href, ...rest
}: Common & { href: string } & Omit<ComponentProps<typeof Link>, keyof Common | 'href'>) {
  return (
    <Link href={href} className={classes({ variant, size, full, children, className })} {...rest}>
      {children}
    </Link>
  )
}
