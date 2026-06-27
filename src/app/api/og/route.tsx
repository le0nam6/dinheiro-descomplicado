/**
 * Gera imagem estática 1080x1350 (4:5) para notícias no Instagram.
 * Layout: foto livre no topo, card verde sólido (#0D2B14) na base com título + URL.
 * GET /api/og?title=TITULO&photo=URL_FOTO
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const londrinaSolid = readFileSync(join(process.cwd(), 'public/fonts/LondrinaSolid.ttf'))
const lexendDeca    = readFileSync(join(process.cwd(), 'public/fonts/LexendDeca.ttf'))
const logoData      = readFileSync(join(process.cwd(), 'public/logo-endinheirados.png'))
const logoBase64    = `data:image/png;base64,${logoData.toString('base64')}`

const CARD_H  = 500
const BRAND   = '#0D2B14'
const ACCENT  = '#4ADE80'
const RADIUS  = 40

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = (searchParams.get('title') || 'ENDINHEIRADOS').toUpperCase()
  const photoUrl = searchParams.get('photo') || ''

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          position: 'relative',
          display: 'flex',
          backgroundColor: BRAND,
        }}
      >
        {/* Foto de fundo — cobre a altura toda para o glass funcionar */}
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        )}

        {/* Gradiente escuro sobre a área do card para o glass ter profundidade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: CARD_H + 120,
            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.48) 55%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Logo sobreposta à foto, canto superior esquerdo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="Endinheirados"
          style={{
            position: 'absolute',
            top: 48,
            left: 56,
            height: 144,
            width: 432,
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />

        {/* Card glassmorphism na base */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: CARD_H,
            backgroundColor: 'rgba(13, 43, 20, 0.62)',
            borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 64px 52px',
            border: '1px solid rgba(74, 222, 128, 0.18)',
            borderBottom: 'none',
          }}
        >
          {/* Highlight de luz no topo do card */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: RADIUS,
              right: RADIUS,
              height: 1,
              background: 'linear-gradient(to right, rgba(74,222,128,0) 0%, rgba(74,222,128,0.55) 40%, rgba(255,255,255,0.35) 50%, rgba(74,222,128,0.55) 60%, rgba(74,222,128,0) 100%)',
            }}
          />

          {/* Título em Londrina Solid */}
          <div
            style={{
              fontFamily: 'LondrinaSolid',
              fontSize: 80,
              color: '#FFFFFF',
              lineHeight: 0.95,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>

          {/* URL em Lexend Deca */}
          <div
            style={{
              fontFamily: 'LexendDeca',
              fontSize: 23,
              color: ACCENT,
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            endinheirados.cc
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: 'LondrinaSolid', data: londrinaSolid.buffer as ArrayBuffer, style: 'normal', weight: 400 },
        { name: 'LexendDeca',    data: lexendDeca.buffer    as ArrayBuffer, style: 'normal', weight: 400 },
      ],
    }
  )

  const headers = new Headers(img.headers)
  headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600')
  return new Response(img.body, { status: img.status, headers })
}
