import type { Side } from './index'

export type TeamRole =
  | 'igl'
  | 'entry'
  | 'awp'
  | 'lurker'
  | 'support'
  | 'anchor_a'
  | 'anchor_b'

/** Роль для просмотра плана/карты; `all` — вся команда на тактической карте. */
export type ViewRole = TeamRole | 'all'

export type StepKind =
  | 'spawn'
  | 'move'
  | 'hold'
  | 'throw'
  | 'peek'
  | 'exec'
  | 'rotate'
  | 'note'

export type TacticScenario = 'pistol' | 'eco' | 'force' | 'full' | 'any'

export interface MapPoint {
  x: number
  y: number
}

export interface TacticStep {
  id: string
  time?: number
  kind: StepKind
  text: string
  position_id?: string
  grenade_id?: string
  path?: MapPoint[]
  grenade_marker?: MapPoint & { type?: string }
}

export interface TacticOverview {
  exec_target?: MapPoint & { label?: string }
}

export interface RolePlan {
  role: TeamRole
  brief: string
  steps: TacticStep[]
}

export interface Tactic {
  id: string
  map: string
  side: Side
  name: string
  description: string
  scenario: TacticScenario
  role_plans: RolePlan[]
  tactic_overview?: TacticOverview
  source: 'preset' | 'custom'
  author?: string
  created_at: string
}
