import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Endinheirados', template: '%s | Endinheirados' },
  description: 'Aprenda a ganhar dinheiro e garantir que ele nunca acabe. Investimentos, renda extra, independência financeira e muito mais.',
  metadataBase: new URL('https://endinheirados.vercel.app'),
  openGraph: { siteName: 'Endinheirados', locale: 'pt_BR', type: 'website' },
  robots: { index: true, follow: true },
  verification: { google: 'google9c81f0b4386d1467' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C1TGQHVY23"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-C1TGQHVY23');
        `}</Script>
        {/* Google AdSense */}
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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Logo centralizada */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2 flex justify-center">
        <a href="/">
          <img
            src="/logo-endinheirados.png"
            alt="Endinheirados"
            className="h-20 md:h-24 w-auto object-contain"
          />
        </a>
      </div>
      {/* Nav como submenu centralizado */}
      <nav className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-1 flex-wrap">
          <a href="/blog" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Blog</a>
          <a href="/categoria/emprestimo" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Empréstimo</a>
          <a href="/categoria/investimentos" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Investimentos</a>
          <a href="/categoria/cartao-de-credito" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Cartão</a>
          <a href="/categoria/educacao-financeira" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Educação</a>
          <a href="/calculadora" className="px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">📊 Calculadora</a>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Endinheirados · Conteúdo informativo, não é consultoria financeira.</p>
        <p className="mt-1">
          <a href="/privacidade" className="hover:underline">Política de Privacidade</a>
          {' · '}
          <a href="/termos" className="hover:underline">Termos de Uso</a>
        </p>
      </div>
    </footer>
  )
}
