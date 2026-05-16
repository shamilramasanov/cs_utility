/** Снимок query для `/map/[mapId]`: сервер и первый кадр клиента строят один и тот же `URLSearchParams` (без расхождений с `useSearchParams()`). */

export type MapPageInitialQuery = {
  pos: string | null
  spot: string | null
  zone: string | null
  side: string | null
  pnade: string | null
  tab: string | null
  lineup: string | null
  variant: string | null
}

export function firstSearchParam(
  value: string | string[] | undefined | null,
): string | null {
  if (value === undefined || value === null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export function mapPageQueryFromRecord(
  sp: Record<string, string | string[] | undefined | null>,
): MapPageInitialQuery {
  return {
    pos: firstSearchParam(sp.pos),
    spot: firstSearchParam(sp.spot),
    zone: firstSearchParam(sp.zone),
    side: firstSearchParam(sp.side),
    pnade: firstSearchParam(sp.pnade),
    tab: firstSearchParam(sp.tab),
    lineup: firstSearchParam(sp.lineup),
    variant: firstSearchParam(sp.variant),
  }
}

export function toURLSearchParamsFromMapQuery(s: MapPageInitialQuery): URLSearchParams {
  const u = new URLSearchParams()
  if (s.pos) u.set('pos', s.pos)
  if (s.spot) u.set('spot', s.spot)
  if (s.zone) u.set('zone', s.zone)
  if (s.side) u.set('side', s.side)
  if (s.pnade) u.set('pnade', s.pnade)
  if (s.tab) u.set('tab', s.tab)
  if (s.lineup) u.set('lineup', s.lineup)
  if (s.variant) u.set('variant', s.variant)
  return u
}
