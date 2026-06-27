/**
 * Gera imagem 1080x1350 (4:5) para notícias no Instagram.
 * GET /api/og?title=...&photo=...&excerpt=...&date=...
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const nunitoBold = readFileSync(join(process.cwd(), 'public/fonts/NunitoExtraBold.ttf'))
const lexendDeca = readFileSync(join(process.cwd(), 'public/fonts/LexendDeca.ttf'))
const logoData   = readFileSync(join(process.cwd(), 'public/logo-endinheirados.png'))
const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

const GREEN  = '#4ADE80'
const DARK   = '#0D2B14'
const RADIUS = 48

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')   || 'Endinheirados'
  const photoUrl = searchParams.get('photo')   || ''
  const excerpt  = searchParams.get('excerpt') || ''
  const date     = searchParams.get('date')    || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const excerptTrunc = excerpt.length > 220
    ? excerpt.slice(0, 220).replace(/\s+\S*$/, '') + '…'
    : excerpt

  // Satori não busca URLs externas em backgroundImage — converte para data URI
  let photoDataUri = ''
  if (photoUrl) {
    try {
      const res = await fetch(photoUrl, { signal: AbortSignal.timeout(10_000) })
      if (res.ok) {
        const ct = res.headers.get('content-type') || 'image/jpeg'
        const buf = Buffer.from(await res.arrayBuffer())
        photoDataUri = `data:${ct};base64,${buf.toString('base64')}`
      }
    } catch { /* sem foto, mostra placeholder */ }
  }

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#f7f8f6',
          padding: '36px 56px 40px',
        }}
      >
        {/* Logo — ratio natural do PNG é 1536×1024 = 3:2, então width:312 height:208 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="Endinheirados"
          style={{ width: 240, height: 160, objectFit: 'contain', marginBottom: 8 }}
        />

        {/* Frame da foto — dimensões explícitas para overflow:hidden clipar corretamente em Satori */}
        <div
          style={{
            width: 968,
            height: 590,
            marginBottom: 20,
            flexShrink: 0,
            position: 'relative',
            display: 'flex',
            backgroundColor: '#d1fae5',
            borderRadius: RADIUS,
            overflow: 'hidden',
          }}
        >
          {photoDataUri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDataUri}
              alt=""
              style={{
                width: 968,
                height: 590,
                objectFit: 'cover',
              }}
            />
          )}
          {/* Badge de data */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              backgroundColor: GREEN,
              borderRadius: 100,
              padding: '10px 28px',
              fontSize: 28,
              fontFamily: 'LexendDeca',
              color: DARK,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {date}
          </div>
        </div>

        {/* Card branco */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: RADIUS,
            padding: '40px 52px 36px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
            marginBottom: 24,
            flex: 1,
          }}
        >
          {/* Título com fonte menor para aparecer completo */}
          <div
            style={{
              fontFamily: 'NunitoBold',
              fontSize: 50,
              color: DARK,
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            {title}
          </div>

          {excerptTrunc && (
            <div
              style={{
                fontFamily: 'LexendDeca',
                fontSize: 34,
                color: '#444',
                lineHeight: 1.45,
              }}
            >
              {excerptTrunc}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 100,
              backgroundColor: GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              fontSize: 26,
              color: DARK,
              fontFamily: 'NunitoBold',
            }}
          >
            →
          </div>
          <span style={{ fontFamily: 'LexendDeca', fontSize: 28, color: '#666', marginRight: 10 }}>
            Leia mais em
          </span>
          <span style={{ fontFamily: 'NunitoBold', fontSize: 28, color: DARK }}>
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
  headers.set('Cache-Control', 'no-store')
  return new Response(img.body, { status: img.status, headers })
}
