/**
 * Gera imagem 1080x1080 no padrão do template Endinheirados para o Instagram.
 * Uso: GET /api/og?title=TITULO&photo=URL_FOTO
 * A URL retornada é pública e pode ser usada diretamente na Instagram Graph API.
 */
import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title') || 'ENDINHEIRADOS'
  const photoUrl = searchParams.get('photo') || ''

  // Converte título para CAIXA ALTA e quebra em no máximo 3 linhas
  const titleUp = title.toUpperCase()

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
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}

        {/* Overlay gradiente escuro — igual ao template Canva */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.70) 45%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Área de conteúdo inferior */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '0 64px 64px',
          }}
        >
          {/* Logo Endinheirados — verde lima, estilo do template */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: '#7CFC00',
                fontFamily: 'sans-serif',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                lineHeight: 1,
              }}
            >
              💸 Endinheirados
            </span>
          </div>

          {/* Título — CAIXA ALTA, bold, branco, máx 3 linhas */}
          <div
            style={{
              fontSize: 74,
              fontWeight: 900,
              color: '#FFFFFF',
              fontFamily: 'sans-serif',
              lineHeight: 1.08,
              letterSpacing: '-1px',
              textTransform: 'uppercase',
              textShadow: '0 2px 16px rgba(0,0,0,0.9)',
              maxWidth: 950,
              wordBreak: 'break-word',
            }}
          >
            {titleUp}
          </div>

          {/* CTA — igual ao template */}
          <div
            style={{
              fontSize: 28,
              color: '#BBBBBB',
              fontFamily: 'sans-serif',
              letterSpacing: '1px',
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
    }
  )
}
