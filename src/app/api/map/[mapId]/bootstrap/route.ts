import { NextResponse } from 'next/server'
import { BOOTSTRAP_CACHE_CONTROL } from '@/lib/api-cache-headers'
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
      headers: { 'Cache-Control': BOOTSTRAP_CACHE_CONTROL },
    })
  } catch (e) {
    console.error('[api/map/bootstrap]', mapId, e)
    const msg = e instanceof Error ? e.message : ''
    const status = msg.includes('database') || msg.includes('connect') ? 503 : 500
    return NextResponse.json({ error: 'bootstrap failed' }, { status })
  }
}
