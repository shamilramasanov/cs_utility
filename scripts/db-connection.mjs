/**
 * Публичный URL (DATABASE_PUBLIC_URL) нужен для скриптов с ПК, если в DATABASE_URL только …railway.internal.
 */
export function pickDatabaseUrl() {
  const pub = process.env.DATABASE_PUBLIC_URL?.trim()
  if (pub) return pub
  const u = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim()
  if (!u) return null
  if (u.includes('railway.internal')) {
    console.error(
      'В DATABASE_URL указан postgres.railway.internal — с этого компьютера он не открывается.\n' +
        'Railway → Postgres → Connect → скопируй публичный URL и добавь в .env строку:\n' +
        '  DATABASE_PUBLIC_URL=postgresql://...',
    )
    process.exit(1)
  }
  return u
}
