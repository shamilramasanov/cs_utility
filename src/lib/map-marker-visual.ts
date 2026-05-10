import type { GrenadeType, Side } from '@/types'

/** Кольцо стороны вокруг маркера (T / CT / обе). */
export function sideRingBoxShadow(side: Side | undefined, muted: boolean): string {
  if (muted) return 'none'
  if (side === 'T') return '0 0 0 2px rgba(240, 180, 41, 0.95), 0 0 10px rgba(240, 180, 41, 0.25)'
  if (side === 'CT') return '0 0 0 2px rgba(100, 181, 246, 0.95), 0 0 10px rgba(100, 181, 246, 0.22)'
  if (side === 'both')
    return '0 0 0 1px rgba(240, 180, 41, 0.95), 0 0 0 4px rgba(100, 181, 246, 0.92), 0 0 12px rgba(255,255,255,0.12)'
  return '0 0 0 1px rgba(255,255,255,0.2)'
}

export function throwOriginStrokeColor(side: Side | undefined): string {
  if (side === 'T') return '#F5D78A'
  if (side === 'CT') return '#A8D8FF'
  if (side === 'both') return '#E3ECF5'
  return '#0d0d0d'
}

export function throwOriginStrokeWidth(side: Side | undefined, scale: number): number {
  const w = side === 'both' ? 2.2 : 2
  return w * scale
}
