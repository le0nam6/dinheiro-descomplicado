import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { CustomCursor } from '@/components/CustomCursor'
import { Newsletter } from '@/components/Newsletter'
import { QuotesTicker } from '@/components/QuotesTicker'
import { ThemeToggle } from '@/components/ThemeToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Endinheirados', template: '%s | Endinheirados' },
  description: 'Aprenda a ganhar dinheiro e garantir que ele nunca acabe. Investimentos, renda extra, independência financeira e muito mais.',
  metadataBase: new URL('https://endinheirados.cc'),
  openGraph: { siteName: 'Endinheirados', locale: 'pt_BR', type: 'website' },
  robots: { index: true, follow: true },
  verification: { google: 'anSq3ftdvYVOnIJvtePaBPVD6sbcmn7GosnaisjOmcY' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Tema: aplica dark antes do paint p/ evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()` }} />
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
        {/* Google AdSense — só carrega quando houver Publisher ID real */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID?.startsWith('ca-pub-') && !process.env.NEXT_PUBLIC_ADSENSE_ID.includes('SEU_ID') && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <CustomCursor />
        <QuotesTicker />
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
      <div className="max-w-4xl mx-auto px-4 pt-1 pb-0 flex justify-center overflow-hidden">
        <a href="/">
          <img
            src="/logo-endinheirados.png"
            alt="Endinheirados"
            className="w-auto object-contain"
            style={{ height: 'clamp(80px, 10vw, 120px)', marginTop: '-8%', marginBottom: '-8%' }}
          />
        </a>
      </div>
      {/* Nav como submenu centralizado */}
      <nav className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-1 flex-wrap">
          <a href="/blog" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Blog</a>
          <a href="/mercado" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">📊 Mercado</a>
          <a href="/categoria/emprestimo" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Empréstimo</a>
          <a href="/categoria/investimentos" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Investimentos</a>
          <a href="/categoria/cartao-de-credito" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Cartão</a>
          <a href="/categoria/educacao-financeira" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Educação Financeira</a>
          <a href="/ferramentas" className="px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">🧰 Ferramentas</a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-2 text-center">
        <p className="text-lg font-bold text-gray-900 mb-1">Fique por dentro do seu dinheiro 💰</p>
        <p className="text-sm text-gray-500 mb-4">Receba as melhores dicas de finanças e oportunidades direto no seu e-mail, sem enrolação.</p>
        <Newsletter />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500 border-t border-gray-200 mt-8">
        <p className="max-w-xl mx-auto text-xs text-gray-400 mb-4">
          ⚠️ O conteúdo do Endinheirados é informativo e educacional, não constitui recomendação ou consultoria financeira. Consulte um profissional certificado antes de investir.
        </p>
        <p>© {new Date().getFullYear()} Endinheirados · Finanças sem complicação.</p>
        <p className="mt-1">
          <a href="/sobre" className="hover:underline">Sobre</a>
          {' · '}
          <a href="/contato" className="hover:underline">Contato</a>
          {' · '}
          <a href="/etica" className="hover:underline">Política Editorial</a>
          {' · '}
          <a href="/privacidade" className="hover:underline">Política de Privacidade</a>
          {' · '}
          <a href="/termos" className="hover:underline">Termos de Uso</a>
        </p>
      </div>
    </footer>
  )
}
