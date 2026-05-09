import fs from 'fs'
import path from 'path'
import type { CustomLineupsFile, Grenade } from '@/types'
import grenadesData from '@/data/grenades.json'
import { getMap } from '@/lib/grenades'
import { customLineupToGrenade } from '@/lib/lineup-conversion'

export { customLineupToGrenade } from '@/lib/lineup-conversion'

const DATA_REL = 'src/data/custom-lineups.json'

export function getCustomLineupsPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

export function readCustomLineupsFile(): CustomLineupsFile {
  const p = getCustomLineupsPath()
  if (!fs.existsSync(p)) return { lineups: [], hidden_seed_ids: [] }
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const d = JSON.parse(raw) as CustomLineupsFile
    return {
      lineups: Array.isArray(d.lineups) ? d.lineups : [],
      hidden_seed_ids: Array.isArray(d.hidden_seed_ids) ? d.hidden_seed_ids : [],
    }
  } catch {
    return { lineups: [], hidden_seed_ids: [] }
  }
}

export function writeCustomLineupsFile(data: CustomLineupsFile): void {
  const p = getCustomLineupsPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

export function getSeedGrenadesForMap(mapId: string): Grenade[] {
  return (grenadesData.grenades as Grenade[]).filter((g) => g.map === mapId)
}

export function getMergedGrenadesForMap(mapId: string): Grenade[] {
  const file = readCustomLineupsFile()
  const hidden = new Set(file.hidden_seed_ids ?? [])
  const custom = file.lineups.filter((l) => l.map === mapId)
  const customGrenades = custom.map(customLineupToGrenade)
  const base = (grenadesData.grenades as Grenade[]).filter(
    (g) => g.map === mapId && !hidden.has(g.id)
  )
  return [...customGrenades, ...base]
}

/**
 * Точки на первом слое карты — как при открытии `/map/...` (активен слой 0).
 * На главной такой счёт совпадает с числом значков на радаре до переключения уровня.
 */
export function getMergedGrenadesForMapFirstLayer(mapId: string): Grenade[] {
  const map = getMap(mapId)
  const layer0 = map?.layers?.[0]?.file
  if (!layer0) return getMergedGrenadesForMap(mapId)
  return getMergedGrenadesForMap(mapId).filter(
    (g) => !g.layer_file || g.layer_file === layer0
  )
}
