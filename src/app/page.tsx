import HomeContentClient from '@/components/HomeContentClient'
import { getMaps } from '@/lib/grenades'
import { getMergedGrenadesForMap, getMergedGrenadesForMapFirstLayer } from '@/lib/lineups'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import { buildLineupFeedItems } from '@/lib/lineup-feed'
import type { Grenade } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const maps = getMaps()
  try {
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
    const lineupFeedItems = await buildLineupFeedItems(positionCatalog)

    return (
      <HomeContentClient
        mapsWithCounts={mapsWithCounts}
        grenadesByMap={grenadesByMap}
        positionCatalog={positionCatalog}
        lineupFeedItems={lineupFeedItems}
      />
    )
  } catch (e) {
    console.error('[HomePage] load failed', e)
    return (
      <HomeContentClient
        mapsWithCounts={maps.map((map) => ({ map, grenadeCount: 0 }))}
        grenadesByMap={Object.fromEntries(maps.map((m) => [m.id, [] as Grenade[]]))}
        positionCatalog={[]}
        lineupFeedItems={[]}
      />
    )
  }
}
