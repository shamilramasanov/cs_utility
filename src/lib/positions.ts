import type { Grenade, Side } from '@/types'
import type { MapPosition } from '@/types/positions'
import { positions as STATIC_POSITIONS } from '@/data/positions'
import { sideKeyToSide, type SideKey } from './side'

const DEFAULT_RADIUS = 0.05

/** Полный справочник позиций (все карты, включая sub-spot'ы). По умолчанию — только бандл. */
export type PositionCatalog = MapPosition[]

/**
 * Корневые позиции карты — без sub-spot'ов (sub-spots показываются как
 * «второй ярус» только после выбора родителя в `SubspotPicker`).
 */
export function getAllPositionsForMap(
  mapId: string,
  catalog: PositionCatalog = STATIC_POSITIONS,
): MapPosition[] {
  return catalog.filter((p) => p.map === mapId && !p.parent_id)
}

/**
 * Позиции, релевантные выбранной стороне.
 * Включаем `both` — общие локации (mid, sites, и т.д.).
 */
export function getPositionsByMapAndSide(
  mapId: string,
  side: SideKey,
  catalog: PositionCatalog = STATIC_POSITIONS,
): MapPosition[] {
  const target = sideKeyToSide(side)
  return catalog.filter(
    (p) =>
      p.map === mapId &&
      !p.parent_id &&
      (p.side === target || p.side === 'both'),
  )
}

export function getPositionById(
  id: string,
  catalog: PositionCatalog = STATIC_POSITIONS,
): MapPosition | undefined {
  return catalog.find((p) => p.id === id)
}

/** Sub-spot'ы (под-позиции) родительской позиции. */
export function getSubspotsForPosition(
  parentId: string,
  catalog: PositionCatalog = STATIC_POSITIONS,
): MapPosition[] {
  return catalog.filter((p) => p.parent_id === parentId)
}

/** Есть ли вообще sub-spot'ы у позиции. */
export function hasSubspots(
  parentId: string,
  catalog: PositionCatalog = STATIC_POSITIONS,
): boolean {
  return catalog.some((p) => p.parent_id === parentId)
}

/**
 * Подходит ли граната к данной позиции.
 *
 * Правила:
 * 1) Если у гранаты явно проставлены `position_ids[]` — она матчится с `pos`,
 *    если её id или id любого её sub-spot'а есть в массиве (это позволяет
 *    «гранатам со spot'a» автоматически попадать и в фильтр родителя).
 * 2) Иначе — геометрия: hotspot позиции (или sub-spot `point`) сравниваем с точкой
 *    прилёта `land_pos`, стартом броска и стартами всех вариантов — чтобы фильтр по коллауту
 *    совпадал с маркером «куда падает» на радаре.
 */
function belongsToPositionRecursive(
  grenade: Grenade,
  pos: MapPosition,
  catalog: PositionCatalog,
  visited: Set<string>,
): boolean {
  if (grenade.position_ids && grenade.position_ids.length > 0) {
    if (grenade.position_ids.includes(pos.id)) return true
    if (!pos.parent_id) {
      const subspotIds = catalog
        .filter((p) => p.parent_id === pos.id)
        .map((p) => p.id)
      if (subspotIds.some((id) => grenade.position_ids!.includes(id))) return true
    }
    return false
  }

  if (visited.has(pos.id)) return false
  visited.add(pos.id)

  const center =
    pos.hotspot ??
    (pos.point ? { x: pos.point.x, y: pos.point.y, radius: DEFAULT_RADIUS } : null)
  if (!center) {
    // У родителя может не быть собственного hotspot/point, но граната принадлежит его sub-spot'у.
    if (!pos.parent_id) {
      const children = catalog.filter((p) => p.parent_id === pos.id)
      if (children.some((child) => belongsToPositionRecursive(grenade, child, catalog, visited)))
        return true
    }
    return false
  }
  const radius = pos.hotspot?.radius ?? DEFAULT_RADIUS
  const r2 = radius * radius

  const candidates: Array<{ x: number; y: number }> = []
  if (grenade.land_pos) {
    candidates.push(grenade.land_pos)
  }
  candidates.push(grenade.start_pos)
  if (grenade.throw_variants) {
    for (const v of grenade.throw_variants) candidates.push(v.start_pos)
  }
  const matchedBySelf = candidates.some((p) => {
    const dx = p.x - center.x
    const dy = p.y - center.y
    return dx * dx + dy * dy <= r2
  })
  if (matchedBySelf) return true
  // Для корневой позиции также учитываем матчи её дочерних sub-spot'ов.
  if (!pos.parent_id) {
    const children = catalog.filter((p) => p.parent_id === pos.id)
    if (children.some((child) => belongsToPositionRecursive(grenade, child, catalog, visited)))
      return true
  }
  return false
}

export function belongsToPosition(
  grenade: Grenade,
  pos: MapPosition,
  catalog: PositionCatalog = STATIC_POSITIONS,
): boolean {
  return belongsToPositionRecursive(grenade, pos, catalog, new Set())
}

/**
 * Найти ближайшую позицию (в той же стороне) к точке.
 * Если ни одна не в радиусе — возвращает `null`.
 */
export function findNearestPosition(
  mapId: string,
  side: Side,
  point: { x: number; y: number },
  catalog: PositionCatalog = STATIC_POSITIONS,
): MapPosition | null {
  let best: { p: MapPosition; d2: number; r2: number } | null = null
  const list = catalog.filter(
    (p) => p.map === mapId && (p.side === side || p.side === 'both' || side === 'both'),
  )
  for (const p of list) {
    if (!p.hotspot) continue
    const dx = point.x - p.hotspot.x
    const dy = point.y - p.hotspot.y
    const d2 = dx * dx + dy * dy
    const r = p.hotspot.radius ?? DEFAULT_RADIUS
    const r2 = r * r
    if (d2 > r2) continue
    if (!best || d2 < best.d2) best = { p, d2, r2 }
  }
  return best?.p ?? null
}

export function filterGrenadesByPosition(
  grenades: Grenade[],
  pos: MapPosition,
  catalog: PositionCatalog = STATIC_POSITIONS,
): Grenade[] {
  return grenades.filter((g) => belongsToPosition(g, pos, catalog))
}

/** Сколько «способов сыграть» у гранаты: варианты броска или одна точка без вариантов. */
function playableThrowVariantCount(g: Grenade): number {
  const vars = g.throw_variants?.filter((v) => v?.start_pos) ?? []
  if (vars.length > 0) return vars.length
  return 1
}

/**
 * Сколько раскидок относится к позиции — для бейджа в списке.
 * Одна запись с несколькими `throw_variants` даёт несколько (как у коннектора с двумя бросками).
 */
export function countGrenadesForPosition(
  grenades: Grenade[],
  pos: MapPosition,
  catalog: PositionCatalog = STATIC_POSITIONS,
): number {
  let n = 0
  for (const g of grenades) {
    if (!belongsToPosition(g, pos, catalog)) continue
    n += playableThrowVariantCount(g)
  }
  return n
}

function isStillImageUrl(url: string): boolean {
  const u = url.split('?')[0]?.toLowerCase() ?? ''
  return /\.(jpe?g|png|webp|gif)$/i.test(u)
}

/** Кадры галереи гранаты (по вариантам броска, затем корневая галерея), только картинки. */
function collectGrenadeGalleryStillUrls(g: Grenade): string[] {
  const out: string[] = []
  const push = (raw: string | undefined) => {
    const u = raw?.trim()
    if (!u || !isStillImageUrl(u) || out.includes(u)) return
    out.push(u)
  }
  if (g.throw_variants?.length) {
    for (const v of g.throw_variants) {
      for (const x of v.gallery_urls ?? []) push(x)
    }
  }
  for (const x of g.gallery_urls ?? []) push(x)
  return out
}

/**
 * Картинка для карточки позиции: в приоритете 4-й кадр галереи раскидки,
 * иначе 3-й → 2-й → 1-й (если кадров меньше четырёх).
 */
export function pickPositionCardLineupPhoto(
  grenades: Grenade[],
  pos: MapPosition,
  catalog: PositionCatalog = STATIC_POSITIONS,
): string | undefined {
  for (const g of grenades) {
    if (!belongsToPosition(g, pos, catalog)) continue
    const urls = collectGrenadeGalleryStillUrls(g)
    if (urls[3]) return urls[3]
    if (urls[2]) return urls[2]
    if (urls[1]) return urls[1]
    if (urls[0]) return urls[0]
  }
  return undefined
}
