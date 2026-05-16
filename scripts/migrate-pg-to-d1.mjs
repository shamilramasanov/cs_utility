#!/usr/bin/env node
/**
 * Одноразово: копирует editor_content из Railway Postgres в D1 (remote).
 *   node --env-file=.env scripts/migrate-pg-to-d1.mjs
 */
import { spawnSync } from 'node:child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { pickDatabaseUrl } from './db-connection.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const DB_NAME = process.env.D1_DATABASE_NAME?.trim() || 'csutility-editor'

const url = pickDatabaseUrl()
if (!url) {
  console.error('Нужен DATABASE_PUBLIC_URL в .env для чтения из Postgres')
  process.exit(1)
}

const sql = postgres(url, { max: 1, ssl: 'require', prepare: false })
const rows = await sql`SELECT key, payload FROM editor_content`
await sql.end({ timeout: 5 })

if (!rows.length) {
  console.error('В Postgres нет строк в editor_content')
  process.exit(1)
}

const lines = []
for (const row of rows) {
  const json = JSON.stringify(row.payload)
  const escaped = json.replace(/'/g, "''")
  lines.push(
    `INSERT INTO editor_content (key, payload, updated_at) VALUES ('${row.key}', '${escaped}', unixepoch())`,
    `ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = unixepoch();`,
  )
}

const tmp = path.join(root, '.tmp-pg-migrate-d1.sql')
fs.writeFileSync(tmp, lines.join('\n'), 'utf8')
console.log(`Миграция ${rows.length} ключей в D1…`)
const r = spawnSync(
  'npx',
  ['wrangler', 'd1', 'execute', DB_NAME, '--remote', '--file', tmp],
  { cwd: root, stdio: 'inherit', shell: true },
)
fs.unlinkSync(tmp)
process.exit(r.status ?? 1)
