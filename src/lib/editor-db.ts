import { Buffer } from 'node:buffer'
import { cache } from 'react'
import { getCloudflareContext } from '@opennextjs/cloudflare'
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

/** Прямой URL (Vercel, `next dev`, скрипты с ПК). */
function directConnectionString(): string | null {
  const pub = readEnv(envNameFromB64('REFUQUJBU0VfUFVCTElDX1VSTA=='))
  if (pub) return pub
  return readEnv(envNameFromB64('REFUQUJBU0VfVVJM')) ?? readEnv(envNameFromB64('UE9TVEdSRVNfVVJM')) ?? null
}

/** Cloudflare Hyperdrive — пул на edge, без 5–12 с TLS до Railway на каждый запрос. */
function hyperdriveConnectionString(): string | null {
  try {
    const hd = getCloudflareContext().env.HYPERDRIVE
    const cs = hd?.connectionString
    return typeof cs === 'string' && cs.trim() !== '' ? cs.trim() : null
  } catch {
    return null
  }
}

type DbTarget = { url: string; viaHyperdrive: boolean }

function resolveDbTarget(): DbTarget | null {
  const hd = hyperdriveConnectionString()
  if (hd) return { url: hd, viaHyperdrive: true }
  const direct = directConnectionString()
  if (direct) return { url: direct, viaHyperdrive: false }
  return null
}

function postgresOptions(viaHyperdrive: boolean) {
  if (viaHyperdrive) {
    return {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      fetch_types: false,
      prepare: true,
    }
  }
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
  const target = resolveDbTarget()
  if (!target) return null
  try {
    return postgres(target.url, postgresOptions(target.viaHyperdrive))
  } catch (e) {
    console.error('[editor-db] init', e)
    return null
  }
})

export function isEditorDatabaseEnabled(): boolean {
  return resolveDbTarget() != null
}

export function isEditorDatabaseViaHyperdrive(): boolean {
  return hyperdriveConnectionString() != null
}

/** Все ключи одним запросом (для /api/home/bootstrap — один round-trip к Railway). */
export const editorDbGetManyJson = cache(
  async (keys: EditorContentKey[]): Promise<Partial<Record<EditorContentKey, unknown>>> => {
    const sql = getSql()
    if (!sql || keys.length === 0) return {}
    try {
      const rows = await sql<{ key: string; payload: unknown }[]>`
        SELECT key, payload FROM editor_content WHERE key IN ${sql(keys)}
      `
      const out: Partial<Record<EditorContentKey, unknown>> = {}
      for (const row of rows) {
        const k = row.key as EditorContentKey
        if (keys.includes(k)) out[k] = row.payload
      }
      return out
    } catch (e) {
      console.error('[editor-db] GET many', e)
      throw e
    }
  },
)

/** Проверка доступности Postgres (bootstrap routes). */
export const editorDbPing = cache(async (): Promise<boolean> => {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`SELECT 1`
    return true
  } catch (e) {
    console.error('[editor-db] ping', e)
    return false
  }
})

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
  if (!sql) {
    throw new Error(
      'Задай Hyperdrive (wrangler) или DATABASE_PUBLIC_URL / DATABASE_URL для записи в БД',
    )
  }
  const json = sql.json(payload as Parameters<Sql['json']>[0])
  await sql`
    INSERT INTO editor_content (key, payload, updated_at)
    VALUES (${key}, ${json}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
  `
}
