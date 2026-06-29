import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { CustomCursor } from '@/components/CustomCursor'
import { Newsletter } from '@/components/Newsletter'
import { QuotesTicker } from '@/components/QuotesTicker'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ExitIntentPopup } from '@/components/ExitIntentPopup'
import { SubscriberMilestone } from '@/components/SubscriberMilestone'
import { ReferralBanner } from '@/components/ReferralBanner'
import { SubscriberGoalBadge } from '@/components/SubscriberGoalBadge'
import { IconTool, IconNews } from '@tabler/icons-react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Endinheirados', template: '%s | Endinheirados' },
  description: 'Aprenda a ganhar dinheiro e garantir que ele nunca acabe. Investimentos, renda extra, independência financeira e muito mais.',
  metadataBase: new URL('https://endinheirados.cc'),
  alternates: { canonical: 'https://endinheirados.cc' },
  openGraph: { siteName: 'Endinheirados', locale: 'pt_BR', type: 'website' },
  robots: { index: true, follow: true },
  verification: { google: 'j8L6BZiAKRU9noO_zNgiSlrxfT45Mefj5t76wUrd-_Q' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Tema: aplica dark antes do paint p/ evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />

        {/* Ezoic — Privacy (deve vir ANTES do header script) */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />

        {/* Ezoic — Header Script */}
        <Script src="//www.ezojs.com/ezoic/sa.min.js" strategy="beforeInteractive" />
        <Script id="ezoic-init" strategy="beforeInteractive">{`
          window.ezstandalone = window.ezstandalone || {};
          ezstandalone.cmd = ezstandalone.cmd || [];
        `}</Script>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="//ezoicanalytics.com/analytics.js" />

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
      </head>
      <body className={inter.className}>
        <CustomCursor />
        <ExitIntentPopup />
        <QuotesTicker />
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Mobile: logo à esquerda + controles à direita | Desktop: logo centralizada */}
      <div className="max-w-4xl mx-auto px-4 pt-1 pb-0 flex items-center sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* Logo — esquerda no mobile, centro no desktop */}
        <a href="/" className="shrink-0 sm:flex sm:justify-center">
          <img
            src="/logo-endinheirados.webp"
            alt="Endinheirados"
            width={240}
            height={160}
            className="w-auto object-contain"
            style={{ height: 'clamp(48px, 7vw, 88px)', marginTop: '-5%', marginBottom: '-5%' }}
          />
        </a>

        {/* Desktop: espaço fantasma à esquerda p/ equilibrar */}
        <div className="hidden sm:flex items-center gap-2 opacity-0 pointer-events-none overflow-hidden min-w-0 order-first">
          <SubscriberGoalBadge />
          <ThemeToggle />
        </div>

        {/* Controles — sempre à direita */}
        <div className="ml-auto sm:ml-0 flex items-center justify-end gap-2 min-w-0">
          <div className="hidden sm:block"><SubscriberGoalBadge /></div>
          <ThemeToggle />
        </div>
      </div>

      {/* Nav: scroll horizontal no mobile sem vazar */}
      <nav className="border-t border-gray-100 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-4 py-2.5 flex items-center gap-1 w-max sm:w-auto sm:max-w-4xl sm:mx-auto sm:justify-center">
          <a href="/edicao" className="inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"><IconNews size={16} stroke={1.75} /> Edições</a>
          <a href="/cotacoes" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Cotações</a>
          <a href="/categoria/noticias" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Notícias</a>
          <a href="/blog" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Blog</a>
          <a href="/categoria/educacao-financeira" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Educação Financeira</a>
          <a href="/categoria/ganhar-dinheiro" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Ganhe Dinheiro</a>
          <a href="/categoria/investimentos" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Investimentos</a>
          <a href="/ferramentas" className="inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"><IconTool size={16} stroke={1.75} /> Ferramentas</a>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div id="newsletter" className="max-w-2xl mx-auto px-4 pt-10 pb-2 text-center scroll-mt-24">
        <p className="text-lg font-bold text-gray-900 mb-1">O melhor portal de finanças da nova geração 💰</p>
        <p className="text-sm text-gray-500 mb-4">Receba as principais notícias do mercado financeiro todo dia às 5h — direto no seu e-mail, sem enrolação.</p>
        <Newsletter />
        <div className="mt-6 max-w-lg mx-auto">
          <ReferralBanner />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Já inscrito?{' '}
          <a href="/painel" className="text-green-600 hover:underline">Acessar meu painel de indicações</a>
        </p>
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
