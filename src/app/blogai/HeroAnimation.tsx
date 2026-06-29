'use client'
import dynamic from 'next/dynamic'
import { TelegramComposition } from './TelegramComposition'

const Player = dynamic(
  () => import('@remotion/player').then((m) => ({ default: m.Player })),
  { ssr: false, loading: () => <div style={{ width: 228, height: 456 }} /> },
)

export function HeroAnimation() {
  return (
    <Player
      component={TelegramComposition}
      durationInFrames={270}
      fps={30}
      compositionWidth={228}
      compositionHeight={456}
      loop
      autoPlay
      controls={false}
      acknowledgeRemotionLicense
      style={{
        width: 228,
        height: 456,
        filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.75))',
      }}
    />
  )
}
