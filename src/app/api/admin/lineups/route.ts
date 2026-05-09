import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { readCustomLineupsFile, writeCustomLineupsFile } from '@/lib/lineups'
import { getMaps } from '@/lib/grenades'
import type { CustomLineup, CustomLineupsFile } from '@/types'
import { isAdminAuthorized, isAdminReadAuthorized } from '@/lib/admin-auth'
import { jsonFromAdminWriteCatch, statusFromAdminWriteCatch } from '@/lib/admin-api-write-error'

export async function GET(req: NextRequest) {
  if (!isAdminReadAuthorized(req)) {
    return NextResponse.json(
      { error: 'Задайте ADMIN_SECRET в .env для production' },
      { status: 401 }
    )
  }
  return NextResponse.json(await readCustomLineupsFile())
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      secret?: string
      lineups?: CustomLineup[]
      hidden_seed_ids?: string[]
    }
    if (!isAdminAuthorized(req, body.secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const cur = await readCustomLineupsFile()
    const data: CustomLineupsFile = {
      lineups: Array.isArray(body.lineups) ? body.lineups : cur.lineups,
      hidden_seed_ids: Array.isArray(body.hidden_seed_ids)
        ? body.hidden_seed_ids
        : cur.hidden_seed_ids ?? [],
    }
    await writeCustomLineupsFile(data)
    revalidatePath('/')
    getMaps().forEach((m) => revalidatePath(`/map/${m.id}`))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(jsonFromAdminWriteCatch(e), { status: statusFromAdminWriteCatch(e) })
  }
}
