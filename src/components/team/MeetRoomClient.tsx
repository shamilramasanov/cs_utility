'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Meet } from '@/types/meet'
import type { TeamRole, ViewRole } from '@/types/tactics'
import type { Side } from '@/types'
import MeetLobby from '@/components/team/MeetLobby'
import MeetWaiting from '@/components/team/MeetWaiting'
import BriefingScreen from '@/components/team/BriefingScreen'
import RolePicker from '@/components/team/RolePicker'
import RolePlanView from '@/components/team/RolePlanView'
import TacticPickerSheet from '@/components/team/TacticPickerSheet'
import { getMap } from '@/lib/grenades'
import { getClientId, getSavedNickname, saveNickname } from '@/lib/client-id'
import { decodeMeetPayload, isBriefingComplete } from '@/lib/meet-codec'
import { rolesForSide } from '@/data/role-presets'
import { useMeetSession } from '@/context/MeetSessionContext'
import {
  buildMeetPath,
  claimRole,
  clearActiveMeetCode,
  clearPreviewMembers,
  isMeetExpired,
  isPreviewMember,
  loadMeetFromStorage,
  meetHref,
  saveMeetToStorage,
  seedPreviewMembers,
  setMeetBriefing,
  setMeetTactic,
  touchMember,
  upsertMember,
} from '@/lib/meet'
import { getTacticById, getTacticsByMapAndSide } from '@/lib/tactics'
import { useT } from '@/i18n'

type Screen =
  | 'loading'
  | 'invalid'
  | 'expired'
  | 'nickname'
  | 'lobby'
  | 'picker'
  | 'briefing'
  | 'waiting'
  | 'plan'

interface Props {
  code: string
}

export default function MeetRoomClient({ code }: Props) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = useMeetSession()
  const clientId = getClientId()

  const [meet, setMeet] = useState<Meet | null>(null)
  const [screen, setScreen] = useState<Screen>('loading')
  const [nickname, setNickname] = useState('')
  const [copied, setCopied] = useState(false)
  const [showTacticPicker, setShowTacticPicker] = useState(false)
  const [planActive, setPlanActive] = useState(false)
  const [viewRole, setViewRole] = useState<ViewRole>('all')
  const [forceBriefing, setForceBriefing] = useState(false)

  const normalizedCode = code.toUpperCase()
  const briefingComplete = meet ? isBriefingComplete(meet) : false

  const syncMeetUrl = useCallback(
    (next: Meet, extra?: Record<string, string>) => {
      router.replace(meetHref(next, extra), { scroll: false })
    },
    [router],
  )

  const persistMeet = useCallback(
    (next: Meet, extra?: Record<string, string>) => {
      saveMeetToStorage(next)
      setMeet(next)
      syncMeetUrl(next, extra)
    },
    [syncMeetUrl],
  )

  const resolveScreen = useCallback(
    (m: Meet, opts?: { forcePlan?: boolean; forceBriefing?: boolean }) => {
      if (isMeetExpired(m)) {
        setScreen('expired')
        return
      }
      const nick = getSavedNickname()
      const member = m.members.find((x) => x.id === clientId)
      if (!member || !nick.trim()) {
        setScreen('nickname')
        return
      }
      if (!member.role) {
        setScreen('picker')
        return
      }
      if (!isBriefingComplete(m)) {
        if (member.is_captain && (opts?.forceBriefing || forceBriefing)) {
          setScreen('briefing')
          return
        }
        if (member.is_captain) {
          setScreen('lobby')
          return
        }
        setScreen('waiting')
        return
      }
      if (opts?.forcePlan || planActive || searchParams.get('plan') === '1') {
        setScreen('plan')
        return
      }
      setScreen('lobby')
    },
    [clientId, forceBriefing, planActive, searchParams],
  )

  useEffect(() => {
    const d = searchParams.get('d')
    const secret = searchParams.get('t')
    let loaded: Meet | null = null

    if (d) loaded = decodeMeetPayload(d)
    if (!loaded) loaded = loadMeetFromStorage(normalizedCode)

    if (!loaded || loaded.code.toUpperCase() !== normalizedCode) {
      setScreen('invalid')
      return
    }
    if (secret && loaded.secret !== secret) {
      setScreen('invalid')
      return
    }
    if (isMeetExpired(loaded)) {
      setMeet(loaded)
      setScreen('expired')
      return
    }

    const touched = touchMember(loaded, clientId)
    saveMeetToStorage(touched)
    setMeet(touched)
    setNickname(getSavedNickname())
    if (searchParams.get('plan') === '1') setPlanActive(true)
    resolveScreen(touched)
  }, [clientId, normalizedCode, resolveScreen, searchParams])

  useEffect(() => {
    if (meet?.map && briefingComplete) session?.prefetchMap(meet.map)
  }, [briefingComplete, meet?.map, session])

  useEffect(() => {
    if (screen === 'expired') clearActiveMeetCode()
  }, [screen])

  const mapLabel = useMemo(() => {
    if (!meet?.map) return ''
    return getMap(meet.map)?.display_name ?? meet.map
  }, [meet])

  const tactic = useMemo(() => {
    if (!meet?.tactic_id) return null
    return getTacticById(meet.tactic_id) ?? null
  }, [meet?.tactic_id])

  const tacticsForMeet = useMemo(() => {
    if (!meet?.map || !meet.side) return []
    return getTacticsByMapAndSide(meet.map, meet.side)
  }, [meet])

  const shareUrl = useMemo(() => {
    if (!meet || typeof window === 'undefined') return ''
    return buildMeetPath(meet)
  }, [meet])

  const myMember = meet?.members.find((m) => m.id === clientId)
  const planViewRoleSynced = useRef(false)

  useEffect(() => {
    if (screen !== 'plan') {
      planViewRoleSynced.current = false
      return
    }
    if (!planViewRoleSynced.current && myMember?.role) {
      setViewRole(myMember.role)
      planViewRoleSynced.current = true
    }
  }, [myMember?.role, screen])
  const isCaptain = Boolean(myMember?.is_captain)
  const hasDemoTeam = Boolean(meet?.members.some((m) => isPreviewMember(m.id)))
  const sideRoles = useMemo(
    () => (meet?.side ? rolesForSide(meet.side).map((r) => r.role) : []),
    [meet?.side],
  )

  const openPlan = useCallback(() => {
    if (!meet || !briefingComplete) return
    const member = meet.members.find((x) => x.id === clientId)
    setPlanActive(true)
    if (member?.role) setViewRole(member.role)
    persistMeet(meet, { plan: '1' })
    setScreen('plan')
  }, [briefingComplete, clientId, meet, persistMeet])

  const handleNicknameSubmit = useCallback(() => {
    if (!meet) return
    const nick = nickname.trim()
    if (!nick) return
    saveNickname(nick)
    const next = upsertMember(meet, { id: clientId, nickname: nick })
    persistMeet(next)
    resolveScreen(next)
  }, [clientId, meet, nickname, persistMeet, resolveScreen])

  const handlePickRole = useCallback(
    (role: TeamRole) => {
      if (!meet) return
      const result = claimRole(meet, clientId, role)
      if (result === 'taken') return
      persistMeet(result)
      resolveScreen(result)
    },
    [clientId, meet, persistMeet, resolveScreen],
  )

  const handleBriefingSubmit = useCallback(
    (map: string, side: Side, tacticId: string) => {
      if (!meet) return
      const next = setMeetBriefing(meet, { map, side, tacticId })
      setForceBriefing(false)
      persistMeet(next)
      resolveScreen(next)
    },
    [meet, persistMeet, resolveScreen],
  )

  const copyLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }, [shareUrl])

  const handleTacticSelect = useCallback(
    (tacticId: string) => {
      if (!meet) return
      const next = setMeetTactic(meet, tacticId)
      persistMeet(next)
      setShowTacticPicker(false)
    },
    [meet, persistMeet],
  )

  if (screen === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center px-app-screen py-12 text-sm text-[#666]" />
    )
  }

  if (screen === 'invalid') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-app-screen py-12 text-center">
        <p className="text-[#ccc]">{t('team.invalidLink')}</p>
        <Link href="/team" className="text-sm font-semibold text-[#F0B429]">
          {t('team.title')}
        </Link>
      </div>
    )
  }

  if (screen === 'expired' || !meet) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-app-screen py-12 text-center">
        <p className="text-[#ccc]">{t('team.expired')}</p>
        <Link href="/team" className="text-sm font-semibold text-[#F0B429]">
          {t('team.create')}
        </Link>
      </div>
    )
  }

  if (screen === 'nickname') {
    return (
      <div className="flex flex-1 flex-col justify-center px-app-screen py-8">
        <p className="mb-6 text-sm text-[#888]">{t('team.nicknamePrompt')}</p>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">{t('team.nickname')}</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="h-14 w-full rounded-xl border border-[#333] bg-[#141414] px-3 text-base"
            autoComplete="nickname"
          />
        </label>
        <button
          type="button"
          disabled={!nickname.trim()}
          onClick={handleNicknameSubmit}
          className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-[#F0B429] text-base font-bold text-black disabled:opacity-40"
        >
          →
        </button>
      </div>
    )
  }

  if (screen === 'picker') {
    return (
      <RolePicker
        side={meet.side}
        meet={meet}
        myClientId={clientId}
        onPick={handlePickRole}
      />
    )
  }

  if (screen === 'waiting') {
    return <MeetWaiting meet={meet} />
  }

  if (screen === 'briefing' && isCaptain) {
    return (
      <BriefingScreen
        meet={meet}
        onSubmit={handleBriefingSubmit}
        onBack={() => {
          setForceBriefing(false)
          setScreen('lobby')
        }}
      />
    )
  }

  if (screen === 'plan' && myMember?.role && tactic && briefingComplete) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <RolePlanView
          meet={meet}
          tactic={tactic}
          myRole={myMember.role}
          viewRole={viewRole}
          mapLabel={mapLabel}
          isCaptain={isCaptain}
          previewRoles={sideRoles}
          onViewRoleChange={setViewRole}
          onBackToLobby={() => {
            setPlanActive(false)
            if (myMember?.role) setViewRole(myMember.role)
            persistMeet(meet)
            setScreen('lobby')
          }}
          onChangeRole={() => {
            setPlanActive(false)
            setScreen('picker')
          }}
          onChangeTactic={isCaptain ? () => setShowTacticPicker(true) : undefined}
        />
        {showTacticPicker && (
          <TacticPickerSheet
            tactics={tacticsForMeet}
            activeId={meet.tactic_id}
            onSelect={handleTacticSelect}
            onClose={() => setShowTacticPicker(false)}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <MeetLobby
        meet={meet}
        mapLabel={mapLabel}
        tacticName={tactic?.name}
        isCaptain={isCaptain}
        copied={copied}
        hasDemoTeam={hasDemoTeam}
        briefingComplete={briefingComplete}
        onCopyLink={copyLink}
        onOpenBriefing={
          isCaptain && !briefingComplete
            ? () => {
                setForceBriefing(true)
                setScreen('briefing')
              }
            : undefined
        }
        onChangeTactic={isCaptain && briefingComplete ? () => setShowTacticPicker(true) : undefined}
        onFillDemo={briefingComplete ? () => persistMeet(seedPreviewMembers(meet)) : undefined}
        onClearDemo={briefingComplete ? () => persistMeet(clearPreviewMembers(meet)) : undefined}
        onStartPlan={openPlan}
      />
      {showTacticPicker && briefingComplete && (
        <TacticPickerSheet
          tactics={tacticsForMeet}
          activeId={meet.tactic_id}
          onSelect={handleTacticSelect}
          onClose={() => setShowTacticPicker(false)}
        />
      )}
    </>
  )
}
