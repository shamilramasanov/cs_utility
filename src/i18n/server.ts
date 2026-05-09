import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALES, type Locale } from './types'

const COOKIE_NAME = 'lang'

/**
 * Серверное определение локали:
 * 1) cookie `lang`
 * 2) `Accept-Language` запроса
 * 3) DEFAULT_LOCALE
 *
 * Используем в layout.tsx, чтобы первый рендер уже был на нужном языке.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(COOKIE_NAME)?.value
  if (isValidLocale(fromCookie)) return fromCookie

  const hdrs = await headers()
  const al = hdrs.get('accept-language') ?? ''
  const match = parseAcceptLanguage(al)
  if (match) return match

  return DEFAULT_LOCALE
}

function parseAcceptLanguage(header: string): Locale | null {
  if (!header) return null
  const tags = header
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean)
  for (const tag of tags) {
    const base = tag.split('-')[0]
    if (isValidLocale(base)) return base
  }
  return null
}

function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}
