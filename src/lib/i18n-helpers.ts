import type { Locale } from '@/i18n'
import type { LocalizedString, MapPosition } from '@/types/positions'

/**
 * Достать локализованное имя позиции с фолбэком: lang → en → ru → label.
 */
export function pickLocalizedLabel(pos: MapPosition, lang: Locale): string {
  const i18n: LocalizedString | undefined = pos.label_i18n
  if (i18n) {
    if (i18n[lang]) return i18n[lang]!
    if (i18n.en) return i18n.en
    if (i18n.ru) return i18n.ru
  }
  return pos.label
}

/**
 * Нормализованная строка для поиска: latin lower, без лишних пробелов.
 */
export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Все строки, по которым ищем позицию (label, i18n, aliases, id, опц. доп.).
 */
export function buildPositionSearchHaystack(pos: MapPosition, extra: string[] = []): string[] {
  const haystack: string[] = [pos.label, pos.id]
  if (pos.label_i18n) {
    for (const v of Object.values(pos.label_i18n)) if (v) haystack.push(v)
  }
  if (pos.aliases) haystack.push(...pos.aliases)
  haystack.push(...extra)
  return haystack
}

/**
 * Совпадает ли позиция с поисковой строкой (по label, label_i18n, aliases, id и extra).
 *
 * `extra` — например локализованная категория («Площадка A»), чтобы искать по зоне.
 */
export function positionMatchesSearch(pos: MapPosition, query: string, extra: string[] = []): boolean {
  if (!query) return true
  const q = normalizeSearch(query)
  return buildPositionSearchHaystack(pos, extra).some((s) => normalizeSearch(s).includes(q))
}
