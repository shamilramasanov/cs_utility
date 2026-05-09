import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthorized, isAdminReadAuthorized } from '@/lib/admin-auth'
import { getMaps } from '@/lib/grenades'
import type { MapPosition, PositionCategory } from '@/types/positions'
import {
  getExtensionPositionsForMap,
  readPositionCatalogExtensionsFile,
  setExtensionPositionsForMap,
  writePositionCatalogExtensionsFile,
} from '@/lib/position-catalog-extensions-store'

const CATEGORIES: PositionCategory[] = [
  'spawn',
  'a_site',
  'b_site',
  'mid',
  'rotation',
  'utility',
]

function isValidPosition(p: unknown): p is MapPosition {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id.trim()) return false
  if (typeof o.map !== 'string' || !o.map.trim()) return false
  if (o.side !== 'T' && o.side !== 'CT' && o.side !== 'both') return false
  if (typeof o.category !== 'string' || !CATEGORIES.includes(o.category as PositionCategory))
    return false
  if (typeof o.label !== 'string' || !o.label.trim()) return false
  if (o.parent_id !== undefined && typeof o.parent_id !== 'string') return false
  return true
}

/** Админ: текущие записи расширений (по карте или все). */
export async function GET(req: NextRequest) {
  if (!isAdminReadAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const mapId = req.nextUrl.searchParams.get('map')
  const file = readPositionCatalogExtensionsFile()
  if (mapId) {
    return NextResponse.json({ positions: file.positions.filter((p) => p.map === mapId) })
  }
  return NextResponse.json({ positions: file.positions })
}

interface PostBody {
  secret?: string
  map?: string
  positions?: unknown[]
}

/**
 * Полностью заменяет расширения каталога для одной карты.
 * Корневые позиции без parent_id; sub-spot'ы — с parent_id.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody
    if (!isAdminAuthorized(req, body.secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.map || typeof body.map !== 'string') {
      return NextResponse.json({ error: 'map is required' }, { status: 400 })
    }
    if (!Array.isArray(body.positions)) {
      return NextResponse.json({ error: 'positions array required' }, { status: 400 })
    }
    const next: MapPosition[] = []
    for (const raw of body.positions) {
      if (!isValidPosition(raw)) continue
      const p = raw as MapPosition
      if (p.map !== body.map) continue
      next.push({ ...p, id: p.id.trim(), map: p.map.trim() })
    }
    setExtensionPositionsForMap(body.map, next)

    revalidatePath('/')
    revalidatePath('/admin/catalog')
    revalidatePath(`/admin/catalog/${body.map}`)
    getMaps().forEach((m) => {
      revalidatePath(`/map/${m.id}`)
      revalidatePath(`/admin/${m.id}`)
    })
    return NextResponse.json({ ok: true, positions: getExtensionPositionsForMap(body.map) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}

/** Убрать одну запись расширения по id (только для этой карты). */
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const mapId = req.nextUrl.searchParams.get('map')
  const id = req.nextUrl.searchParams.get('id')
  if (!mapId || !id) {
    return NextResponse.json({ error: 'map and id are required' }, { status: 400 })
  }
  const file = readPositionCatalogExtensionsFile()
  const rest = file.positions.filter((p) => !(p.map === mapId && p.id === id))
  writePositionCatalogExtensionsFile({ positions: rest })

  revalidatePath('/')
  revalidatePath(`/admin/catalog/${mapId}`)
  revalidatePath(`/map/${mapId}`)
  revalidatePath(`/admin/${mapId}`)
  return NextResponse.json({ ok: true })
}
