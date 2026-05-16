import { NextRequest, NextResponse } from 'next/server'
import { POSITION_ZONES_CACHE_CONTROL } from '@/lib/api-cache-headers'
import { getAllPositionsForMap } from '@/lib/positions'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import { getStoredZones } from '@/lib/position-zones-store'
import { pickZones } from '@/lib/position-zones'
import { parseSideKey } from '@/lib/side'

export async function GET(req: NextRequest) {
  const mapId = req.nextUrl.searchParams.get('map')
  const sideKey = parseSideKey(req.nextUrl.searchParams.get('side'))
  if (!mapId || !sideKey) {
    return NextResponse.json({ error: 'map and side are required' }, { status: 400 })
  }

  try {
    const catalog = await getMergedPositionCatalog()
    const positions = getAllPositionsForMap(mapId, catalog)
    const stored = await getStoredZones(mapId, sideKey)
    const zones = pickZones(stored, positions, sideKey)

    return NextResponse.json(
      { zones },
      { headers: { 'Cache-Control': POSITION_ZONES_CACHE_CONTROL } },
    )
  } catch (e) {
    console.error('[api/position-zones]', mapId, sideKey, e)
    return NextResponse.json({ error: 'zones failed' }, { status: 503 })
  }
}

