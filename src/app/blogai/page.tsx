import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'

const ibm = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'BlogAI — Blog automatizado com inteligência artificial',
  description: 'Construa um blog que pesquisa, escreve e publica conteúdo automaticamente. Você aprova em 30 segundos pelo celular.',
  robots: { index: false, follow: false },
}

const W  = '#280000'
const WG = 'linear-gradient(135deg, #560303 0%, #1a0000 100%)'
const BK = '#0a0a0a'

export default function BlogAIPage() {
  return (
    <div className={ibm.className} style={{ fontFamily: "'IBM Plex Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ background: WG, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem 2.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '.04em' }}>Automação editorial</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '.04em' }}>com inteligência artificial</span>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', letterSpacing: '.02em' }}>Bem-vindo ao</p>
          <h1 style={{ fontSize: 'clamp(96px, 18vw, 200px)', fontWeight: 700, letterSpacing: '-6px', lineHeight: .9, color: '#fff', margin: 0 }}>
            Blog<span style={{ color: 'rgba(255,255,255,0.25)' }}>AI</span>
          </h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.65)', maxWidth: 380, lineHeight: 1.55, margin: 0 }}>
            Seu blog pesquisa, escreve e publica conteúdo relevante automaticamente. Você aprova em segundos pelo celular.
          </p>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>entrega em 6 semanas</span>
        </div>
      </section>

      {/* ── STATEMENT — AUTOMATIZE ───────────────────────────────────── */}
      <section style={{ background: WG, padding: '6rem 2.5rem', overflow: 'hidden' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          Nossa missão é simples
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 'clamp(96px, 20vw, 240px)', fontWeight: 700, letterSpacing: '-8px', lineHeight: .85, color: '#fff', margin: 0 }}>
            RANQUEAR
          </h2>
          <div style={{ paddingBottom: '1rem' }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 260 }}>
              01 — o seu conteúdo<br />
              02 — no Google<br />
              03 — todo dia<br />
              04 — sem equipe
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '4rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#e5e5e5' }}>
          {[
            { val: '~R$ 2', label: 'custo de IA por artigo' },
            { val: '30 seg', label: 'para aprovar e publicar' },
            { val: '6 sem', label: 'do contrato ao blog no ar' },
            { val: '24/7', label: 'produzindo conteúdo' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', padding: '2rem 1.5rem' }}>
              <strong style={{ display: 'block', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: W, letterSpacing: '-2px', lineHeight: 1, marginBottom: '.5rem' }}>{s.val}</strong>
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: 1.4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA ─────────────────────────────────────────────────── */}
      <section style={{ background: BK, padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>para que tipo de empresa o BlogAI foi desenhado?</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#fff', lineHeight: 1.25, marginBottom: '3rem', letterSpacing: '-1px' }}>
            Para quem já tentou manter um blog ativo<br />
            e sabe como é <strong>frustrante</strong>.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '📲', title: 'Redator que não entende o negócio', desc: 'Passa briefing, recebe texto sobre outra coisa. Repete toda semana.' },
              { icon: '🔄', title: '3 rodadas de revisão por artigo', desc: 'Cada ciclo custa tempo do gestor — tempo que não volta.' },
              { icon: '💸', title: 'Head de marketing em reunião', desc: 'Coordenação de conteúdo vira overhead. O gestor vira revisor de texto.' },
              { icon: '📅', title: 'Blog parado = Google ignora', desc: 'Consistência é o único jeito de ranquear. Sem time, o blog para.' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem' }}>
                <div style={{ fontSize: 22, marginBottom: '.75rem' }}>{c.icon}</div>
                <strong style={{ display: 'block', color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: 500, marginBottom: 6, lineHeight: 1.3 }}>{c.title}</strong>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANTES vs DEPOIS ──────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>comparativo</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#0a0a0a', lineHeight: 1.2, marginBottom: '2.5rem', letterSpacing: '-1px' }}>
            Validação de conteúdo hoje<br />vs. com <strong>BlogAI</strong>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* ANTES */}
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 16, padding: '1.75rem' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#b91c1c', marginBottom: '1.5rem' }}>⚠ Processo atual</p>
              {[
                'Brief enviado pelo WhatsApp às 23h',
                'Redator interpreta diferente',
                'Escreve sobre o tema errado',
                'Entrega 5 dias depois',
                'Gestor: "Não era isso, refaz"',
                '2ª rodada de revisão',
                '3ª rodada de revisão',
                'Post publicado sem dados atuais',
                'Resultado: 0 visitas orgânicas',
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#1c1c1c', lineHeight: 1.4 }}>{s}</span>
                  </div>
                  {i < 8 && <div style={{ width: 1, height: 8, background: '#fca5a5', marginLeft: 2, marginTop: 2, marginBottom: 2 }} />}
                </div>
              ))}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #fca5a5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['12–15 dias', 'por artigo'], ['3+ revisões', 'por ciclo'], ['5 pessoas', 'envolvidas'], ['R$ 800+', 'por artigo']].map(([v, l], i) => (
                  <div key={i}>
                    <strong style={{ display: 'block', fontSize: 18, fontWeight: 700, color: '#b91c1c', letterSpacing: '-.5px' }}>{v}</strong>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* DEPOIS */}
            <div style={{ background: '#f0fff4', border: '1px solid #86efac', borderRadius: 16, padding: '1.75rem' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#15803d', marginBottom: '1.5rem' }}>✓ Com BlogAI</p>
              {[
                'IA monitora o que está em alta',
                'Busca dados reais em APIs oficiais',
                'Escreve com a voz do seu negócio',
                'Telegram: "Quer publicar?"',
                'Um toque → publicado',
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#1c1c1c', lineHeight: 1.4 }}>{s}</span>
                  </div>
                  {i < 4 && <div style={{ width: 1, height: 8, background: '#86efac', marginLeft: 2, marginTop: 2, marginBottom: 2 }} />}
                </div>
              ))}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #86efac', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['30 seg', 'de aprovação'], ['0 revisões', 'necessárias'], ['só você', 'envolvido'], ['~R$ 2', 'custo de IA']].map(([v, l], i) => (
                  <div key={i}>
                    <strong style={{ display: 'block', fontSize: 18, fontWeight: 700, color: '#15803d', letterSpacing: '-.5px' }}>{v}</strong>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────── */}
      <section style={{ background: WG, padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>como funciona</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '3rem', letterSpacing: '-1px' }}>
            Da pesquisa à publicação,<br />com <strong>você no controle</strong>.
          </h2>
          {[
            { n: '01', title: 'IA monitora o que está em alta', desc: 'O sistema busca automaticamente dados reais de APIs oficiais (BACEN, IBGE, B3), feeds especializados e tendências — sempre com fontes verificáveis.' },
            { n: '02', title: 'Escreve o rascunho com a voz do seu negócio', desc: 'O modelo é treinado com o tom editorial do seu nicho. Cada artigo tem ângulo único, dados citados e estrutura que converte.' },
            { n: '03', title: 'Você aprova em 30 segundos pelo Telegram', desc: 'Recebe notificação com título, resumo e prévia. Um toque publica. Outro descarta. Menos de meio minuto.' },
            { n: '04', title: 'Publicação automática com SEO completo', desc: 'Schema markup, meta tags, links internos, imagem de capa. O Google indexa e o tráfego orgânico cresce enquanto você faz outra coisa.' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, padding: '1.75rem 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{step.n}</div>
              <div>
                <strong style={{ display: 'block', color: 'rgba(255,255,255,0.92)', fontSize: 16, fontWeight: 500, marginBottom: 6, lineHeight: 1.3 }}>{step.title}</strong>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── O QUE INCLUI ─────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>entregáveis</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#0a0a0a', lineHeight: 1.2, marginBottom: '2.5rem', letterSpacing: '-1px' }}>
            Tudo que você precisa para<br />publicar no <strong>piloto automático</strong>.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              'Blog completo (Next.js + CMS visual)',
              'Sistema de automação de conteúdo com IA',
              'Integração com até 5 fontes de dados do nicho',
              'Aprovação de rascunhos via Telegram',
              'SEO técnico completo (schema, sitemap, robots)',
              'Newsletter integrada com automação de envio',
              'Painel admin para edições manuais',
              '30 dias de suporte pós-entrega incluídos',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '1rem', background: '#f8f8f8', borderRadius: 12 }}>
                <span style={{ color: W, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 13, color: '#0a0a0a', lineHeight: 1.45 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRONOGRAMA ───────────────────────────────────────────────── */}
      <section style={{ background: BK, padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>cronograma</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '3rem', letterSpacing: '-1px' }}>
            Do contrato ao blog no ar:<br /><strong>6 semanas</strong>.
          </h2>
          {[
            { weeks: 'semanas 1–2', title: 'Briefing, estratégia editorial e setup técnico', desc: 'Nicho, persona, pilares de conteúdo, tom de voz. Configuração de infraestrutura, domínio e hospedagem.' },
            { weeks: 'semanas 3–4', title: 'Desenvolvimento das automações e integrações', desc: 'Conexão com fontes de dados, configuração do modelo de IA com o seu tom editorial, testes das rotinas.' },
            { weeks: 'semana 5', title: 'Primeiros conteúdos, testes e ajustes finos', desc: 'Geração dos primeiros 10 artigos para validação com você. Ajustes no tom, fontes e fluxo de aprovação.' },
            { weeks: 'semana 6', title: 'Entrega, treinamento e go live', desc: 'Blog publicado, rotinas ativas. Sessão de 1h para você operar o painel e o fluxo de aprovação.' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, padding: '1.75rem 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ minWidth: 96, paddingTop: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t.weeks}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: 500, marginBottom: 5 }}>{t.title}</strong>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANCORAGEM CLT ────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>custo real</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#0a0a0a', lineHeight: 1.2, marginBottom: '.75rem', letterSpacing: '-1px' }}>
            Você já está pagando por isso.<br /><strong>Só que em salários.</strong>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.5)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Para produzir conteúdo com qualidade, consistência e dados reais, uma empresa normalmente precisa de:
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                {['Função', 'Salário', '+ Encargos CLT (~70%)', 'Total/mês'].map((h, i) => (
                  <th key={i} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.35)', textAlign: i === 0 ? 'left' : 'right', padding: '.5rem 0', borderBottom: '1px solid #e5e5e5', paddingRight: i < 3 ? 16 : 0, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Redator', 'R$ 2.500', 'R$ 1.750', 'R$ 4.250'],
                ['Head de marketing', 'R$ 8.000', 'R$ 5.600', 'R$ 13.600'],
                ['Gestor de projetos', 'R$ 5.000', 'R$ 3.500', 'R$ 8.500'],
                ['Tempo de gestão/validação', '—', '—', 'R$ 3.000'],
              ].map(([func, sal, enc, total], i) => (
                <tr key={i}>
                  <td style={{ fontSize: 14, color: '#0a0a0a', padding: '.875rem 16px .875rem 0', borderBottom: '1px solid #f0f0f0' }}>{func}</td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', textAlign: 'right', padding: '.875rem 16px .875rem 0', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>{sal}</td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', textAlign: 'right', padding: '.875rem 16px .875rem 0', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>{enc}</td>
                  <td style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', textAlign: 'right', padding: '.875rem 0', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>{total}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ fontSize: 15, fontWeight: 700, color: '#b91c1c', paddingTop: '1.25rem', paddingBottom: '.25rem' }}>Total da equipe de conteúdo</td>
                <td style={{ fontSize: 22, fontWeight: 700, color: '#b91c1c', textAlign: 'right', paddingTop: '1.25rem', paddingBottom: '.25rem', whiteSpace: 'nowrap' }}>R$ 29.350/mês</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ fontSize: 15, fontWeight: 700, color: '#15803d', paddingBottom: '1rem' }}>BlogAI (parcelado + manutenção)</td>
                <td style={{ fontSize: 22, fontWeight: 700, color: '#15803d', textAlign: 'right', paddingBottom: '1rem', whiteSpace: 'nowrap' }}>R$ 2.467/mês</td>
              </tr>
            </tbody>
          </table>
          <div style={{ background: '#f0fff4', border: '1px solid #86efac', borderRadius: 12, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>Economia mensal com BlogAI</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#15803d', letterSpacing: '-1px' }}>R$ 26.883/mês</span>
          </div>
        </div>
      </section>

      {/* ── PREÇO ────────────────────────────────────────────────────── */}
      <section style={{ background: '#1a0000', padding: '5rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>investimento</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '.75rem', letterSpacing: '-1px' }}>
            Menos do que um único<br /><strong>colaborador CLT</strong>.
          </h2>
          {/* Ancoragem R$ 25k */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>de</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through', letterSpacing: '-.5px' }}>R$ 25.000</span>
          </div>

          {/* 12x — VERDE destaque */}
          <div style={{ background: '#052e16', border: '1.5px solid #16a34a', borderRadius: 16, padding: '2rem', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '1.25rem' }}>condição exclusiva</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 'clamp(56px, 12vw, 96px)', fontWeight: 700, color: '#4ade80', letterSpacing: '-4px', lineHeight: 1 }}>R$ 1.667</span>
              <span style={{ fontSize: 18, color: '#86efac', fontWeight: 400 }}>/mês</span>
            </div>
            <p style={{ fontSize: 14, color: '#86efac', margin: 0 }}>12 parcelas · total R$ 20.000</p>
          </div>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '.06em' }}>OU</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* À vista — VERDE */}
          <div style={{ background: 'rgba(5,46,22,.5)', border: '1px solid #16a34a', borderRadius: 16, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '.5rem' }}>oferta única — à vista</p>
              <span style={{ fontSize: 'clamp(36px, 7vw, 56px)', fontWeight: 700, color: '#4ade80', letterSpacing: '-2px', lineHeight: 1 }}>R$ 20.000</span>
              <p style={{ fontSize: 12, color: '#86efac', marginTop: 4 }}>pagamento único · economize R$ 5.000</p>
            </div>
            <div style={{ background: 'rgba(74,222,128,.1)', border: '1px solid #4ade80', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#4ade80' }}>−20%</div>
          </div>

          {/* Manutenção — AMARELO */}
          <div style={{ background: '#422006', border: '1px solid #d97706', borderRadius: 16, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '2rem' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fbbf24', marginBottom: '.5rem' }}>manutenção mensal</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#fbbf24', letterSpacing: '-1.5px', lineHeight: 1 }}>R$ 800</span>
                <span style={{ fontSize: 14, color: '#fde68a', fontWeight: 400 }}>/mês</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#fde68a', maxWidth: 260, lineHeight: 1.5, margin: 0 }}>
              Monitoramento das automações, atualização do modelo de IA, suporte técnico e ajustes editoriais.
            </p>
          </div>

          {/* CTA amarelo */}
          <a href="https://wa.me/5511999999999?text=Quero+saber+mais+sobre+o+BlogAI" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fbbf24', color: '#1a0000', fontSize: 15, fontWeight: 700, padding: '1.125rem 2rem', borderRadius: 10, textDecoration: 'none', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Quero meu BlogAI ↗
          </a>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section style={{ background: WG, padding: '6rem 2.5rem 5rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(56px, 12vw, 140px)', fontWeight: 700, letterSpacing: '-5px', lineHeight: .9, color: '#fff', margin: '0 0 1.5rem' }}>
            Pronto para<br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>parar de revisar texto?</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 400, lineHeight: 1.6 }}>
            Vagas limitadas. Entrega em 6 semanas após contrato assinado. Resposta em até 24h úteis.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginTop: '3rem' }}>
          <a href="https://wa.me/5511999999999?text=Quero+saber+mais+sobre+o+BlogAI" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fbbf24', color: '#1a0000', fontSize: 15, fontWeight: 700, padding: '1.125rem 2rem', borderRadius: 10, textDecoration: 'none', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Quero meu BlogAI ↗
          </a>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>BlogAI · automação editorial com IA</span>
        </div>
      </section>

    </div>
  )
}
