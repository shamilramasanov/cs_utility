import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { readJsonFromRepo } from '@/lib/safe-fs-json'
import type { CustomLineupsFile, Grenade } from '@/types'
import grenadesData from '@/data/grenades.json'
import { getMap } from '@/lib/grenades'
import { customLineupToGrenade } from '@/lib/lineup-conversion'
import { EDITOR_KEYS, editorDbGetJson, editorDbSetJson, isEditorDatabaseEnabled } from '@/lib/editor-db'

export { customLineupToGrenade } from '@/lib/lineup-conversion'

const DATA_REL = 'src/data/custom-lineups.json'

export function getCustomLineupsPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

function readCustomLineupsFromDisk(): CustomLineupsFile {
  return readJsonFromRepo(DATA_REL, { lineups: [], hidden_seed_ids: [] }, (raw) =>
    normalizeCustomLineupsFile(raw),
  )
}

function writeCustomLineupsToDisk(data: CustomLineupsFile): void {
  const p = getCustomLineupsPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

function normalizeCustomLineupsFile(raw: unknown): CustomLineupsFile {
  if (!raw || typeof raw !== 'object') return { lineups: [], hidden_seed_ids: [] }
  const d = raw as CustomLineupsFile
  return {
    lineups: Array.isArray(d.lineups) ? d.lineups : [],
    hidden_seed_ids: Array.isArray(d.hidden_seed_ids) ? d.hidden_seed_ids : [],
  }
}

/** Слияние кастомных раскидок: при наличии БД — строка `custom_lineups`, иначе JSON в репо. */
export const readCustomLineupsFile = cache(async (): Promise<CustomLineupsFile> => {
  if (isEditorDatabaseEnabled()) {
    const row = await editorDbGetJson(EDITOR_KEYS.custom_lineups)
    if (row != null) return normalizeCustomLineupsFile(row)
  }
  return readCustomLineupsFromDisk()
})

export async function writeCustomLineupsFile(data: CustomLineupsFile): Promise<void> {
  if (isEditorDatabaseEnabled()) {
    await editorDbSetJson(EDITOR_KEYS.custom_lineups, data)
    return
  }
  writeCustomLineupsToDisk(data)
}

export function getSeedGrenadesForMap(mapId: string): Grenade[] {
  return (grenadesData.grenades as Grenade[]).filter((g) => g.map === mapId)
}

export async function getMergedGrenadesForMap(mapId: string): Promise<Grenade[]> {
  const file = await readCustomLineupsFile()
  const hidden = new Set(file.hidden_seed_ids ?? [])
  const custom = file.lineups.filter((l) => l.map === mapId)
  const customGrenades = custom.map(customLineupToGrenade)
  const base = (grenadesData.grenades as Grenade[]).filter(
    (g) => g.map === mapId && !hidden.has(g.id),
  )
  return [...customGrenades, ...base]
}

/** Для RSC страницы карты: кэш до 60 с, чтобы не читать диск/БД на каждый запрос. */
export const getMergedGrenadesForMapCached = unstable_cache(
  async (mapId: string) => getMergedGrenadesForMap(mapId),
  ['merged-grenades'],
  { revalidate: 60, tags: ['lineups', 'map-lineups'] },
)

/**
 * Точки на первом слое карты — как при открытии `/map/...` (активен слой 0).
 * На главной такой счёт совпадает с числом значков на радаре до переключения уровня.
 */
export async function getMergedGrenadesForMapFirstLayer(mapId: string): Promise<Grenade[]> {
  const map = getMap(mapId)
  const layer0 = map?.layers?.[0]?.file
  const merged = await getMergedGrenadesForMap(mapId)
  if (!layer0) return merged
  return merged.filter((g) => !g.layer_file || g.layer_file === layer0)
}

export async function getGrenadeById(id: string): Promise<Grenade | null> {
  const file = await readCustomLineupsFile()
  const custom = file.lineups.find((l) => l.id === id)
  if (custom) return customLineupToGrenade(custom)
  const seed = (grenadesData.grenades as Grenade[]).find((g) => g.id === id)
  return seed ?? null
}
