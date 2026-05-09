/** Ключ из поля админки (sessionStorage), если задан ADMIN_SECRET на сервере */
export function getAdminSecretFromBrowser(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('cs2-admin-secret') ?? ''
}
