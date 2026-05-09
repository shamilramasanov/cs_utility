import HomeContentClient from '@/components/HomeContentClient'
import { getMaps } from '@/lib/grenades'
import { getMergedGrenadesForMap, getMergedGrenadesForMapFirstLayer } from '@/lib/lineups'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import type { Grenade } from '@/types'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const maps = getMaps()
  const mapsWithCounts = maps.map((map) => ({
    map,
    grenadeCount: getMergedGrenadesForMapFirstLayer(map.id).length,
  }))
  const grenadesByMap: Record<string, Grenade[]> = Object.fromEntries(
    maps.map((m) => [m.id, getMergedGrenadesForMap(m.id)] as const),
  )
  const positionCatalog = getMergedPositionCatalog()

  return (
    <HomeContentClient
      mapsWithCounts={mapsWithCounts}
      grenadesByMap={grenadesByMap}
      positionCatalog={positionCatalog}
    />
  )
}
