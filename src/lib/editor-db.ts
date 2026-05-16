import { cache } from 'react'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** Ключи JSON-контента редактора (одна строка на ключ в `editor_content`). */
export const EDITOR_KEYS = {
  custom_lineups: 'custom_lineups',
  position_overrides: 'position_overrides',
  position_catalog_extensions: 'position_catalog_extensions',
  position_zones: 'position_zones',
} as const

export type EditorContentKey = (typeof EDITOR_KEYS)[keyof typeof EDITOR_KEYS]

/** D1 binding из wrangler.jsonc (`binding: "DB"`). */
const getDb = cache((): D1Database | null => {
  try {
    const db = getCloudflareContext().env.DB
    return db ?? null
  } catch {
    return null
  }
})

export function isEditorDatabaseEnabled(): boolean {
  return getDb() != null
}

function parsePayload(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** Все ключи одним запросом (bootstrap). */
export const editorDbGetManyJson = cache(
  async (keys: EditorContentKey[]): Promise<Partial<Record<EditorContentKey, unknown>>> => {
    const db = getDb()
    if (!db || keys.length === 0) return {}
    const placeholders = keys.map(() => '?').join(', ')
    try {
      const result = await db
        .prepare(`SELECT key, payload FROM editor_content WHERE key IN (${placeholders})`)
        .bind(...keys)
        .all<{ key: string; payload: string }>()
      const out: Partial<Record<EditorContentKey, unknown>> = {}
      for (const row of result.results ?? []) {
        const k = row.key as EditorContentKey
        if (keys.includes(k)) {
          const p = parsePayload(row.payload)
          if (p != null) out[k] = p
        }
      }
      return out
    } catch (e) {
      console.error('[editor-db] GET many', e)
      throw e
    }
  },
)

export const editorDbPing = cache(async (): Promise<boolean> => {
  const db = getDb()
  if (!db) return false
  try {
    await db.prepare('SELECT 1').first()
    return true
  } catch (e) {
    console.error('[editor-db] ping', e)
    return false
  }
})

/** `null` — строки нет (читаем с диска из репо). */
export const editorDbGetJson = cache(async (key: EditorContentKey): Promise<unknown | null> => {
  const db = getDb()
  if (!db) return null
  try {
    const row = await db
      .prepare('SELECT payload FROM editor_content WHERE key = ?')
      .bind(key)
      .first<{ payload: string }>()
    if (!row) return null
    return parsePayload(row.payload)
  } catch (e) {
    console.error('[editor-db] GET', key, e)
    return null
  }
})

export async function editorDbSetJson(key: EditorContentKey, payload: unknown): Promise<void> {
  const db = getDb()
  if (!db) throw new Error('D1 (binding DB) недоступен — проверьте wrangler.jsonc и деплой')
  const json = JSON.stringify(payload)
  await db
    .prepare(
      `INSERT INTO editor_content (key, payload, updated_at)
       VALUES (?, ?, unixepoch())
       ON CONFLICT(key) DO UPDATE SET
         payload = excluded.payload,
         updated_at = unixepoch()`,
    )
    .bind(key, json)
    .run()
}
