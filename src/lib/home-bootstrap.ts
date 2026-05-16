import grenadesData from '@/data/grenades.json'
import { positions as STATIC_POSITIONS } from '@/data/positions'
import { buildLineupFeedItems } from '@/lib/lineup-feed'
import { getMaps, getMap } from '@/lib/grenades'
import { getEditorContentBundle } from '@/lib/editor-content-bundle'
import { EDITOR_KEYS, isEditorDatabaseEnabled } from '@/lib/editor-db'
import { customLineupToGrenade } from '@/lib/lineup-conversion'
import { readJsonFromRepo } from '@/lib/safe-fs-json'
import { mergePositionCatalog } from '@/lib/position-catalog-merge'
import { getAllPositionsForMap } from '@/lib/positions'
import { pickZones } from '@/lib/position-zones'
import type { CustomLineupsFile, Grenade } from '@/types'
import type { MapPosition, PositionZone, PositionZonesFile } from '@/types/positions'

const LINEUPS_REL = 'src/data/custom-lineups.json'
const EXT_REL = 'src/data/position-catalog-extensions.json'
const ZONES_REL = 'src/data/position-zones.json'

function normalizeLineups(raw: unknown): CustomLineupsFile {
  if (!raw || typeof raw !== 'object') return { lineups: [], hidden_seed_ids: [] }
  const d = raw as CustomLineupsFile
  return {
    lineups: Array.isArray(d.lineups) ? d.lineups : [],
    hidden_seed_ids: Array.isArray(d.hidden_seed_ids) ? d.hidden_seed_ids : [],
  }
}

function normalizeExtensions(raw: unknown): MapPosition[] {
  if (!raw || typeof raw !== 'object') return []
  const d = raw as { positions?: MapPosition[] }
  return Array.isArray(d.positions) ? d.positions : []
}

function normalizeZonesFile(raw: unknown): PositionZonesFile {
  if (!raw || typeof raw !== 'object') return { maps: {} }
  const data = raw as PositionZonesFile
  return { maps: data.maps ?? {} }
}

function mergedGrenadesForMap(file: CustomLineupsFile, mapId: string): Grenade[] {
  const hidden = new Set(file.hidden_seed_ids ?? [])
  const custom = file.lineups.filter((l) => l.map === mapId).map(customLineupToGrenade)
  const base = (grenadesData.grenades as Grenade[]).filter(
    (g) => g.map === mapId && !hidden.has(g.id),
  )
  return [...custom, ...base]
}

function firstLayerGrenades(mapId: string, merged: Grenade[]): Grenade[] {
  const layer0 = getMap(mapId)?.layers?.[0]?.file
  if (!layer0) return merged
  return merged.filter((g) => !g.layer_file || g.layer_file === layer0)
}

function zonesForMapSides(
  mapId: string,
  catalog: MapPosition[],
  zonesFile: PositionZonesFile,
): { t: PositionZone[]; ct: PositionZone[] } {
  const positions = getAllPositionsForMap(mapId, catalog)
  return {
    t: pickZones(zonesFile.maps?.[mapId]?.t, positions, 't'),
    ct: pickZones(zonesFile.maps?.[mapId]?.ct, positions, 'ct'),
  }
}

async function loadEditorBootstrapData(): Promise<{
  lineupsFile: CustomLineupsFile
  extensionPositions: MapPosition[]
  zonesFile: PositionZonesFile
}> {
  if (isEditorDatabaseEnabled()) {
    const rows = await getEditorContentBundle()
    return {
      lineupsFile:
        rows?.[EDITOR_KEYS.custom_lineups] != null
          ? normalizeLineups(rows[EDITOR_KEYS.custom_lineups])
          : readJsonFromRepo(LINEUPS_REL, { lineups: [], hidden_seed_ids: [] }, normalizeLineups),
      extensionPositions:
        rows?.[EDITOR_KEYS.position_catalog_extensions] != null
          ? normalizeExtensions(rows[EDITOR_KEYS.position_catalog_extensions])
          : readJsonFromRepo(EXT_REL, { positions: [] }, (r) => ({
              positions: normalizeExtensions(r),
            })).positions,
      zonesFile:
        rows?.[EDITOR_KEYS.position_zones] != null
          ? normalizeZonesFile(rows[EDITOR_KEYS.position_zones])
          : readJsonFromRepo(ZONES_REL, { maps: {} }, normalizeZonesFile),
    }
  }
  return {
    lineupsFile: readJsonFromRepo(LINEUPS_REL, { lineups: [], hidden_seed_ids: [] }, normalizeLineups),
    extensionPositions: readJsonFromRepo(EXT_REL, { positions: [] }, (r) => ({
      positions: normalizeExtensions(r),
    })).positions,
    zonesFile: readJsonFromRepo(ZONES_REL, { maps: {} }, normalizeZonesFile),
  }
}

export async function buildMapBootstrapPayload(mapId: string) {
  const { lineupsFile, extensionPositions, zonesFile } = await loadEditorBootstrapData()
  const positionCatalog = mergePositionCatalog(STATIC_POSITIONS, extensionPositions)
  return {
    initialGrenades: mergedGrenadesForMap(lineupsFile, mapId),
    positionCatalog,
    zonesBySide: zonesForMapSides(mapId, positionCatalog, zonesFile),
  }
}

export async function buildHomeBootstrapPayload() {
  const { lineupsFile, extensionPositions } = await loadEditorBootstrapData()

  const maps = getMaps()
  const grenadesByMap: Record<string, Grenade[]> = {}
  const mapsWithCounts: { map: (typeof maps)[0]; grenadeCount: number }[] = []

  for (const map of maps) {
    const merged = mergedGrenadesForMap(lineupsFile, map.id)
    grenadesByMap[map.id] = merged
    mapsWithCounts.push({ map, grenadeCount: firstLayerGrenades(map.id, merged).length })
  }

  const positionCatalog = mergePositionCatalog(STATIC_POSITIONS, extensionPositions)
  const lineupFeedItems = await buildLineupFeedItems(positionCatalog, lineupsFile)

  return { mapsWithCounts, grenadesByMap, positionCatalog, lineupFeedItems }
}
