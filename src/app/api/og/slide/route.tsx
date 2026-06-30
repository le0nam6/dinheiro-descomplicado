/**
 * Gera slide de carrossel 1080x1350 — estilo flat/minimalista Endinheirados.
 * GET /api/og/slide?title=...&body=...&index=2&total=6&kind=cover|content|cta&tag=CÂMBIO
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const bebasNeue = readFileSync(join(process.cwd(), 'public/fonts/BebasNeue.ttf'))
const roboto    = readFileSync(join(process.cwd(), 'public/fonts/Roboto.ttf'))

// Brand colors
const GREEN_DARK  = '#0D2B14'
const GREEN_MID   = '#1A5C2A'
const GREEN_LIME  = '#4ADE80'
const CREAM_BG    = '#F7F4EE'
const GRAY_TEXT   = '#4A5568'
const WHITE       = '#FFFFFF'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || ''
  const body  = searchParams.get('body')  || ''
  const index = parseInt(searchParams.get('index') || '0')
  const total = parseInt(searchParams.get('total') || '0')
  const kind  = searchParams.get('kind')  || 'content'
  const tag   = searchParams.get('tag')   || 'ENDINHEIRADOS'

  const isCover = kind === 'cover'
  const isCta   = kind === 'cta'
  const isLast  = index === total

  // ── CTA slide ──────────────────────────────────────────────────────────────
  if (isCta) {
    const img = new ImageResponse(
      (
        <div style={{
          width: 1080, height: 1350,
          background: GREEN_DARK,
          display: 'flex', flexDirection: 'column',
          padding: '96px 88px',
          position: 'relative',
        }}>
          {/* Decorative corner block */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 320, height: 320,
            background: GREEN_MID,
            borderRadius: '0 0 0 100%',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            width: 200, height: 200,
            background: GREEN_MID,
            borderRadius: '0 100% 0 0',
          }} />

          {/* Dot + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: GREEN_LIME }} />
            <span style={{ fontFamily: 'Roboto', fontSize: 28, color: GREEN_LIME, letterSpacing: 3 }}>
              ENDINHEIRADOS
            </span>
          </div>

          {/* Main CTA */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', gap: 24, zIndex: 1,
          }}>
            <div style={{
              fontFamily: 'BebasNeue', fontSize: 130,
              color: WHITE, lineHeight: 0.92, letterSpacing: 2,
            }}>
              {title || 'GOSTOU?\nSIGA A GENTE'}
            </div>
            {body && (
              <div style={{ fontFamily: 'Roboto', fontSize: 40, color: GREEN_LIME, lineHeight: 1.4 }}>
                {body}
              </div>
            )}
          </div>

          {/* URL footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
            <div style={{ width: 48, height: 3, background: GREEN_LIME, borderRadius: 4 }} />
            <span style={{ fontFamily: 'Roboto', fontSize: 32, color: WHITE, letterSpacing: 2 }}>
              portalendinheirados.com.br
            </span>
          </div>
        </div>
      ),
      { width: 1080, height: 1350, fonts: [
        { name: 'BebasNeue', data: bebasNeue.buffer, style: 'normal', weight: 400 },
        { name: 'Roboto',    data: roboto.buffer,    style: 'normal', weight: 400 },
      ]},
    )
    return cached(img)
  }

  // ── Cover slide ────────────────────────────────────────────────────────────
  if (isCover) {
    const img = new ImageResponse(
      (
        <div style={{
          width: 1080, height: 1350,
          background: CREAM_BG,
          display: 'flex', flexDirection: 'column',
          padding: '72px 80px 64px',
          position: 'relative',
        }}>
          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 10, background: GREEN_DARK,
          }} />

          {/* Bottom color block */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 220, background: GREEN_DARK,
          }} />

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            {/* Category pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: GREEN_DARK, borderRadius: 60,
              paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: GREEN_LIME }} />
              <span style={{ fontFamily: 'Roboto', fontSize: 26, color: WHITE, letterSpacing: 2 }}>
                {tag.toUpperCase()}
              </span>
            </div>
            {/* Slide counter */}
            <span style={{ fontFamily: 'Roboto', fontSize: 26, color: GRAY_TEXT, letterSpacing: 1 }}>
              {total > 0 ? `1/${total}` : ''}
            </span>
          </div>

          {/* Title area */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', gap: 32, zIndex: 1,
            paddingTop: 40, paddingBottom: 40,
          }}>
            {/* Accent line */}
            <div style={{ width: 64, height: 6, background: GREEN_LIME, borderRadius: 4 }} />
            {/* Title */}
            <div style={{
              fontFamily: 'BebasNeue', fontSize: 108,
              color: GREEN_DARK, lineHeight: 0.93, letterSpacing: 1,
            }}>
              {title}
            </div>
            {/* Hook / subtitle */}
            {body && (
              <div style={{
                fontFamily: 'Roboto', fontSize: 38,
                color: GRAY_TEXT, lineHeight: 1.45,
              }}>
                {body}
              </div>
            )}
          </div>

          {/* Footer (inside bottom dark block) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 220, zIndex: 1, paddingBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: GREEN_LIME }} />
              <span style={{ fontFamily: 'Roboto', fontSize: 30, color: WHITE, letterSpacing: 2 }}>
                portalendinheirados.com.br
              </span>
            </div>
            <div style={{ fontFamily: 'BebasNeue', fontSize: 36, color: GREEN_LIME, letterSpacing: 3 }}>
              ARRASTA →
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1350, fonts: [
        { name: 'BebasNeue', data: bebasNeue.buffer, style: 'normal', weight: 400 },
        { name: 'Roboto',    data: roboto.buffer,    style: 'normal', weight: 400 },
      ]},
    )
    return cached(img)
  }

  // ── Content slide ──────────────────────────────────────────────────────────
  const img = new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        background: WHITE,
        display: 'flex', flexDirection: 'column',
        padding: '64px 80px',
        position: 'relative',
      }}>
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 12, height: '100%', background: GREEN_DARK,
        }} />

        {/* Accent dot decorative */}
        <div style={{
          position: 'absolute', bottom: 180, right: 80,
          width: 80, height: 80, borderRadius: '50%', background: GREEN_LIME, opacity: 0.15,
        }} />

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1,
        }}>
          {/* Category pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: GREEN_DARK, borderRadius: 60,
            paddingTop: 10, paddingBottom: 10, paddingLeft: 22, paddingRight: 22,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN_LIME }} />
            <span style={{ fontFamily: 'Roboto', fontSize: 24, color: WHITE, letterSpacing: 2 }}>
              {tag.toUpperCase()}
            </span>
          </div>
          {/* Slide counter */}
          {total > 0 && (
            <span style={{ fontFamily: 'Roboto', fontSize: 26, color: GRAY_TEXT, letterSpacing: 1 }}>
              {`${index}/${total}`}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', gap: 36, zIndex: 1,
          paddingTop: 32, paddingBottom: 64,
        }}>
          <div style={{
            fontFamily: 'BebasNeue', fontSize: body ? 90 : 118,
            color: GREEN_DARK, lineHeight: 0.93, letterSpacing: 1,
          }}>
            {title}
          </div>
          {body && (
            <div style={{
              fontFamily: 'Roboto', fontSize: 40,
              color: GRAY_TEXT, lineHeight: 1.5,
            }}>
              {body}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: GREEN_LIME }} />
            <span style={{ fontFamily: 'Roboto', fontSize: 26, color: GRAY_TEXT, letterSpacing: 2 }}>
              portalendinheirados.com.br
            </span>
          </div>
          {!isLast && (
            <div style={{ fontFamily: 'BebasNeue', fontSize: 34, color: GREEN_DARK, letterSpacing: 3 }}>
              ARRASTA →
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1080, height: 1350, fonts: [
      { name: 'BebasNeue', data: bebasNeue.buffer, style: 'normal', weight: 400 },
      { name: 'Roboto',    data: roboto.buffer,    style: 'normal', weight: 400 },
    ]},
  )
  return cached(img)
}

function cached(img: ImageResponse) {
  const headers = new Headers(img.headers)
  headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600')
  return new Response(img.body, { status: img.status, headers })
}
