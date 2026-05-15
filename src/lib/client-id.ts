const CLIENT_ID_KEY = 'cs2-client-id'
const NICKNAME_KEY = 'cs2-team-nickname'

export function getClientId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

export function getSavedNickname(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(NICKNAME_KEY)?.trim() ?? ''
}

export function saveNickname(nickname: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NICKNAME_KEY, nickname.trim())
}
