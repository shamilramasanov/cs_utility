import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthorized, isAdminReadAuthorized } from '@/lib/admin-auth'
import { parseSideKey } from '@/lib/side'
import { getAllPositionsForMap } from '@/lib/positions'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import { sanitizeZones } from '@/lib/position-zones'
import { getStoredZones, setStoredZones } from '@/lib/position-zones-store'
import type { PositionZone } from '@/types/positions'
import { jsonFromAdminWriteCatch, statusFromAdminWriteCatch } from '@/lib/admin-api-write-error'

export async function GET(req: NextRequest) {
  if (!isAdminReadAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const mapId = req.nextUrl.searchParams.get('map')
  const sideKey = parseSideKey(req.nextUrl.searchParams.get('side'))
  if (!mapId || !sideKey) {
    return NextResponse.json({ error: 'map and side are required' }, { status: 400 })
  }
  const catalog = await getMergedPositionCatalog()
  const positions = getAllPositionsForMap(mapId, catalog)
  const zones = sanitizeZones((await getStoredZones(mapId, sideKey)) ?? [], positions)
  return NextResponse.json({ zones })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      secret?: string
      map?: string
      side?: string
      zones?: PositionZone[]
    }
    if (!isAdminAuthorized(req, body.secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const sideKey = parseSideKey(body.side ?? null)
    if (!body.map || !sideKey || !Array.isArray(body.zones)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const positions = getAllPositionsForMap(body.map, await getMergedPositionCatalog())
    const zones = sanitizeZones(body.zones, positions)
    await setStoredZones(body.map, sideKey, zones)

    revalidatePath('/')
    revalidatePath(`/map/${body.map}`)
    revalidatePath(`/admin/${body.map}`)
    return NextResponse.json({ ok: true, zones })
  } catch (e) {
    console.error(e)
    return NextResponse.json(jsonFromAdminWriteCatch(e), { status: statusFromAdminWriteCatch(e) })
  }
}

