import type { Grenade, Side } from '@/types'

export interface LineupFeedItem {
  id: string
  grenadeId: string
  mapId: string
  mapName: string
  variantIndex: number
  videoUrl: string
  title: string
  description: string
  throwMethodLabel: string
  methodHint: string
  type: Grenade['type']
  side: Side
  positionId: string | null
  positionLabel: string | null
  variantLabel: string | null
  feedOrder: number
}
