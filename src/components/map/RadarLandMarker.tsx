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

const GRENADE_ICON_MASKS: Record<GrenadeType, string> = {
  flash: '/grenade-icons/flash.png',
  he: '/grenade-icons/he.png',
  molotov: '/grenade-icons/molotov.png',
  smoke: '/grenade-icons/smoke.png',
}

function grenadeIconSize(type: GrenadeType): string {
  if (type === 'smoke') return '76%'
  if (type === 'he') return '70%'
  return '64%'
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
  const iconMask = `url(${GRENADE_ICON_MASKS[type]}) center / contain no-repeat`
  const iconStyle: React.CSSProperties = {
    width: grenadeIconSize(type),
    height: grenadeIconSize(type),
    backgroundColor: outlineColor,
    WebkitMask: iconMask,
    mask: iconMask,
  }

  return (
    <div className={base} style={{ ...faceStyle, ...scaleWrap }}>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <MarkerShapeOutline type={type} color={outlineColor} />
      </svg>
      <span
        className="pointer-events-none relative z-10 block"
        style={iconStyle}
        aria-hidden
      />
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
