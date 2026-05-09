import fs from 'fs'
import path from 'path'
import type { PositionZonesFile, PositionZone } from '@/types/positions'
import { EDITOR_KEYS, editorDbGetJson, editorDbSetJson, isEditorDatabaseEnabled } from '@/lib/editor-db'

const DATA_REL = 'src/data/position-zones.json'

function getPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

function readFromDisk(): PositionZonesFile {
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

function writeToDisk(data: PositionZonesFile): void {
  const p = getPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

function normalize(raw: unknown): PositionZonesFile {
  if (!raw || typeof raw !== 'object') return { maps: {} }
  const data = raw as PositionZonesFile
  return { maps: data.maps ?? {} }
}

export async function readPositionZonesFile(): Promise<PositionZonesFile> {
  if (isEditorDatabaseEnabled()) {
    const row = await editorDbGetJson(EDITOR_KEYS.position_zones)
    if (row != null) return normalize(row)
  }
  return readFromDisk()
}

export async function writePositionZonesFile(data: PositionZonesFile): Promise<void> {
  if (isEditorDatabaseEnabled()) {
    await editorDbSetJson(EDITOR_KEYS.position_zones, data)
    return
  }
  writeToDisk(data)
}

export async function getStoredZones(
  mapId: string,
  side: 't' | 'ct',
): Promise<PositionZone[] | undefined> {
  const file = await readPositionZonesFile()
  return file.maps?.[mapId]?.[side]
}

export async function setStoredZones(
  mapId: string,
  side: 't' | 'ct',
  zones: PositionZone[],
): Promise<PositionZonesFile> {
  const file = await readPositionZonesFile()
  const curMap = file.maps[mapId] ?? {}
  file.maps[mapId] = { ...curMap, [side]: zones }
  await writePositionZonesFile(file)
  return file
}
