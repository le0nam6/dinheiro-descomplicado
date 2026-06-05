import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #16a34a, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 14, color: 'white', fontWeight: 900, fontFamily: 'sans-serif', lineHeight: 1 }}>
          E$
        </span>
      </div>
    ),
    { ...size }
  )
}
