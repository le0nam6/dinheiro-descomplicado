import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { CustomCursor } from '@/components/CustomCursor'
import { Newsletter } from '@/components/Newsletter'
import { QuotesTicker } from '@/components/QuotesTicker'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ExitIntentPopup } from '@/components/ExitIntentPopup'
import { SubscriberMilestone } from '@/components/SubscriberMilestone'
import { SubscriberGoalBadge } from '@/components/SubscriberGoalBadge'
import { IconChartLine, IconTool } from '@tabler/icons-react'
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
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
        {/* Google AdSense — tag <script> literal no <head> (necessário p/ o verificador do AdSense ler no HTML cru) */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID?.startsWith('ca-pub-') && !process.env.NEXT_PUBLIC_ADSENSE_ID.includes('SEU_ID') && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
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
      {/* Logo row: espaço livre | logo | [meta badge + toggle] */}
      <div className="max-w-4xl mx-auto px-4 pt-1 pb-0 flex items-center overflow-hidden">
        {/* Espaço à esquerda (espelha o lado direito) */}
        <div className="flex-1 flex items-center gap-2 invisible">
          <SubscriberGoalBadge />
          <ThemeToggle />
        </div>

        {/* Logo centralizada */}
        <a href="/" className="shrink-0">
          <img
            src="/logo-endinheirados.webp"
            alt="Endinheirados"
            width={240}
            height={160}
            className="w-auto object-contain"
            style={{ height: 'clamp(64px, 8vw, 96px)', marginTop: '-6%', marginBottom: '-6%' }}
          />
        </a>

        {/* Lado direito: meta de inscritos + toggle de tema */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <SubscriberGoalBadge />
          <ThemeToggle />
        </div>
      </div>

      {/* Nav como submenu */}
      <nav className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-start sm:justify-center gap-1.5 flex-nowrap overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <a href="/mercado" className="inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"><IconChartLine size={16} stroke={1.75} /> Mercado</a>
          <a href="/blog" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Blog</a>
          <a href="/categoria/ganhar-dinheiro" className="shrink-0 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 rounded-lg transition-colors">Ganhar Dinheiro</a>
          <a href="/categoria/investimentos" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Investimentos</a>
          <a href="/categoria/educacao-financeira" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Educação Financeira</a>
          <a href="/categoria/cartao-de-credito" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Cartão</a>
          <a href="/categoria/emprestimo" className="shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">Empréstimo</a>
          <a href="/ferramentas" className="inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"><IconTool size={16} stroke={1.75} /> Ferramentas</a>
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
        <p className="text-sm text-gray-500 mb-4">Receba as principais notícias do mercado financeiro todo dia às 6h — direto no seu e-mail, sem enrolação.</p>
        <Newsletter />
        <div className="mt-6 max-w-md mx-auto">
          <SubscriberMilestone />
        </div>
        <p className="mt-4 text-xs text-gray-400">
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
