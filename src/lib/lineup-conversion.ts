import { normalizeMediaUrl, normalizeMediaUrlList } from '@/lib/media-url'
import type { CustomLineup, Grenade, ThrowVariant } from '@/types'

/**
 * Pure-конвертеры между `CustomLineup` (форма админки) и `Grenade` (UI/фильтры).
 * В этом файле нет серверных импортов (`fs`, `path`) — его безопасно тянуть
 * как из серверных хелперов, так и из клиентских компонентов.
 */

function customVariantsToThrowVariants(
  vars: NonNullable<CustomLineup['throw_variants']>,
): ThrowVariant[] {
  return vars.map((v) => ({
    id: v.id,
    label: (v.label ?? 'Вариант').trim() || 'Вариант',
    start_pos: { x: v.sx, y: v.sy },
    throw_type: v.throw_type ?? 'normal',
    media_url: normalizeMediaUrl(v.video_url),
    gallery_urls: normalizeMediaUrlList(v.gallery ?? []),
    description: v.description ?? '',
    method_media_url: normalizeMediaUrl(v.method_media_url),
    method_hint: v.method_hint ?? '',
  }))
}

export function customLineupToGrenade(c: CustomLineup): Grenade {
  const rawV = c.throw_variants?.filter(Boolean) ?? []
  if (rawV.length > 0) {
    const throw_variants = customVariantsToThrowVariants(rawV)
    const first = throw_variants[0]
    return {
      id: c.id,
      map: c.map,
      title: c.title,
      type: c.type,
      side: c.side ?? 'both',
      difficulty: c.difficulty ?? 'medium',
      throw_type: first.throw_type,
      start_pos: first.start_pos,
      land_pos: { x: c.x, y: c.y },
      media_url: first.media_url,
      description: c.description,
      source: 'admin',
      gallery_urls: first.gallery_urls,
      layer_file: c.layer_file,
      throw_variants,
      position_ids: c.position_ids,
    }
  }
  const topVideo = normalizeMediaUrl(c.video_url)
  return {
    id: c.id,
    map: c.map,
    title: c.title,
    type: c.type,
    side: c.side ?? 'both',
    difficulty: c.difficulty ?? 'medium',
    throw_type: 'normal',
    start_pos: { x: c.x, y: c.y },
    land_pos: null,
    media_url: topVideo,
    description: c.description,
    source: 'admin',
    gallery_urls: normalizeMediaUrlList(c.gallery ?? []),
    layer_file: c.layer_file,
    position_ids: c.position_ids,
  }
}
