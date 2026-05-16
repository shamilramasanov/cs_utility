import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import type { MapPosition } from '@/types/positions'
import { getEditorContentBundle } from '@/lib/editor-content-bundle'
import { EDITOR_KEYS, editorDbGetJson, editorDbSetJson, isEditorDatabaseEnabled } from '@/lib/editor-db'
import { readJsonFromRepo } from '@/lib/safe-fs-json'

const DATA_REL = 'src/data/position-catalog-extensions.json'

function getPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

export interface PositionCatalogExtensionsFile {
  positions: MapPosition[]
}

function readFromDisk(): PositionCatalogExtensionsFile {
  return readJsonFromRepo(DATA_REL, { positions: [] }, normalize)
}

function writeToDisk(data: PositionCatalogExtensionsFile): void {
  const p = getPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

function normalize(raw: unknown): PositionCatalogExtensionsFile {
  if (!raw || typeof raw !== 'object') return { positions: [] }
  const data = raw as PositionCatalogExtensionsFile
  return { positions: Array.isArray(data.positions) ? data.positions : [] }
}

export const readPositionCatalogExtensionsFile = cache(
  async (): Promise<PositionCatalogExtensionsFile> => {
    const bundle = await getEditorContentBundle()
    if (bundle?.[EDITOR_KEYS.position_catalog_extensions] != null) {
      return normalize(bundle[EDITOR_KEYS.position_catalog_extensions])
    }
    if (isEditorDatabaseEnabled()) {
      const row = await editorDbGetJson(EDITOR_KEYS.position_catalog_extensions)
      if (row != null) return normalize(row)
    }
    return readFromDisk()
  },
)

export async function writePositionCatalogExtensionsFile(
  data: PositionCatalogExtensionsFile,
): Promise<void> {
  if (isEditorDatabaseEnabled()) {
    await editorDbSetJson(EDITOR_KEYS.position_catalog_extensions, data)
    return
  }
  writeToDisk(data)
}

export async function getExtensionPositionsForMap(mapId: string): Promise<MapPosition[]> {
  const file = await readPositionCatalogExtensionsFile()
  return file.positions.filter((p) => p.map === mapId)
}

/** Полностью заменяет расширения для карты (остальные карты не трогаем). */
export async function setExtensionPositionsForMap(
  mapId: string,
  positions: MapPosition[],
): Promise<void> {
  const file = await readPositionCatalogExtensionsFile()
  const rest = file.positions.filter((p) => p.map !== mapId)
  await writePositionCatalogExtensionsFile({ positions: [...rest, ...positions] })
}
