import type { MapPosition } from '@/types/positions'
import { POSITIONS_EXTENDED_CALLOUTS } from './positions-callouts'

/**
 * Стартовый каталог позиций (callouts).
 *
 * `de_mirage`: в этом файле позиций нет — только `position-catalog-extensions.json`
 * (или админка каталога).
 *
 * Для остальных карт — `spawnGroup` + `positions-callouts.ts`.
 */
const SUBSPOT_DELTAS: Array<{
  key: string
  dx: number
  dy: number
  label: string
  ru: string
  uk: string
}> = [
  { key: 'default', dx: 0, dy: 0, label: 'Default', ru: 'По центру', uk: 'По центру' },
  { key: 'front', dx: 0, dy: -0.04, label: 'Front', ru: 'Спереди', uk: 'Спереду' },
  { key: 'back', dx: 0, dy: 0.04, label: 'Back', ru: 'Сзади', uk: 'Ззаду' },
  { key: 'left', dx: -0.04, dy: 0, label: 'Left', ru: 'Слева', uk: 'Зліва' },
  { key: 'right', dx: 0.04, dy: 0, label: 'Right', ru: 'Справа', uk: 'Справа' },
  { key: 'corner', dx: -0.03, dy: -0.03, label: 'Corner', ru: 'В углу', uk: 'В кутку' },
]

/**
 * Создаёт пакет «родительская позиция спавна + 6 placeholder под-точек вокруг неё».
 * Использует `de_mapId` для префиксов id (`dust2_t_spawn` и т.п.),
 * чтобы id'ы не коллизились между картами.
 */
function spawnGroup(opts: {
  mapId: string
  side: 'T' | 'CT'
  center: { x: number; y: number }
  radius?: number
}): MapPosition[] {
  const prefix = opts.mapId.replace(/^de_/, '')
  const sideKey = opts.side.toLowerCase()
  const parentId = `${prefix}_${sideKey}_spawn`
  const ru = opts.side === 'T' ? 'Т-спавн' : 'КТ-спавн'
  const uk = opts.side === 'T' ? 'Т-спавн' : 'КТ-спавн'
  const parent: MapPosition = {
    id: parentId,
    map: opts.mapId,
    side: opts.side,
    category: 'spawn',
    label: `${opts.side} Spawn`,
    label_i18n: { ru, en: `${opts.side} Spawn`, uk },
    aliases: [`${sideKey}spawn`, `${sideKey}_spawn`, 'спавн'],
    hotspot: { x: opts.center.x, y: opts.center.y, radius: opts.radius ?? 0.06 },
  }
  const subs: MapPosition[] = SUBSPOT_DELTAS.map((d) => ({
    id: `${parentId}_${d.key}`,
    parent_id: parentId,
    map: opts.mapId,
    side: opts.side,
    category: 'spawn',
    label: d.label,
    label_i18n: { ru: d.ru, en: d.label, uk: d.uk },
    point: { x: opts.center.x + d.dx, y: opts.center.y + d.dy },
  }))
  return [parent, ...subs]
}

export const positions: MapPosition[] = [
  // ─── Dust II ───────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_dust2', side: 'T', center: { x: 0.39, y: 0.91 } }),
  ...spawnGroup({ mapId: 'de_dust2', side: 'CT', center: { x: 0.62, y: 0.21 } }),

  // ─── Inferno ───────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_inferno', side: 'T', center: { x: 0.1, y: 0.67 } }),
  ...spawnGroup({ mapId: 'de_inferno', side: 'CT', center: { x: 0.9, y: 0.35 } }),

  // ─── Nuke ──────────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_nuke', side: 'T', center: { x: 0.19, y: 0.54 } }),
  ...spawnGroup({ mapId: 'de_nuke', side: 'CT', center: { x: 0.82, y: 0.45 } }),

  // ─── Overpass ──────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_overpass', side: 'T', center: { x: 0.66, y: 0.93 } }),
  ...spawnGroup({ mapId: 'de_overpass', side: 'CT', center: { x: 0.49, y: 0.2 } }),

  // ─── Anubis ────────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_anubis', side: 'T', center: { x: 0.18, y: 0.62 } }),
  ...spawnGroup({ mapId: 'de_anubis', side: 'CT', center: { x: 0.8, y: 0.35 } }),

  // ─── Ancient ───────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_ancient', side: 'T', center: { x: 0.25, y: 0.6 } }),
  ...spawnGroup({ mapId: 'de_ancient', side: 'CT', center: { x: 0.75, y: 0.4 } }),

  // ─── Cache ─────────────────────────────────────────────────────────────────
  ...spawnGroup({ mapId: 'de_cache', side: 'T', center: { x: 0.34, y: 0.83 } }),
  ...spawnGroup({ mapId: 'de_cache', side: 'CT', center: { x: 0.78, y: 0.62 } }),

  // Полные callouts (общепринятые имена зон по картам) — см. positions-callouts.ts
  ...POSITIONS_EXTENDED_CALLOUTS,
]

export function getPositionsForMap(mapId: string): MapPosition[] {
  return positions.filter((p) => p.map === mapId)
}
