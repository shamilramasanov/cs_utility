#!/usr/bin/env node
/**
 * Заменяет в D1 ссылки Vercel Blob → /uploads/grenades/…
 *   npm run db:fix-blob-urls
 *   npm run db:fix-blob-urls -- --local
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const DB_NAME = process.env.D1_DATABASE_NAME?.trim() || 'csutility-editor'
const local = process.argv.includes('--local')

const BLOB_RE =
  /https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/grenades\//gi

function rewritePayload(raw) {
  if (!BLOB_RE.test(raw)) return null
  BLOB_RE.lastIndex = 0
  return raw.replace(BLOB_RE, '/uploads/grenades/')
}

const selectArgs = [
  'wrangler',
  'd1',
  'execute',
  DB_NAME,
  '--json',
  '--command=SELECT key, payload FROM editor_content',
]
if (local) selectArgs.push('--local')
else selectArgs.push('--remote')

const sel = spawnSync('npx', selectArgs, { cwd: root, encoding: 'utf8' })
if (sel.status !== 0) {
  console.error(sel.stderr?.trim() || sel.stdout?.trim() || `wrangler exit ${sel.status}`)
  process.exit(1)
}

let rows = []
try {
  const parsed = JSON.parse(sel.stdout)
  const result = parsed?.[0]?.results ?? parsed?.results ?? []
  rows = result.map((r) => ({ key: r.key, payload: r.payload }))
} catch {
  console.error('Не удалось разобрать JSON от wrangler:', sel.stdout.slice(0, 500))
  process.exit(1)
}

if (rows.length === 0) {
  console.log('editor_content пуст.')
  process.exit(0)
}

const lines = ['-- d1-rewrite-blob-urls.mjs']
let changed = 0
for (const { key, payload } of rows) {
  const next = rewritePayload(payload)
  if (!next) continue
  const escaped = next.replace(/'/g, "''")
  lines.push(
    `UPDATE editor_content SET payload = '${escaped}', updated_at = unixepoch() WHERE key = '${key}';`,
  )
  changed++
}

if (changed === 0) {
  console.log('Vercel Blob URL в D1 не найдены.')
  process.exit(0)
}

const sqlPath = path.join(root, '.tmp-d1-blob-fix.sql')
fs.writeFileSync(sqlPath, lines.join('\n'), 'utf8')

const execArgs = ['wrangler', 'd1', 'execute', DB_NAME, '--file', sqlPath]
if (local) execArgs.push('--local')
else execArgs.push('--remote')

console.log('Обновление ключей:', changed, local ? '(local)' : '(remote)')
const run = spawnSync('npx', execArgs, { cwd: root, stdio: 'inherit' })
fs.unlinkSync(sqlPath)
process.exit(run.status ?? 1)
