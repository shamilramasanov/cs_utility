import { Buffer } from 'node:buffer'
import { cache } from 'react'
import postgres, { type Sql } from 'postgres'

/** Ключи JSON-контента редактора (одна строка на ключ в `editor_content`). */
export const EDITOR_KEYS = {
  custom_lineups: 'custom_lineups',
  position_overrides: 'position_overrides',
  position_catalog_extensions: 'position_catalog_extensions',
  position_zones: 'position_zones',
} as const

export type EditorContentKey = (typeof EDITOR_KEYS)[keyof typeof EDITOR_KEYS]

/** Имя переменной окружения без цельной строки в исходнике — иначе Turbopack на билде подставляет пусто. */
function envNameFromB64(b64: string): string {
  return Buffer.from(b64, 'base64').toString('utf8')
}

function readEnv(name: string): string | undefined {
  const v = process.env[name]
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

function connectionString(): string | null {
  const pub = readEnv(envNameFromB64('REFUQUJBU0VfUFVCTElDX1VSTA=='))
  if (pub) return pub
  return readEnv(envNameFromB64('REFUQUJBU0VfVVJM')) ?? readEnv(envNameFromB64('UE9TVEdSRVNfVVJM')) ?? null
}

function postgresOptions() {
  return {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 12,
    ssl: 'require' as const,
    prepare: false,
  }
}

/**
 * Один клиент на HTTP-запрос (react cache), не глобальный singleton.
 * @see https://opennext.js.org/cloudflare/howtos/db
 */
const getSql = cache((): Sql | null => {
  const url = connectionString()
  if (!url) return null
  try {
    return postgres(url, postgresOptions())
  } catch (e) {
    console.error('[editor-db] init', e)
    return null
  }
})

export function isEditorDatabaseEnabled(): boolean {
  return Boolean(connectionString())
}

/** `null` — строки нет (читаем с диска из репо). Кэш по ключу на один запрос. */
export const editorDbGetJson = cache(async (key: EditorContentKey): Promise<unknown | null> => {
  const sql = getSql()
  if (!sql) return null
  try {
    const rows = await sql<{ payload: unknown }[]>`
      SELECT payload FROM editor_content WHERE key = ${key}
    `
    if (!rows.length) return null
    return rows[0].payload
  } catch (e) {
    console.error('[editor-db] GET', key, e)
    return null
  }
})

export async function editorDbSetJson(key: EditorContentKey, payload: unknown): Promise<void> {
  const sql = getSql()
  if (!sql) throw new Error('Задай DATABASE_PUBLIC_URL или DATABASE_URL / POSTGRES_URL')
  const json = sql.json(payload as Parameters<Sql['json']>[0])
  await sql`
    INSERT INTO editor_content (key, payload, updated_at)
    VALUES (${key}, ${json}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
  `
}
