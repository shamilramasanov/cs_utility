import type { Side } from '@/types'
import type { TeamRole } from '@/types/tactics'

export interface RoleMeta {
  role: TeamRole
  color: string
  labelKey: string
  hintKey: string
  sides: Side[]
}

export const ROLE_META: RoleMeta[] = [
  {
    role: 'entry',
    color: '#FF4444',
    labelKey: 'team.role.entry',
    hintKey: 'team.role.entryHint',
    sides: ['T'],
  },
  {
    role: 'awp',
    color: '#FFD700',
    labelKey: 'team.role.awp',
    hintKey: 'team.role.awpHint',
    sides: ['T', 'CT'],
  },
  {
    role: 'lurker',
    color: '#9B59B6',
    labelKey: 'team.role.lurker',
    hintKey: 'team.role.lurkerHint',
    sides: ['T'],
  },
  {
    role: 'support',
    color: '#27AE60',
    labelKey: 'team.role.support',
    hintKey: 'team.role.supportHint',
    sides: ['T', 'CT'],
  },
  {
    role: 'igl',
    color: '#3498DB',
    labelKey: 'team.role.igl',
    hintKey: 'team.role.iglHint',
    sides: ['T', 'CT'],
  },
  {
    role: 'anchor_a',
    color: '#E67E22',
    labelKey: 'team.role.anchor_a',
    hintKey: 'team.role.anchor_aHint',
    sides: ['CT'],
  },
  {
    role: 'anchor_b',
    color: '#E67E22',
    labelKey: 'team.role.anchor_b',
    hintKey: 'team.role.anchor_bHint',
    sides: ['CT'],
  },
]

export function rolesForSide(side: Side): RoleMeta[] {
  if (side === 'both') return ROLE_META
  return ROLE_META.filter((r) => r.sides.includes(side))
}

/** Все роли для выбора до брифинга (сторона ещё не выбрана). */
export function rolesForMeet(): RoleMeta[] {
  return ROLE_META
}

export function roleMeta(role: TeamRole): RoleMeta {
  return ROLE_META.find((r) => r.role === role) ?? ROLE_META[0]
}
