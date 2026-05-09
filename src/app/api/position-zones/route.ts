import { NextRequest, NextResponse } from 'next/server'
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

  const catalog = getMergedPositionCatalog()
  const positions = getAllPositionsForMap(mapId, catalog)
  const stored = getStoredZones(mapId, sideKey)
  const zones = pickZones(stored, positions, sideKey)

  return NextResponse.json({ zones })
}

