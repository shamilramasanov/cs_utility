import type { MapPoint, RolePlan, Tactic, TacticStep, TeamRole } from '@/types/tactics'
import { getPositionById } from '@/lib/positions'

/** Примерные точки Mirage T default A, если в каталоге нет position_id. */
const MIRAGE_FALLBACK: Record<string, MapPoint> = {
  t_spawn: { x: 0.87, y: 0.36 },
  top_mid: { x: 0.62, y: 0.42 },
  stairs: { x: 0.52, y: 0.32 },
  a_site: { x: 0.42, y: 0.22 },
  connector: { x: 0.48, y: 0.38 },
  apartments: { x: 0.72, y: 0.55 },
  market: { x: 0.58, y: 0.48 },
}

export function resolveStepPoint(step: TacticStep): MapPoint | null {
  if (step.grenade_marker) return step.grenade_marker
  if (step.path?.length) return step.path[step.path.length - 1]
  if (!step.position_id) return null
  const pos = getPositionById(step.position_id)
  if (pos?.hotspot) return { x: pos.hotspot.x, y: pos.hotspot.y }
  return MIRAGE_FALLBACK[step.position_id] ?? null
}

export function pathsForRole(plan: RolePlan | null): MapPoint[][] {
  if (!plan) return []
  const out: MapPoint[][] = []
  for (const step of plan.steps) {
    if (step.path && step.path.length >= 2) out.push(step.path)
  }
  return out
}

export function markersForRole(
  plan: RolePlan | null,
  roleColor: string,
): Array<{ point: MapPoint; color: string; kind: string }> {
  if (!plan) return []
  const markers: Array<{ point: MapPoint; color: string; kind: string }> = []
  for (const step of plan.steps) {
    const p = resolveStepPoint(step)
    if (!p) continue
    markers.push({
      point: p,
      color: step.grenade_id ? '#F0B429' : roleColor,
      kind: step.kind,
    })
  }
  return markers
}

export function overviewTarget(tactic: Tactic): (MapPoint & { label?: string }) | null {
  return tactic.tactic_overview?.exec_target ?? null
}
