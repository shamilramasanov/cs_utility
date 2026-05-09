import type { SideKey } from '@/lib/side'
import { getPositionsByMapAndSide, type PositionCatalog } from '@/lib/positions'
import { positions as STATIC_POSITIONS } from '@/data/positions'
import type { MapPosition, PositionZone } from '@/types/positions'

function normalizeId(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_ -]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
}

export function getDefaultZonesForPositions(positions: MapPosition[]): PositionZone[] {
  const byCategory = new Map<string, string[]>()
  for (const p of positions) {
    const arr = byCategory.get(p.category) ?? []
    arr.push(p.id)
    byCategory.set(p.category, arr)
  }

  const a = byCategory.get('a_site') ?? []
  const mid = byCategory.get('mid') ?? []
  const b = byCategory.get('b_site') ?? []

  const zones: PositionZone[] = [
    { id: 'a', label: 'Точка A', order: 1, position_ids: a },
    { id: 'mid', label: 'Мид', order: 2, position_ids: mid },
    { id: 'b', label: 'Точка B', order: 3, position_ids: b },
  ]
  const nonEmpty = zones.filter((z) => z.position_ids.length > 0)
  if (nonEmpty.length > 0) return nonEmpty
  return [
    {
      id: 'all',
      label: 'Все позиции',
      order: 1,
      position_ids: positions.map((p) => p.id),
    },
  ]
}

export function sanitizeZones(
  zones: PositionZone[],
  _allowedPositions: MapPosition[],
): PositionZone[] {
  return zones
    .map((z, idx) => {
      const id = normalizeId(z.id || z.label || `zone_${idx + 1}`)
      const label = (z.label ?? '').trim() || `Зона ${idx + 1}`
      const position_ids = Array.from(
        new Set(
          (z.position_ids ?? [])
            .map((id) => String(id).trim())
            .filter((id) => id.length > 0),
        ),
      )
      const disabled_position_ids = Array.from(
        new Set((z.disabled_position_ids ?? []).filter((id) => position_ids.includes(id))),
      )
      return {
        id,
        label,
        image_url: z.image_url?.trim() || undefined,
        order: Number.isFinite(z.order) ? z.order : idx + 1,
        position_ids,
        disabled_position_ids,
      }
    })
    .filter((z) => z.id && z.label)
    .sort((a, b) => a.order - b.order)
}

export function getZoneIdForPositionOnSide(
  mapId: string,
  positionId: string,
  sideKey: SideKey,
  catalog: PositionCatalog = STATIC_POSITIONS,
): string {
  const positionsForSide = getPositionsByMapAndSide(mapId, sideKey, catalog)
  const zones = getDefaultZonesForPositions(positionsForSide)
  for (const z of zones) {
    if (z.position_ids.includes(positionId)) return z.id
  }
  const all = zones.find((z) => z.id === 'all')
  if (all?.position_ids.includes(positionId)) return 'all'
  return zones[0]?.id ?? 'all'
}

export function pickZones(
  stored: PositionZone[] | undefined,
  positions: MapPosition[],
  _side: SideKey,
): PositionZone[] {
  const defaults = getDefaultZonesForPositions(positions)
  if (!stored || stored.length === 0) return defaults
  return sanitizeZones(stored, positions)
}