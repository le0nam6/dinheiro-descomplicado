/**
 * Gera imagem 1080x1080 no padrão do template Endinheirados para o Instagram.
 * GET /api/og?title=TITULO&photo=URL_FOTO
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Node.js runtime para acesso ao filesystem (fontes e logo)
export const runtime = 'nodejs'

// Carrega fontes e logo uma única vez (cached no módulo)
const bebasNeue = readFileSync(join(process.cwd(), 'public/fonts/BebasNeue.ttf'))
const roboto    = readFileSync(join(process.cwd(), 'public/fonts/Roboto.ttf'))
const logoData  = readFileSync(join(process.cwd(), 'public/logo-og.png'))
const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title') || 'ENDINHEIRADOS'
  const photoUrl = searchParams.get('photo') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: '#0a1a0f',
        }}
      >
        {/* Foto de fundo */}
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}

        {/* Overlay gradiente escuro */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0.08) 100%)',
          }}
        />

        {/* Conteúdo inferior */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '0 68px 68px',
          }}
        >
          {/* Logo Endinheirados — base64 inline */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt="Endinheirados"
            style={{ height: 90, width: 'auto', objectFit: 'contain', objectPosition: 'left' }}
          />

          {/* Título — Bebas Neue, CAIXA ALTA */}
          <div
            style={{
              fontFamily: 'BebasNeue',
              fontSize: 100,
              color: '#FFFFFF',
              lineHeight: 0.95,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '0 3px 18px rgba(0,0,0,0.9)',
              maxWidth: 960,
              wordBreak: 'break-word',
            }}
          >
            {title.toUpperCase()}
          </div>

          {/* CTA — Roboto */}
          <div
            style={{
              fontFamily: 'Roboto',
              fontSize: 30,
              color: '#CCCCCC',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            LEIA A LEGENDA
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: 'BebasNeue', data: bebasNeue.buffer, style: 'normal', weight: 400 },
        { name: 'Roboto',    data: roboto.buffer,    style: 'normal', weight: 400 },
      ],
    }
  )
}
