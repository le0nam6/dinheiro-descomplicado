import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

const TOTAL = 270 // 9s @ 30fps
const TYPING_START = 15
const MSG_IN      = 65
const BTNS_IN     = 108
const CLICK_F     = 142
const CONFIRM_IN  = 158
const HOLD_END    = 240

export const TelegramComposition: React.FC = () => {
  const frame = useCurrentFrame()
  const f = frame % TOTAL

  /* ── typing dots ──────────────────────────────────────────────── */
  const typingOpacity = interpolate(f,
    [TYPING_START, TYPING_START + 8, MSG_IN - 8, MSG_IN],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const dot = (offset: number) =>
    Math.max(0.25, Math.sin((f - TYPING_START) * 0.25 - offset) * 0.5 + 0.6)

  /* ── main message ─────────────────────────────────────────────── */
  const msgOpacity = interpolate(f, [MSG_IN, MSG_IN + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const msgY       = interpolate(f, [MSG_IN, MSG_IN + 14], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  /* ── buttons ──────────────────────────────────────────────────── */
  const btnsOpacity = interpolate(f, [BTNS_IN, BTNS_IN + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  /* ── click animation ──────────────────────────────────────────── */
  const btnScale = f >= CLICK_F && f < CLICK_F + 14
    ? interpolate(f, [CLICK_F, CLICK_F + 7, CLICK_F + 14], [1, 0.91, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1
  const btnGlow = f >= CLICK_F
    ? interpolate(f, [CLICK_F, CLICK_F + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0

  /* ── confirmation ─────────────────────────────────────────────── */
  const confirmOpacity = interpolate(f, [CONFIRM_IN, CONFIRM_IN + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const confirmY       = interpolate(f, [CONFIRM_IN, CONFIRM_IN + 14], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  /* ── fade out for loop ────────────────────────────────────────── */
  const fadeOut = interpolate(f, [HOLD_END, TOTAL - 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      {/* ── phone shell ──────────────────────────────────────────── */}
      <div style={{
        width: 228, height: 456,
        background: '#0d0d0d',
        borderRadius: 36,
        border: '1.5px solid rgba(255,255,255,0.13)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 48px 96px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {/* notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 58, height: 7, background: '#000', borderRadius: '0 0 7px 7px', zIndex: 10 }} />

        {/* screen */}
        <div style={{ position: 'absolute', inset: '7px 6px', background: '#0f1923', borderRadius: 30, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* TG header */}
          <div style={{ background: '#17212B', padding: '20px 12px 10px', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#2196F3,#0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white', fontFamily: 'system-ui', flexShrink: 0 }}>AI</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: 'system-ui', lineHeight: 1.2 }}>BlogAI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'system-ui' }}>bot • online</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontFamily: 'system-ui' }}>⋮</div>
          </div>

          {/* chat area */}
          <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8, background: 'linear-gradient(180deg, #0f1923 0%, #111a23 100%)' }}>

            {/* typing indicator */}
            <div style={{ opacity: typingOpacity, display: 'inline-flex', gap: 4, padding: '7px 10px', background: '#1c2b3a', borderRadius: '12px 12px 12px 3px', alignItems: 'center', width: 'fit-content' }}>
              {[0, 0.9, 1.8].map((offset, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: `rgba(96,165,250,${dot(offset)})`,
                  transform: `scale(${0.6 + dot(offset) * 0.4})`,
                }} />
              ))}
            </div>

            {/* main message bubble */}
            <div style={{ opacity: msgOpacity, transform: `translateY(${msgY}px)`, padding: '9px 11px', background: '#1c2b3a', borderRadius: '12px 12px 12px 3px', maxWidth: '88%' }}>
              <div style={{ fontSize: 8, color: 'rgba(96,165,250,0.8)', fontFamily: 'system-ui', marginBottom: 4, fontWeight: 600 }}>BlogAI Bot</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: 'system-ui', marginBottom: 4, lineHeight: 1.35 }}>Novo artigo pronto para aprovação:</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui', lineHeight: 1.5, fontStyle: 'italic', paddingLeft: 6, borderLeft: '2px solid rgba(96,165,250,0.4)' }}>
                "Dólar e Você: o que a alta de hoje significa para o seu bolso"
              </div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: 'system-ui', textAlign: 'right', marginTop: 5 }}>14:03 ✓✓</div>
            </div>

            {/* action buttons */}
            <div style={{ opacity: btnsOpacity, display: 'flex', gap: 6 }}>
              <div style={{
                flex: 1.3,
                background: '#16a34a',
                borderRadius: 9,
                padding: '7px 6px',
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: 'white',
                fontFamily: 'system-ui',
                transform: `scale(${btnScale})`,
                boxShadow: `0 0 ${btnGlow * 18}px rgba(22,163,74,${btnGlow * 0.55})`,
                letterSpacing: '.02em',
              }}>✓ Publicar</div>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9,
                padding: '7px 4px',
                textAlign: 'center',
                fontSize: 8.5,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'system-ui',
              }}>Ver rascunho</div>
            </div>

            {/* confirmation */}
            {f >= CONFIRM_IN - 2 && (
              <div style={{
                opacity: confirmOpacity,
                transform: `translateY(${confirmY}px)`,
                padding: '8px 10px',
                background: 'rgba(22,163,74,0.1)',
                border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', flexShrink: 0, fontFamily: 'system-ui' }}>✓</div>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#4ade80', fontFamily: 'system-ui', lineHeight: 1.3 }}>Publicado!</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'system-ui' }}>agora • endinheirados.cc</div>
                </div>
              </div>
            )}
          </div>

          {/* TG bottom input bar */}
          <div style={{ background: '#17212B', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.06)', borderRadius: 11, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'system-ui' }}>Mensagem…</span>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2196F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>➤</div>
          </div>
        </div>

        {/* home bar */}
        <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 52, height: 3, background: 'rgba(255,255,255,0.16)', borderRadius: 2 }} />
      </div>
    </AbsoluteFill>
  )
}
