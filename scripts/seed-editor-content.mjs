/**
 * Загружает текущие JSON из src/data в таблицу editor_content (UPSERT).
 * Требуется DATABASE_URL или POSTGRES_URL (строка из Railway → Postgres → Variables).
 *
 * Пример (из корня cs2-grenades):
 *   node --env-file=.env scripts/seed-editor-content.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { pickDatabaseUrl } from './db-connection.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const FILES = [
  { key: 'custom_lineups', file: 'src/data/custom-lineups.json' },
  { key: 'position_overrides', file: 'src/data/position-overrides.json' },
  { key: 'position_catalog_extensions', file: 'src/data/position-catalog-extensions.json' },
  { key: 'position_zones', file: 'src/data/position-zones.json' },
]

const url = pickDatabaseUrl()
if (!url) {
  console.error('Задай DATABASE_PUBLIC_URL или DATABASE_URL / POSTGRES_URL в .env')
  process.exit(1)
}

const sql = postgres(url, { max: 1 })

try {
  for (const { key, file } of FILES) {
    const abs = path.join(root, file)
    if (!fs.existsSync(abs)) {
      console.warn('Пропуск (нет файла):', file)
      continue
    }
    const raw = fs.readFileSync(abs, 'utf8')
    let payload
    try {
      payload = JSON.parse(raw)
    } catch (e) {
      console.error('Невалидный JSON:', file, e)
      process.exit(1)
    }
    await sql`
      INSERT INTO editor_content (key, payload, updated_at)
      VALUES (${key}, ${sql.json(payload)}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `
    console.log('OK:', key)
  }
} finally {
  await sql.end({ timeout: 5 })
}

console.log('Готово.')
