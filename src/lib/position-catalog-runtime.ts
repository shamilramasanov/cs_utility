import { positions as STATIC_POSITIONS } from '@/data/positions'
import type { MapPosition } from '@/types/positions'
import { mergePositionCatalog } from '@/lib/position-catalog-merge'
import { readPositionCatalogExtensionsFile } from '@/lib/position-catalog-extensions-store'

/** Полный каталог (бандл + JSON) — только на сервере / в API. */
export async function getMergedPositionCatalog(): Promise<MapPosition[]> {
  const { positions: ext } = await readPositionCatalogExtensionsFile()
  return mergePositionCatalog(STATIC_POSITIONS, ext)
}
