import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'

const ibm = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BlogAI — Blog automatizado com inteligência artificial',
  description:
    'Construa um blog que pesquisa, escreve e publica conteúdo automaticamente. Você aprova em 30 segundos pelo celular.',
  robots: { index: false, follow: false },
}

/* ─── helpers de cor / layout ──────────────────────────────────────────── */
const W = '#280000' // wine
const B = '#0a0a0a' // black
const S = { fontFamily: "'IBM Plex Sans', sans-serif" }

export default function BlogAIPage() {
  return (
    <div style={S} className={ibm.className}>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ background: W, padding: '5rem 2rem 4rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.08)', borderRadius: 20,
            padding: '4px 14px', marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
              automação editorial com IA
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(72px, 14vw, 120px)', fontWeight: 700,
            letterSpacing: '-4px', lineHeight: 1, color: '#fff',
            marginBottom: '1.25rem',
          }}>
            Blog<span style={{ color: 'rgba(255,255,255,0.35)' }}>AI</span>
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 3vw, 22px)', color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.5, maxWidth: 500,
          }}>
            Conteúdo que aparece no Google.<br />
            Sem equipe. Sem reunião. Sem dor de cabeça.
          </p>
        </div>
      </section>

      {/* ── O PROBLEMA ────────────────────────────────────────────────── */}
      <section style={{ background: B, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '.75rem' }}>o problema</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-1px' }}>
            Manter um blog ativo<br />é inviável sem uma equipe
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '⏳', title: 'Redator que não entende o negócio', desc: 'Passa briefing no WhatsApp, recebe um texto sobre outra coisa. Repete toda semana.' },
              { icon: '🔄', title: '3+ rodadas de revisão por artigo', desc: 'Cada ciclo custa tempo do gestor. Tempo que não volta e que sai da operação.' },
              { icon: '📅', title: 'Blog parado = Google ignora', desc: 'Consistência é o único jeito de ranquear. Sem time dedicado, o blog para.' },
              { icon: '💸', title: 'Head de marketing com mais reunião do que resultado', desc: 'Coordenação de conteúdo vira overhead. O gestor vira revisor de texto.' },
            ].map((c, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '1.25rem',
              }}>
                <div style={{ fontSize: 20, marginBottom: '.5rem' }}>{c.icon}</div>
                <strong style={{ display: 'block', color: '#fff', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.title}</strong>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANTES vs DEPOIS ──────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: '.75rem' }}>comparativo</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-1px' }}>
            Validação de conteúdo hoje<br />vs. com BlogAI
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* ANTES */}
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 16, padding: '1.5rem' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#b91c1c', marginBottom: '1.25rem' }}>⚠ Processo atual</p>
              {[
                { icon: '📲', label: 'Brief enviado pelo WhatsApp às 23h' },
                { icon: '❓', label: 'Redator interpreta diferente do esperado' },
                { icon: '✍️', label: 'Escreve sobre o tema errado' },
                { icon: '📧', label: 'Envia 5 dias depois' },
                { icon: '🔴', label: 'Gestor: "Não era bem isso, refaz"' },
                { icon: '🔄', label: '2ª rodada de revisão' },
                { icon: '🔄', label: '3ª rodada de revisão' },
                { icon: '📄', label: 'Post publicado — sem dados atuais' },
                { icon: '📉', label: 'Resultado: 0 visitas orgânicas' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: '#fecaca', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, flexShrink: 0,
                    }}>{s.icon}</div>
                    <span style={{ fontSize: 12, color: '#1c1c1c', lineHeight: 1.4 }}>{s.label}</span>
                  </div>
                  {i < 8 && <div style={{ width: 1, height: 10, background: '#fca5a5', marginLeft: 11, marginTop: 2, marginBottom: 2 }} />}
                </div>
              ))}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #fca5a5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { val: '12–15 dias', label: 'por artigo' },
                    { val: '3+ revisões', label: 'por ciclo' },
                    { val: '5 pessoas', label: 'envolvidas' },
                    { val: 'R$ 800+', label: 'por artigo' },
                  ].map((m, i) => (
                    <div key={i}>
                      <strong style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#b91c1c' }}>{m.val}</strong>
                      <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DEPOIS */}
            <div style={{ background: '#f0fff4', border: '1px solid #86efac', borderRadius: 16, padding: '1.5rem' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#15803d', marginBottom: '1.25rem' }}>✓ Com BlogAI</p>
              {[
                { icon: '🔍', label: 'IA monitora o que está em alta' },
                { icon: '📊', label: 'Busca dados reais em APIs oficiais' },
                { icon: '✍️', label: 'Escreve com a voz do seu negócio' },
                { icon: '📱', label: 'Telegram: "Quer publicar este artigo?"' },
                { icon: '✅', label: 'Um toque → publicado' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: '#bbf7d0', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, flexShrink: 0,
                    }}>{s.icon}</div>
                    <span style={{ fontSize: 12, color: '#1c1c1c', lineHeight: 1.4 }}>{s.label}</span>
                  </div>
                  {i < 4 && <div style={{ width: 1, height: 10, background: '#86efac', marginLeft: 11, marginTop: 2, marginBottom: 2 }} />}
                </div>
              ))}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #86efac' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { val: '30 seg', label: 'de aprovação' },
                    { val: '0 revisões', label: 'necessárias' },
                    { val: 'só você', label: 'envolvido' },
                    { val: '~R$ 2', label: 'custo de IA' },
                  ].map((m, i) => (
                    <div key={i}>
                      <strong style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#15803d' }}>{m.val}</strong>
                      <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
      <section style={{ background: W, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '.75rem' }}>como funciona</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-1px' }}>
            Da pesquisa à publicação,<br />com você no controle
          </h2>
          <div>
            {[
              {
                n: '01',
                title: 'IA monitora o que está em alta',
                desc: 'O sistema busca automaticamente dados reais de APIs oficiais (BACEN, IBGE, B3), feeds especializados e tendências — sempre com fontes verificáveis, nunca inventando números.',
              },
              {
                n: '02',
                title: 'Escreve o rascunho com a voz do seu negócio',
                desc: 'O modelo é treinado com o tom editorial do seu nicho. Cada artigo tem ângulo único, dados citados e estrutura que converte.',
              },
              {
                n: '03',
                title: 'Você aprova em 30 segundos pelo Telegram',
                desc: 'Recebe uma notificação com título, resumo e prévia. Um toque em "Publicar" e o artigo vai ao ar. Outro toque e o rascunho é descartado.',
              },
              {
                n: '04',
                title: 'Publicação automática com SEO completo',
                desc: 'Schema markup, meta tags, links internos e imagem de capa. O Google indexa e o tráfego orgânico cresce enquanto você faz outra coisa.',
              },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, padding: '1.5rem 0',
                borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)',
                  flexShrink: 0,
                }}>{step.n}</div>
                <div>
                  <strong style={{ display: 'block', color: '#fff', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{step.title}</strong>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── O QUE INCLUI ──────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: '.75rem' }}>entregáveis</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.1, marginBottom: '1.75rem', letterSpacing: '-1px' }}>
            Tudo que você precisa para<br />publicar no piloto automático
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
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '.75rem', background: '#f8f8f8',
                borderRadius: 10, fontSize: 13, color: '#0a0a0a', lineHeight: 1.45,
              }}>
                <span style={{ color: '#15803d', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRONOGRAMA ────────────────────────────────────────────────── */}
      <section style={{ background: B, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '.75rem' }}>cronograma</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-1px' }}>
            Do contrato ao blog no ar:<br />6 semanas
          </h2>
          {[
            { weeks: 'semanas 1–2', title: 'Briefing, estratégia editorial e setup técnico', desc: 'Definição do nicho, persona, pilares de conteúdo e tom de voz. Configuração da infraestrutura, domínio e hospedagem.' },
            { weeks: 'semanas 3–4', title: 'Desenvolvimento das automações e integrações', desc: 'Conexão com fontes de dados do nicho, configuração do modelo de IA com o seu tom editorial, testes das rotinas de geração.' },
            { weeks: 'semana 5', title: 'Primeiros conteúdos, testes e ajustes finos', desc: 'Geração dos primeiros 10 artigos para validação. Ajustes no tom, nas fontes e no fluxo de aprovação via Telegram com você.' },
            { weeks: 'semana 6', title: 'Entrega, treinamento e go live', desc: 'Blog publicado, rotinas ativas. Sessão de treinamento de 1h para você operar o painel e o fluxo de aprovação autonomamente.' },
          ].map((t, i) => (
            <div key={i} style={{
              display: 'flex', gap: 20,
              padding: '1.5rem 0',
              borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div style={{ minWidth: 88, paddingTop: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{t.weeks}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.title}</strong>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANCORAGEM CLT ─────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: '.75rem' }}>custo real</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.1, marginBottom: '.75rem', letterSpacing: '-1px' }}>
            Você já está pagando por isso.<br />Só que em salários.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Para produzir conteúdo com qualidade, consistência e dados reais, uma empresa normalmente precisa de:
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Função', 'Salário', '+ Encargos CLT (~70%)', 'Total/mês'].map((h, i) => (
                  <th key={i} style={{
                    fontSize: 11, fontWeight: 500, color: 'rgba(0,0,0,0.4)',
                    textAlign: i === 0 ? 'left' : 'right',
                    padding: '.5rem 0', borderBottom: '0.5px solid #e0e0e0',
                    letterSpacing: '.04em', textTransform: 'uppercase',
                    paddingRight: i < 3 ? 12 : 0,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { func: 'Redator', sal: 'R$ 2.500', enc: 'R$ 1.750', total: 'R$ 4.250' },
                { func: 'Head de marketing', sal: 'R$ 8.000', enc: 'R$ 5.600', total: 'R$ 13.600' },
                { func: 'Gestor de projetos', sal: 'R$ 5.000', enc: 'R$ 3.500', total: 'R$ 8.500' },
                { func: 'Tempo de gestão/validação', sal: '—', enc: '—', total: 'R$ 3.000' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 13, color: '#0a0a0a', padding: '.75rem 12px .75rem 0', borderBottom: '0.5px solid #f0f0f0' }}>{r.func}</td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', textAlign: 'right', padding: '.75rem 12px .75rem 0', borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap' }}>{r.sal}</td>
                  <td style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', textAlign: 'right', padding: '.75rem 12px .75rem 0', borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap' }}>{r.enc}</td>
                  <td style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', textAlign: 'right', padding: '.75rem 0', borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap' }}>{r.total}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ fontSize: 15, fontWeight: 700, color: '#b91c1c', padding: '1rem 0 .5rem', borderBottom: 'none' }}>Total da equipe de conteúdo</td>
                <td style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c', textAlign: 'right', padding: '1rem 0 .5rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>R$ 29.350/mês</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ fontSize: 15, fontWeight: 700, color: '#15803d', padding: '.25rem 0 1rem', borderBottom: 'none' }}>BlogAI (parcelado + manutenção)</td>
                <td style={{ fontSize: 20, fontWeight: 700, color: '#15803d', textAlign: 'right', padding: '.25rem 0 1rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>R$ 2.467/mês</td>
              </tr>
            </tbody>
          </table>
          <div style={{
            background: '#f0fff4', border: '1px solid #86efac', borderRadius: 12,
            padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>Economia mensal com BlogAI</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>R$ 26.883/mês</span>
          </div>
        </div>
      </section>

      {/* ── PREÇO ─────────────────────────────────────────────────────── */}
      <section style={{ background: B, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '.75rem' }}>investimento</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '.75rem', letterSpacing: '-1px' }}>
            Menos do que um único<br />colaborador CLT
          </h2>
          {/* Ancoragem R$ 25k */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>de</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', letterSpacing: '-0.5px' }}>R$ 25.000</span>
          </div>

          {/* 12x em destaque — VERDE */}
          <div style={{
            background: '#052e16', borderRadius: 16, padding: '2rem',
            border: '1.5px solid #16a34a', marginBottom: 12,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '1rem' }}>✦ opção em destaque</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 'clamp(52px, 11vw, 88px)', fontWeight: 700, color: '#4ade80', letterSpacing: '-4px', lineHeight: 1 }}>R$ 1.667</span>
              <span style={{ fontSize: 18, color: '#86efac', fontWeight: 400 }}>/mês</span>
            </div>
            <p style={{ fontSize: 14, color: '#86efac' }}>12 parcelas · total R$ 20.000</p>
          </div>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '.04em' }}>OU</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* À vista — VERDE */}
          <div style={{
            background: 'rgba(5,46,22,0.5)',
            border: '0.5px solid #16a34a',
            borderRadius: 16, padding: '1.5rem 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12, marginBottom: 12,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '.5rem' }}>oferta única — à vista</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 'clamp(36px, 7vw, 56px)', fontWeight: 700, color: '#4ade80', letterSpacing: '-2px', lineHeight: 1 }}>R$ 20.000</span>
              </div>
              <p style={{ fontSize: 12, color: '#86efac', marginTop: 4 }}>pagamento único · economize R$ 5.000</p>
            </div>
            <div style={{
              background: 'rgba(74,222,128,0.1)', border: '0.5px solid #4ade80',
              borderRadius: 20, padding: '6px 14px',
              fontSize: 12, fontWeight: 500, color: '#4ade80', whiteSpace: 'nowrap',
            }}>−20%</div>
          </div>

          {/* Manutenção */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '1rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>manutenção mensal</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '-1px' }}>R$ 800</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/mês</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 280, lineHeight: 1.5 }}>
              Monitoramento das automações, atualização do modelo de IA, suporte técnico e ajustes editoriais.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section style={{ background: W, padding: '5rem 2rem 4rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(48px, 10vw, 88px)', fontWeight: 700,
            letterSpacing: '-3px', lineHeight: 1, color: '#fff',
            marginBottom: '1.25rem',
          }}>
            Pronto para<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>parar de revisar texto?</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Vagas limitadas. Entrega em 6 semanas após contrato assinado.
          </p>
          <a
            href="https://wa.me/5511999999999?text=Quero+saber+mais+sobre+o+BlogAI"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fff', color: W, fontSize: 15, fontWeight: 700,
              padding: '.875rem 2rem', borderRadius: 8, textDecoration: 'none',
              transition: 'opacity .15s',
            }}
          >
            Quero meu BlogAI →
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: '1rem' }}>
            Resposta em até 24h úteis
          </p>
        </div>
      </section>
    </div>
  )
}
