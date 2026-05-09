/**
 * Создаёт таблицу editor_content (то же, что scripts/sql/001_editor_content.sql).
 * Удобно, если в Railway во вкладке Data нет кнопки Run.
 *
 * Из папки cs2-grenades: публичный URL в DATABASE_PUBLIC_URL или DATABASE_URL (см. .env.example).
 *   npm run db:schema
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { pickDatabaseUrl } from './db-connection.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const url = pickDatabaseUrl()
if (!url) {
  console.error('Нет DATABASE_URL / POSTGRES_URL / DATABASE_PUBLIC_URL в .env')
  process.exit(1)
}

const sqlPath = path.join(__dirname, 'sql', '001_editor_content.sql')
const raw = fs.readFileSync(sqlPath, 'utf8')
const ddl = raw
  .split('\n')
  .filter((line) => !/^\s*--/.test(line))
  .join('\n')
  .trim()

if (!ddl.toLowerCase().includes('create table')) {
  console.error('Не удалось прочитать DDL из', sqlPath)
  process.exit(1)
}

const sql = postgres(url, { max: 1 })
try {
  await sql.unsafe(ddl)
  console.log('Готово: таблица editor_content создана или уже была.')
} finally {
  await sql.end({ timeout: 5 })
}
