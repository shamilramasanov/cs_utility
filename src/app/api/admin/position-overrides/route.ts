import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  readPositionOverridesFile,
  writePositionOverridesFile,
} from '@/lib/position-overrides'
import type { PositionOverride } from '@/types/positions'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { getMaps } from '@/lib/grenades'

/**
 * Публично читаем (нужно клиенту, чтобы подмешивать `screenshot_url` в picker).
 * Никаких секретов внутри нет.
 */
export async function GET() {
  return NextResponse.json(readPositionOverridesFile())
}

interface PatchBody {
  id?: string
  patch?: PositionOverride | null
  secret?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PatchBody
    if (!isAdminAuthorized(req, body.secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const cur = readPositionOverridesFile()
    if (body.patch === null) {
      delete cur.overrides[body.id]
    } else {
      const prev = cur.overrides[body.id] ?? {}
      cur.overrides[body.id] = { ...prev, ...(body.patch ?? {}) }
    }
    writePositionOverridesFile(cur)

    // Для пользовательских страниц с `force-dynamic` это no-op, но не помешает.
    revalidatePath('/')
    getMaps().forEach((m) => revalidatePath(`/map/${m.id}`))

    return NextResponse.json({ ok: true, overrides: cur.overrides })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
