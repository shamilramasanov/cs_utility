import type { Side } from '@/types'
import type { Tactic } from '@/types/tactics'
import tacticsData from '@/data/tactics.json'

const tactics = tacticsData.tactics as Tactic[]

export function getTactics(): Tactic[] {
  return tactics
}

export function getTacticById(id: string): Tactic | undefined {
  return tactics.find((t) => t.id === id)
}

export function getTacticsByMapAndSide(map: string, side: Side): Tactic[] {
  return tactics.filter((t) => t.map === map && (t.side === side || t.side === 'both'))
}

export function formatStepTime(seconds?: number): string {
  if (seconds == null) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
