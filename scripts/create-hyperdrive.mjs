#!/usr/bin/env node
/**
 * Создаёт Hyperdrive для Railway Postgres (один раз).
 * Требует: wrangler login ИЛИ CLOUDFLARE_API_TOKEN в окружении.
 *
 *   npm run hyperdrive:create
 *
 * Скопируйте id из вывода в wrangler.jsonc → hyperdrive[0].id
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

function loadDatabaseUrl() {
  if (process.env.DATABASE_PUBLIC_URL?.trim()) return process.env.DATABASE_PUBLIC_URL.trim()
  if (!existsSync(envPath)) {
    console.error('Нет .env и DATABASE_PUBLIC_URL в окружении.')
    process.exit(1)
  }
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*DATABASE_PUBLIC_URL\s*=\s*(.+)\s*$/)
    if (m) return m[1].replace(/^["']|["']$/g, '').trim()
  }
  console.error('В .env нет DATABASE_PUBLIC_URL (публичный Railway URL).')
  process.exit(1)
}

const url = loadDatabaseUrl()
const name = process.env.HYPERDRIVE_CONFIG_NAME?.trim() || 'csutility-railway'

console.log(`Создаём Hyperdrive «${name}»…`)

const r = spawnSync(
  'npx',
  ['wrangler', 'hyperdrive', 'create', name, `--connection-string=${url}`],
  { cwd: root, stdio: 'inherit', shell: true },
)

if (r.status !== 0) process.exit(r.status ?? 1)

console.log(`
Готово. Вставьте id в wrangler.jsonc:

  "hyperdrive": [
    { "binding": "HYPERDRIVE", "id": "<id из вывода выше>" }
  ]

Затем: npm run build:cf && npm run deploy
`)
