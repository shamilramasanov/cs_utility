import { getGrenadeById } from '@/lib/lineups'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const grenade = await getGrenadeById(id)
  if (!grenade) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }
  return Response.json(grenade)
}
