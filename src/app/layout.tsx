import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Dinheiro Descomplicado', template: '%s | Dinheiro Descomplicado' },
  description: 'Finanças pessoais, investimentos, empréstimos e crédito explicados de forma simples.',
  metadataBase: new URL('https://dinheirodescomplicado.com.br'),
  openGraph: { siteName: 'Dinheiro Descomplicado', locale: 'pt_BR', type: 'website' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-green-700">💰 Dinheiro Descomplicado</a>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <a href="/blog" className="hover:text-green-700">Blog</a>
          <a href="/categoria/emprestimo" className="hover:text-green-700">Empréstimo</a>
          <a href="/categoria/investimentos" className="hover:text-green-700">Investimentos</a>
          <a href="/categoria/cartao-de-credito" className="hover:text-green-700">Cartão</a>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Dinheiro Descomplicado · Conteúdo informativo, não é consultoria financeira.</p>
        <p className="mt-1">
          <a href="/privacidade" className="hover:underline">Política de Privacidade</a>
          {' · '}
          <a href="/termos" className="hover:underline">Termos de Uso</a>
        </p>
      </div>
    </footer>
  )
}
