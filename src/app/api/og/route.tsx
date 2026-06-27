/**
 * Gera imagem 1080x1350 (4:5) para notícias no Instagram.
 * Layout idêntico ao template Canva do Endinheirados:
 * fundo preto · frame branco na foto · logo sobreposta ao topo ·
 * badge de data verde · card balão branco com título + excerpt ·
 * rodapé escuro "Leia mais em endinheirados.cc"
 *
 * GET /api/og?title=...&photo=...&excerpt=...&date=...
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const nunitoBold  = readFileSync(join(process.cwd(), 'public/fonts/NunitoExtraBold.ttf'))
const lexendDeca  = readFileSync(join(process.cwd(), 'public/fonts/LexendDeca.ttf'))
const logoData    = readFileSync(join(process.cwd(), 'public/logo-og.png'))
const logoBase64  = `data:image/png;base64,${logoData.toString('base64')}`

const GREEN = '#4ADE80'
const BLACK = '#0a0a0a'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')   || 'Endinheirados'
  const photoUrl = searchParams.get('photo')   || ''
  const excerpt  = searchParams.get('excerpt') || ''
  const date     = searchParams.get('date')    || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const trunc = (s: string, max: number) =>
    s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s
  const titleTrunc   = trunc(title, 60)
  const excerptTrunc = trunc(excerpt, 130)

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          backgroundColor: BLACK,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 44px 36px',
          position: 'relative',
        }}
      >
        {/* Frame da foto com borda branca arredondada */}
        <div
          style={{
            width: '100%',
            height: 640,
            borderRadius: 52,
            border: '5px solid rgba(255,255,255,0.80)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#1a2e1a', display: 'flex' }} />
          )}

          {/* Gradiente escuro na base da foto */}
          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: 220,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)',
            }}
          />

          {/* Badge de data */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              backgroundColor: GREEN,
              borderRadius: 100,
              padding: '10px 28px',
              fontSize: 28,
              fontFamily: 'LexendDeca',
              color: BLACK,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {date}
          </div>
        </div>

        {/* Logo centralizada sobrepondo o topo do frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="Endinheirados"
          style={{
            position: 'absolute',
            top: 4,
            width: 480,
            height: 160,
            objectFit: 'contain',
          }}
        />

        {/* Card balão branco */}
        <div
          style={{
            width: '96%',
            backgroundColor: '#ffffff',
            borderRadius: 44,
            padding: '44px 52px 40px',
            display: 'flex',
            flexDirection: 'column',
            marginTop: 20,
            position: 'relative',
            flex: 1,
          }}
        >
          {/* Pontinha do balão (triângulo) */}
          <div
            style={{
              position: 'absolute',
              bottom: -22,
              left: '50%',
              width: 44,
              height: 44,
              backgroundColor: '#ffffff',
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />

          {/* Título */}
          <div
            style={{
              fontFamily: 'NunitoBold',
              fontSize: 58,
              color: BLACK,
              lineHeight: 1.08,
              marginBottom: 20,
            }}
          >
            {titleTrunc}
          </div>

          {/* Excerpt */}
          {excerptTrunc && (
            <div
              style={{
                fontFamily: 'LexendDeca',
                fontSize: 30,
                color: '#4a4a4a',
                lineHeight: 1.45,
              }}
            >
              {excerptTrunc}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 28,
          }}
        >
          {/* Seta em círculo verde */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 100,
              backgroundColor: GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 18,
              fontSize: 26,
              color: BLACK,
              fontFamily: 'NunitoBold',
            }}
          >
            →
          </div>
          <span
            style={{
              fontFamily: 'LexendDeca',
              fontSize: 28,
              color: 'rgba(255,255,255,0.6)',
              fontStyle: 'italic',
              marginRight: 10,
            }}
          >
            Leia mais em
          </span>
          <span
            style={{
              fontFamily: 'NunitoBold',
              fontSize: 28,
              color: '#ffffff',
            }}
          >
            endinheirados.cc
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: 'NunitoBold', data: nunitoBold.buffer as ArrayBuffer, style: 'normal', weight: 800 },
        { name: 'LexendDeca', data: lexendDeca.buffer as ArrayBuffer, style: 'normal', weight: 400 },
      ],
    }
  )

  const headers = new Headers(img.headers)
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return new Response(img.body, { status: img.status, headers })
}
