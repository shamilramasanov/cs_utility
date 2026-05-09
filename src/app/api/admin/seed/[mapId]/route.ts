import { NextRequest, NextResponse } from 'next/server'
import { getSeedGrenadesForMap } from '@/lib/lineups'
import { isAdminReadAuthorized } from '@/lib/admin-auth'

interface Ctx {
  params: Promise<{ mapId: string }>
}

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!isAdminReadAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { mapId } = await ctx.params
  return NextResponse.json({ grenades: getSeedGrenadesForMap(mapId) })
}
