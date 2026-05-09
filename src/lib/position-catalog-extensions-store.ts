import fs from 'fs'
import path from 'path'
import type { MapPosition } from '@/types/positions'

const DATA_REL = 'src/data/position-catalog-extensions.json'

function getPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

export interface PositionCatalogExtensionsFile {
  positions: MapPosition[]
}

export function readPositionCatalogExtensionsFile(): PositionCatalogExtensionsFile {
  const p = getPath()
  if (!fs.existsSync(p)) return { positions: [] }
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const data = JSON.parse(raw) as PositionCatalogExtensionsFile
    return { positions: Array.isArray(data.positions) ? data.positions : [] }
  } catch {
    return { positions: [] }
  }
}

export function writePositionCatalogExtensionsFile(data: PositionCatalogExtensionsFile): void {
  const p = getPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

export function getExtensionPositionsForMap(mapId: string): MapPosition[] {
  return readPositionCatalogExtensionsFile().positions.filter((p) => p.map === mapId)
}

/** Полностью заменяет расширения для карты (остальные карты не трогаем). */
export function setExtensionPositionsForMap(mapId: string, positions: MapPosition[]): void {
  const file = readPositionCatalogExtensionsFile()
  const rest = file.positions.filter((p) => p.map !== mapId)
  writePositionCatalogExtensionsFile({ positions: [...rest, ...positions] })
}
