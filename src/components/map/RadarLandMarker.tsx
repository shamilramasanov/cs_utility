'use client'

import type { GrenadeType, Side } from '@/types'
import { GRENADE_EMOJIS } from '@/lib/grenades'
import { sideRingBoxShadow } from '@/lib/map-marker-visual'

const EMOJI: Record<string, string> = {
  smoke: '💨',
  flash: '⚡',
  molotov: '🔥',
  he: '💥',
}

export type RadarLandMarkerVariant = 'public' | 'custom' | 'seed'

type Props = {
  type: GrenadeType
  side?: Side
  variant: RadarLandMarkerVariant
  selected: boolean
  muted?: boolean
  color: string
  sizePx?: number
  title?: string
  onClick: (e: React.MouseEvent) => void
}

function MarkerFace({
  type,
  children,
  faceStyle,
  scale,
}: {
  type: GrenadeType
  children: React.ReactNode
  faceStyle: React.CSSProperties
  scale: number
}) {
  const base =
    'relative flex h-full w-full items-center justify-center overflow-hidden transition-all box-border'
  const scaleWrap = { transform: `scale(${scale})` } as React.CSSProperties

  switch (type) {
    case 'smoke':
      return (
        <div className={`${base} rounded-full`} style={{ ...faceStyle, ...scaleWrap }}>
          {children}
        </div>
      )
    case 'flash':
      return (
        <div className={`${base} rounded-full`} style={scaleWrap}>
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              ...faceStyle,
              borderRadius: '5px',
              transform: 'rotate(45deg)',
            }}
          >
            <span
              className="flex h-full w-full items-center justify-center leading-none"
              style={{ transform: 'rotate(-45deg)' }}
            >
              {children}
            </span>
          </div>
        </div>
      )
    case 'molotov':
      return (
        <div className={base} style={scaleWrap}>
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              ...faceStyle,
              clipPath: 'polygon(50% 5%, 93% 88%, 7% 88%)',
            }}
          >
            {children}
          </div>
        </div>
      )
    case 'he':
      return (
        <div className={base} style={scaleWrap}>
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              ...faceStyle,
              clipPath: 'polygon(50% 3%, 90% 28%, 90% 72%, 50% 97%, 10% 72%, 10% 28%)',
            }}
          >
            {children}
          </div>
        </div>
      )
    default:
      return (
        <div className={`${base} rounded-full`} style={{ ...faceStyle, ...scaleWrap }}>
          {children}
        </div>
      )
  }
}

export default function RadarLandMarker({
  type,
  side,
  variant,
  selected,
  muted = false,
  color,
  sizePx = 24,
  title,
  onClick,
}: Props) {
  const mutedFill = '#2a2a2a'
  const mutedBorder = '#6b7280'
  const ring = sideRingBoxShadow(side, muted)

  const faceStyle: React.CSSProperties = {
    background: muted ? mutedFill : selected ? color : `${color}33`,
    border:
      variant === 'seed'
        ? '2px solid transparent'
        : `2px solid ${muted ? mutedBorder : color}`,
    boxShadow: [
      selected && !muted ? `0 0 10px ${color}77` : '',
      ring !== 'none' ? ring : '',
    ]
      .filter(Boolean)
      .join(', ')
      .trim(),
    opacity: muted ? 0.72 : 1,
    filter: muted ? 'grayscale(1)' : 'none',
  }

  const scale = selected ? 1.18 : muted ? 0.94 : 1

  const outerCls =
    variant === 'seed'
      ? 'rounded-full border-2 border-dashed transition-transform active:scale-95 overflow-visible'
      : variant === 'custom'
        ? 'rounded-full border-0 transition-transform active:scale-95 overflow-visible ring-1 ring-[#F0B429]/35'
        : 'rounded-full border-0 transition-transform active:scale-95 overflow-visible'

  const outerStyle: React.CSSProperties =
    variant === 'seed' ? { borderColor: color } : variant === 'custom' ? {} : {}

  return (
    <button
      type="button"
      data-marker="true"
      title={title}
      onClick={onClick}
      className={`pointer-events-auto flex items-center justify-center ${outerCls}`}
      style={{ width: sizePx, height: sizePx, ...outerStyle }}
    >
      <MarkerFace type={type} faceStyle={faceStyle} scale={scale}>
        <span className="block leading-none select-none" style={{ fontSize: Math.max(10, sizePx * 0.48) }}>
          {EMOJI[type] ?? GRENADE_EMOJIS[type] ?? '●'}
        </span>
      </MarkerFace>
    </button>
  )
}
