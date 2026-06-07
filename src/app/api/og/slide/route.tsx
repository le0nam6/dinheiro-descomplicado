/**
 * Gera um slide de carrossel 1080x1350 (4:5) no padrão Endinheirados.
 * GET /api/og/slide?title=...&body=...&index=2&total=6&kind=content|cta
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const bebasNeue = readFileSync(join(process.cwd(), 'public/fonts/BebasNeue.ttf'))
const roboto    = readFileSync(join(process.cwd(), 'public/fonts/Roboto.ttf'))
const logoData  = readFileSync(join(process.cwd(), 'public/logo-endinheirados.png'))
const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || ''
  const body  = searchParams.get('body') || ''
  const index = searchParams.get('index') || ''
  const total = searchParams.get('total') || ''
  const kind  = searchParams.get('kind') || 'content'

  const isCta = kind === 'cta'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a1a0f',
          backgroundImage: 'linear-gradient(145deg, #14321f 0%, #0a1a0f 70%)',
          padding: '72px 72px 64px',
        }}
      >
        {/* Topo: logo + contador */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt="Endinheirados" style={{ height: 160, width: 480, objectFit: 'contain', objectPosition: 'left center' }} />
          {total && (
            <div style={{ display: 'flex', fontFamily: 'Roboto', fontSize: 28, color: '#7CFC00', letterSpacing: '1px' }}>
              {`${index}/${total}`}
            </div>
          )}
        </div>

        {/* Conteúdo central */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          <div
            style={{
              fontFamily: 'BebasNeue',
              fontSize: isCta ? 96 : 82,
              color: '#FFFFFF',
              lineHeight: 0.98,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
          {body && (
            <div
              style={{
                fontFamily: 'Roboto',
                fontSize: 42,
                color: '#D8E8DC',
                lineHeight: 1.4,
              }}
            >
              {body}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Roboto', fontSize: 26, color: '#7CFC00', letterSpacing: '1px' }}>
            endinheirados.cc
          </div>
          {!isCta && total && index !== total && (
            <div style={{ fontFamily: 'BebasNeue', fontSize: 34, color: '#7CFC00', letterSpacing: '2px' }}>
              ARRASTA →
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: 'BebasNeue', data: bebasNeue.buffer, style: 'normal', weight: 400 },
        { name: 'Roboto',    data: roboto.buffer,    style: 'normal', weight: 400 },
      ],
    }
  )
}
