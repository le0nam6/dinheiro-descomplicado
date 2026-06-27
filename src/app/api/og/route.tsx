/**
 * Gera imagem 1080x1350 (4:5) para notícias no Instagram.
 * Layout inspirado no template Canva do Endinheirados:
 * logo topo · foto arredondada com badge de data · card branco com título + excerpt · rodapé
 * GET /api/og?title=...&photo=...&excerpt=...&date=...
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const nunitoBold  = readFileSync(join(process.cwd(), 'public/fonts/NunitoExtraBold.ttf'))
const lexendDeca  = readFileSync(join(process.cwd(), 'public/fonts/LexendDeca.ttf'))
const logoData    = readFileSync(join(process.cwd(), 'public/logo-endinheirados.png'))
const logoBase64  = `data:image/png;base64,${logoData.toString('base64')}`

const GREEN  = '#4ADE80'
const DARK   = '#0D2B14'
const RADIUS = 48

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')   || 'Endinheirados'
  const photoUrl = searchParams.get('photo')   || ''
  const excerpt  = searchParams.get('excerpt') || ''
  const date     = searchParams.get('date')    || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const trunc = (s: string, max: number) =>
    s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s
  const titleTrunc   = trunc(title, 70)
  const excerptTrunc = trunc(excerpt, 140)

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
          padding: '52px 56px 44px',
        }}
      >
        {/* Logo — 15% maior que o original */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="Endinheirados"
          style={{ width: 345, height: 101, objectFit: 'contain', marginBottom: 36 }}
        />

        {/* Frame da foto com bordas arredondadas */}
        <div
          style={{
            width: '100%',
            height: 580,
            borderRadius: RADIUS,
            overflow: 'hidden',
            position: 'relative',
            border: '3px solid rgba(0,0,0,0.08)',
            marginBottom: 24,
            display: 'flex',
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
            // Placeholder com mesmo border radius do frame
            <div style={{ width: '100%', height: '100%', backgroundColor: '#d1fae5', borderRadius: RADIUS, display: 'flex' }} />
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
              fontWeight: 700,
              color: DARK,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {date}
          </div>
        </div>

        {/* Card branco com título + excerpt */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: RADIUS,
            padding: '44px 52px 40px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
            marginBottom: 28,
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: 'NunitoBold',
              fontSize: 64,
              color: DARK,
              lineHeight: 1.08,
              marginBottom: 20,
            }}
          >
            {titleTrunc}
          </div>
          {excerptTrunc && (
            <div
              style={{
                fontFamily: 'LexendDeca',
                fontSize: 30,
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
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return new Response(img.body, { status: img.status, headers })
}
