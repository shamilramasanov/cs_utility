import type { Side } from './index'
import type { TeamRole } from './tactics'

export interface MeetMember {
  id: string
  nickname: string
  role: TeamRole | null
  is_captain: boolean
  joined_at: string
  last_seen?: string
}

export interface Meet {
  code: string
  secret: string
  /** null до брифинга капитана */
  map: string | null
  side: Side | null
  tactic_id: string | null
  briefing_locked: boolean
  members: MeetMember[]
  created_at: string
  expires_at: string
}
