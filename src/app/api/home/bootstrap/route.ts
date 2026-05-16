import { NextResponse } from 'next/server'
import { buildLineupFeedItems } from '@/lib/lineup-feed'
import { getMaps } from '@/lib/grenades'
import { getMergedGrenadesForMap, getMergedGrenadesForMapFirstLayer } from '@/lib/lineups'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import type { Grenade } from '@/types'

export const dynamic = 'force-dynamic'

/** Данные для главной: последовательная загрузка (безопасно для Workers + Postgres). */
export async function GET() {
  try {
    const maps = getMaps()
    const mapsWithCounts: { map: (typeof maps)[0]; grenadeCount: number }[] = []
    const grenadesByMap: Record<string, Grenade[]> = {}

    for (const map of maps) {
      grenadesByMap[map.id] = await getMergedGrenadesForMap(map.id)
      const firstLayer = await getMergedGrenadesForMapFirstLayer(map.id)
      mapsWithCounts.push({ map, grenadeCount: firstLayer.length })
    }

    const positionCatalog = await getMergedPositionCatalog()
    const lineupFeedItems = await buildLineupFeedItems(positionCatalog)

    return NextResponse.json({
      mapsWithCounts,
      grenadesByMap,
      positionCatalog,
      lineupFeedItems,
    })
  } catch (e) {
    console.error('[api/home/bootstrap]', e)
    return NextResponse.json({ error: 'bootstrap failed' }, { status: 500 })
  }
}
