import HomeContentClient from '@/components/HomeContentClient'
import { getMaps } from '@/lib/grenades'
import { getMergedGrenadesForMap, getMergedGrenadesForMapFirstLayer } from '@/lib/lineups'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import type { Grenade } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const maps = getMaps()
  const mapsWithCounts = await Promise.all(
    maps.map(async (map) => ({
      map,
      grenadeCount: (await getMergedGrenadesForMapFirstLayer(map.id)).length,
    })),
  )
  const grenadesByMap: Record<string, Grenade[]> = Object.fromEntries(
    await Promise.all(maps.map(async (m) => [m.id, await getMergedGrenadesForMap(m.id)] as const)),
  )
  const positionCatalog = await getMergedPositionCatalog()

  return (
    <HomeContentClient
      mapsWithCounts={mapsWithCounts}
      grenadesByMap={grenadesByMap}
      positionCatalog={positionCatalog}
    />
  )
}
