/** Версия данных раскидок: при сохранении в админке — другие вкладки делают router.refresh() */
export const LINEUPS_VERSION_STORAGE_KEY = 'cs2-lineups-version'

export function bumpLineupsVersionInBrowser(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LINEUPS_VERSION_STORAGE_KEY, String(Date.now()))
  } catch {
    /* private mode */
  }
}
