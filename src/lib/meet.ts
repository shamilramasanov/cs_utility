import type { Meet, MeetMember } from '@/types/meet'
import type { Side } from '@/types'
import type { TeamRole } from '@/types/tactics'
import { rolesForSide } from '@/data/role-presets'
import { encodeMeetPayload, isBriefingComplete, normalizeMeet } from './meet-codec'

export { encodeMeetPayload, decodeMeetPayload, normalizeMeet, isBriefingComplete } from './meet-codec'

const PREVIEW_MEMBER_PREFIX = 'preview_'
const PREVIEW_NAMES = ['Neo', 'Viper', 'Ghost', 'Ace', 'Flex']

export function isPreviewMember(id: string): boolean {
  return id.startsWith(PREVIEW_MEMBER_PREFIX)
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MEET_PREFIX = 'meet:'
const ACTIVE_MEET_CODE_KEY = 'cs2-active-meet-code'
const MEET_TTL_MS = 4 * 60 * 60 * 1000

function randomToken(len: number): string {
  const arr = new Uint8Array(len)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  let out = ''
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[arr[i] % CODE_CHARS.length]
  }
  return out
}

export function generateMeetCode(): string {
  return randomToken(4)
}

export function generateMeetSecret(): string {
  return randomToken(12)
}

function meetStorageKey(code: string) {
  return `${MEET_PREFIX}${code.toUpperCase()}`
}

export function loadMeetFromStorage(code: string): Meet | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(meetStorageKey(code))
    if (!raw) return null
    const meet = normalizeMeet(JSON.parse(raw) as Meet)
    if (meet.expires_at && Date.parse(meet.expires_at) < Date.now()) return null
    return meet
  } catch {
    return null
  }
}

export function setActiveMeetCode(code: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_MEET_CODE_KEY, code.toUpperCase())
}

export function clearActiveMeetCode() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_MEET_CODE_KEY)
}

export function getActiveMeetCode(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_MEET_CODE_KEY)?.toUpperCase() ?? null
}

export function loadActiveMeet(): Meet | null {
  const code = getActiveMeetCode()
  if (!code) return null
  const meet = loadMeetFromStorage(code)
  if (!meet || isMeetExpired(meet)) {
    clearActiveMeetCode()
    return null
  }
  return meet
}

/** URL для возврата в текущую встречу (план, если брифинг завершён). */
export function getActiveMeetResumePath(): string | null {
  const meet = loadActiveMeet()
  if (!meet) return null
  const extra: Record<string, string> = {}
  if (isBriefingComplete(meet)) extra.plan = '1'
  return meetHref(meet, Object.keys(extra).length ? extra : undefined)
}

export function saveMeetToStorage(meet: Meet) {
  if (typeof window === 'undefined') return
  localStorage.setItem(meetStorageKey(meet.code), JSON.stringify(normalizeMeet(meet)))
  setActiveMeetCode(meet.code)
}

export function createMeet(params: {
  captainId: string
  captainNickname: string
}): Meet {
  const now = new Date()
  const meet: Meet = {
    code: generateMeetCode(),
    secret: generateMeetSecret(),
    map: null,
    side: null,
    tactic_id: null,
    briefing_locked: false,
    members: [
      {
        id: params.captainId,
        nickname: params.captainNickname,
        role: 'igl',
        is_captain: true,
        joined_at: now.toISOString(),
        last_seen: now.toISOString(),
      },
    ],
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + MEET_TTL_MS).toISOString(),
  }
  saveMeetToStorage(meet)
  return meet
}

export function setMeetBriefing(
  meet: Meet,
  params: { map: string; side: Side; tacticId: string },
): Meet {
  const next = normalizeMeet({
    ...meet,
    map: params.map,
    side: params.side,
    tactic_id: params.tacticId,
    briefing_locked: true,
    expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString(),
  })
  saveMeetToStorage(next)
  return next
}

export function touchMember(meet: Meet, clientId: string): Meet {
  const now = new Date().toISOString()
  return {
    ...meet,
    members: meet.members.map((m) =>
      m.id === clientId ? { ...m, last_seen: now } : m,
    ),
    expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString(),
  }
}

export function upsertMember(
  meet: Meet,
  member: Pick<MeetMember, 'id' | 'nickname'> & { role?: TeamRole | null },
): Meet {
  const existing = meet.members.find((m) => m.id === member.id)
  const now = new Date().toISOString()
  let members: MeetMember[]
  if (existing) {
    members = meet.members.map((m) =>
      m.id === member.id
        ? {
            ...m,
            nickname: member.nickname,
            role: member.role !== undefined ? member.role : m.role,
            last_seen: now,
          }
        : m,
    )
  } else {
    members = [
      ...meet.members,
      {
        id: member.id,
        nickname: member.nickname,
        role: member.role ?? null,
        is_captain: false,
        joined_at: now,
        last_seen: now,
      },
    ]
  }
  const next = { ...meet, members, expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString() }
  saveMeetToStorage(next)
  return next
}

export function claimRole(meet: Meet, clientId: string, role: TeamRole): Meet | 'taken' {
  const taken = meet.members.find(
    (m) => m.role === role && m.id !== clientId && !isPreviewMember(m.id),
  )
  if (taken) return 'taken'
  const self = meet.members.find((m) => m.id === clientId)
  if (!self) return meet
  const withoutPreviewForRole = meet.members.filter(
    (m) => !(isPreviewMember(m.id) && m.role === role),
  )
  const members = withoutPreviewForRole.map((m) => {
    if (m.id === clientId) return { ...m, role, last_seen: new Date().toISOString() }
    if (m.role === role) return { ...m, role: null }
    return m
  })
  const next = {
    ...meet,
    members,
    expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString(),
  }
  saveMeetToStorage(next)
  return next
}

export function setMeetTactic(meet: Meet, tacticId: string): Meet {
  const next = normalizeMeet({
    ...meet,
    tactic_id: tacticId,
    expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString(),
  })
  saveMeetToStorage(next)
  return next
}

export function buildMeetPath(meet: Meet, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${meetHref(meet)}`
}

export function meetHref(meet: Meet, extra?: Record<string, string>): string {
  const d = encodeMeetPayload(meet)
  const params = new URLSearchParams({ t: meet.secret, d })
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v)
  }
  return `/team/${meet.code}?${params.toString()}`
}

export function lineupsHref(meet: Meet, returnToPlan = true): string | null {
  if (!meet.map || !meet.side) return null
  const fromMeet = meetHref(meet, returnToPlan ? { plan: '1' } : undefined)
  const params = new URLSearchParams({
    meet: meet.code,
    side: meet.side,
    fromMeet,
  })
  return `/map/${meet.map}?${params.toString()}`
}

export function memberWithRole(meet: Meet, role: TeamRole): MeetMember | undefined {
  return meet.members.find((m) => m.role === role)
}

export function seedPreviewMembers(meet: Meet): Meet {
  if (!meet.side) return meet
  const roles = rolesForSide(meet.side as Side)
  const now = new Date().toISOString()
  let members = meet.members.filter((m) => !isPreviewMember(m.id))
  let nameIdx = 0

  for (const meta of roles) {
    if (members.some((m) => m.role === meta.role)) continue
    members.push({
      id: `${PREVIEW_MEMBER_PREFIX}${meta.role}`,
      nickname: PREVIEW_NAMES[nameIdx++ % PREVIEW_NAMES.length],
      role: meta.role,
      is_captain: false,
      joined_at: now,
      last_seen: now,
    })
  }

  const next = {
    ...meet,
    members,
    expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString(),
  }
  saveMeetToStorage(next)
  return next
}

export function clearPreviewMembers(meet: Meet): Meet {
  const next = {
    ...meet,
    members: meet.members.filter((m) => !isPreviewMember(m.id)),
    expires_at: new Date(Date.now() + MEET_TTL_MS).toISOString(),
  }
  saveMeetToStorage(next)
  return next
}

export function realMemberCount(meet: Meet): number {
  return meet.members.filter((m) => !isPreviewMember(m.id)).length
}

export function isMeetExpired(meet: Meet): boolean {
  return Date.parse(meet.expires_at) < Date.now()
}
