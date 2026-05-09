import type { Side } from '@/types'

/** Из URL приходит как `t` / `ct`. Внутри — `T` / `CT`. */
export type SideKey = 't' | 'ct'

export function parseSideKey(value: string | null | undefined): SideKey | null {
  if (value === 't' || value === 'ct') return value
  return null
}

export function sideKeyToSide(key: SideKey): Exclude<Side, 'both'> {
  return key === 't' ? 'T' : 'CT'
}

export function isSideMatch(grenadeSide: Side, key: SideKey): boolean {
  if (grenadeSide === 'both') return true
  return grenadeSide === sideKeyToSide(key)
}
