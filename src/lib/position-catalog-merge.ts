import type { MapPosition } from '@/types/positions'

/**
 * Статика из `positions.ts` + модерируемые дополнения/переопределения из JSON.
 * Запись в расширениях с тем же `id`, что в статике, полностью заменяет позицию.
 */
export function mergePositionCatalog(staticList: MapPosition[], extList: MapPosition[]): MapPosition[] {
  const extById = new Map(extList.map((p) => [p.id, p]))
  const seen = new Set<string>()
  const out: MapPosition[] = []
  for (const p of staticList) {
    seen.add(p.id)
    out.push(extById.get(p.id) ?? p)
  }
  for (const p of extList) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      out.push(p)
    }
  }
  return out
}
