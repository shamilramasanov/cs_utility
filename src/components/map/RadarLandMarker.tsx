'use client'

import type { GrenadeType, Side } from '@/types'

function sideOutlineColor(side: Side | undefined, fallback: string): string {
  if (side === 'T') return '#F0B429'
  if (side === 'CT') return '#64B5F6'
  if (side === 'both') return '#E3ECF5'
  return fallback
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

function MarkerShapeOutline({ type, color }: { type: GrenadeType; color: string }) {
  const strokeWidth = 2.4

  switch (type) {
    case 'flash':
      return (
        <polygon
          points="12 2.5 21.5 12 12 21.5 2.5 12"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    case 'molotov':
      return (
        <polygon
          points="12 3 21 20.5 3 20.5"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    case 'he':
      return (
        <polygon
          points="12 2.5 20.5 7.5 20.5 16.5 12 21.5 3.5 16.5 3.5 7.5"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    case 'smoke':
    default:
      return (
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      )
  }
}

function GrenadeIcon({ type, color }: { type: GrenadeType; color: string }) {
  switch (type) {
    case 'flash':
      return (
        <path
          d="M13.2 2.8 5.9 13h5l-1 8.2 8.2-11.3h-5.2l.3-7.1Z"
          fill={color}
          stroke="#111"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      )
    case 'molotov':
      return (
        <path
          d="M12.5 21c3.2-.6 5.2-2.8 5.2-5.9 0-2.5-1.4-4.6-3.1-6.4-.4 1.6-1.3 2.6-2.5 3.4.5-3.1-.7-5.5-3.2-7.7.1 3.9-2.6 6-2.6 10.4 0 3.2 2.5 5.6 6.2 6.2Z"
          fill={color}
          stroke="#111"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      )
    case 'he':
      return (
        <path
          d="M12 3.4 13.9 9l5.9-1.2-4 4.4 4 4.4-5.9-1.2L12 21l-1.9-5.6-5.9 1.2 4-4.4-4-4.4L10.1 9 12 3.4Z"
          fill={color}
          stroke="#111"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      )
    case 'smoke':
    default:
      return (
        <g fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round">
          <path d="M4.2 8.2c1.9-1.7 4-1.7 5.9 0s4 1.7 5.9 0 3.3-1.5 4.5-.3" />
          <path d="M3.8 13c1.9-1.7 4.2-1.7 6.2 0s4.2 1.7 6.2 0 3.5-1.5 4.8-.2" />
          <path d="M5.3 17.8c1.5-1.2 3.2-1.2 4.8 0s3.3 1.2 4.8 0" />
        </g>
      )
  }
}

function MarkerFace({
  type,
  faceStyle,
  scale,
  outlineColor,
}: {
  type: GrenadeType
  faceStyle: React.CSSProperties
  scale: number
  outlineColor: string
}) {
  const base =
    'relative flex h-full w-full items-center justify-center overflow-visible transition-all box-border'
  const scaleWrap = { transform: `scale(${scale})` } as React.CSSProperties

  return (
    <div className={base} style={{ ...faceStyle, ...scaleWrap }}>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <MarkerShapeOutline type={type} color={outlineColor} />
      </svg>
      <svg
        className={`pointer-events-none relative z-10 overflow-visible ${
          type === 'smoke' ? 'h-[72%] w-[72%]' : 'h-[58%] w-[58%]'
        }`}
        viewBox="0 0 24 24"
        aria-hidden
      >
        <GrenadeIcon type={type} color={outlineColor} />
      </svg>
    </div>
  )
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
  const mutedBorder = '#6b7280'
  const outlineColor = muted ? mutedBorder : sideOutlineColor(side, color)

  const faceStyle: React.CSSProperties = {
    background: 'transparent',
    opacity: muted ? 0.72 : 1,
    filter: muted ? 'grayscale(1)' : 'none',
  }

  const scale = selected ? 1.18 : muted ? 0.94 : 1

  const outerCls =
    variant === 'seed'
      ? 'border-2 border-dashed transition-transform active:scale-95 overflow-visible'
      : variant === 'custom'
        ? 'border-0 transition-transform active:scale-95 overflow-visible'
        : 'border-0 transition-transform active:scale-95 overflow-visible'

  const outerStyle: React.CSSProperties =
    variant === 'seed' ? { borderColor: color } : variant === 'custom' ? {} : {}

  return (
    <button
      type="button"
      data-marker="true"
      title={title}
      onClick={onClick}
      className={`pointer-events-auto flex appearance-none items-center justify-center bg-transparent p-0 outline-none shadow-none ${outerCls}`}
      style={{ width: sizePx, height: sizePx, ...outerStyle }}
    >
      <MarkerFace type={type} faceStyle={faceStyle} scale={scale} outlineColor={outlineColor} />
    </button>
  )
}
