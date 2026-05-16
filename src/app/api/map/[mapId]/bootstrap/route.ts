import { NextResponse } from 'next/server'
import { getMap } from '@/lib/grenades'
import { buildMapBootstrapPayload } from '@/lib/home-bootstrap'

export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ mapId: string }>
}

export async function GET(_req: Request, ctx: Ctx) {
  const { mapId } = await ctx.params
  if (!getMap(mapId)) {
    return NextResponse.json({ error: 'map not found' }, { status: 404 })
  }
  try {
    const payload = await buildMapBootstrapPayload(mapId)
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (e) {
    console.error('[api/map/bootstrap]', mapId, e)
    return NextResponse.json({ error: 'bootstrap failed' }, { status: 500 })
  }
}
