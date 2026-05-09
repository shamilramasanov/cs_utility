'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ru } from './dictionaries/ru'
import { en } from './dictionaries/en'
import { uk } from './dictionaries/uk'
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Dictionary,
  type Locale,
  type TranslationKey,
} from './types'

const DICTIONARIES: Record<Locale, Dictionary> = { ru, en, uk }

const COOKIE_NAME = 'lang'
const STORAGE_KEY = 'cs2-grenades:lang'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  /** Получить строку по ключу с подстановкой `{var}` параметров. */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface ProviderProps {
  initialLocale?: Locale
  children: ReactNode
}

export function I18nProvider({ initialLocale, children }: ProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromStorage = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (fromStorage && isValidLocale(fromStorage) && fromStorage !== locale) {
      setLocaleState(fromStorage)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    if (!isValidLocale(l)) return
    setLocaleState(l)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l)
      document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
      document.documentElement.lang = l
    }
  }, [])

  const t = useCallback<I18nContextValue['t']>(
    (key, params) => translate(DICTIONARIES[locale], key, params),
    [locale],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

export function useT() {
  return useI18n().t
}

export function useLocale() {
  return useI18n().locale
}

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

function translate(
  dict: Dictionary,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split('.')
  let cursor: unknown = dict
  for (const p of parts) {
    if (cursor && typeof cursor === 'object' && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p]
    } else {
      return key
    }
  }
  if (typeof cursor !== 'string') return key
  if (!params) return cursor
  return cursor.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}

export type { Locale, TranslationKey, Dictionary } from './types'
export { DEFAULT_LOCALE, LOCALES } from './types'
