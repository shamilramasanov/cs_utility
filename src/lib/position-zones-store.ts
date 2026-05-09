import fs from 'fs'
import path from 'path'
import type { PositionZonesFile, PositionZone } from '@/types/positions'

const DATA_REL = 'src/data/position-zones.json'

function getPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

export function readPositionZonesFile(): PositionZonesFile {
  const p = getPath()
  if (!fs.existsSync(p)) return { maps: {} }
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const data = JSON.parse(raw) as PositionZonesFile
    return { maps: data.maps ?? {} }
  } catch {
    return { maps: {} }
  }
}

export function writePositionZonesFile(data: PositionZonesFile): void {
  const p = getPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

export function getStoredZones(
  mapId: string,
  side: 't' | 'ct',
): PositionZone[] | undefined {
  const file = readPositionZonesFile()
  return file.maps?.[mapId]?.[side]
}

export function setStoredZones(
  mapId: string,
  side: 't' | 'ct',
  zones: PositionZone[],
): PositionZonesFile {
  const file = readPositionZonesFile()
  const curMap = file.maps[mapId] ?? {}
  file.maps[mapId] = { ...curMap, [side]: zones }
  writePositionZonesFile(file)
  return file
}

