'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import QuickCreateSheet from '@/components/team/QuickCreateSheet'
import { useT } from '@/i18n'
import { getClientId, getSavedNickname, saveNickname } from '@/lib/client-id'
import { buildMeetPath, createMeet } from '@/lib/meet'

export default function TeamHome() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [nickname, setNickname] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setNickname(getSavedNickname())
    if (searchParams.get('create') === '1') setCreateOpen(true)
  }, [searchParams])

  const handleCreate = useCallback(() => {
    const nick = nickname.trim()
    if (!nick) return
    saveNickname(nick)
    const meet = createMeet({
      captainId: getClientId(),
      captainNickname: nick,
    })
    setCreatedUrl(buildMeetPath(meet))
    setCreateOpen(false)
  }, [nickname])

  const copyCreated = useCallback(async () => {
    if (!createdUrl) return
    try {
      await navigator.clipboard.writeText(createdUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }, [createdUrl])

  const meetPathFromCreated = useCallback(() => {
    if (!createdUrl) return ''
    return createdUrl.replace(/^https?:\/\/[^/]+/, '')
  }, [createdUrl])

  const goToLobby = useCallback(() => {
    const path = meetPathFromCreated()
    if (path) router.push(path)
  }, [meetPathFromCreated, router])

  const joinMeet = useCallback(() => {
    const code = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length < 4) return
    router.push(`/team/${code}`)
  }, [joinCode, router])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-app-screen pb-8 pt-6">
      <h1 className="text-2xl font-bold">{t('team.title')}</h1>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-[#F0B429] text-base font-bold text-black"
        >
          {t('team.create')}
        </button>
        <Link
          href="/"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-[#333] text-sm font-semibold text-[#ccc]"
        >
          {t('map.backToMaps')}
        </Link>
      </div>

      <div className="mt-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#777]">
          {t('team.join')}
        </p>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={t('team.codePlaceholder')}
            className="h-12 min-w-0 flex-1 rounded-xl border border-[#333] bg-[#141414] px-3 font-mono text-base tracking-widest"
            maxLength={8}
            autoCapitalize="characters"
          />
          <button
            type="button"
            onClick={joinMeet}
            disabled={joinCode.trim().length < 4}
            className="h-12 shrink-0 rounded-xl bg-[#1a1a1a] px-5 text-sm font-bold text-[#F0B429] disabled:opacity-40"
          >
            {t('team.joinGo')}
          </button>
        </div>
      </div>

      {createdUrl && (
        <>
          <button
            type="button"
            aria-label={t('common.close')}
            className="fixed inset-0 z-[80] bg-black/55"
            onClick={() => setCreatedUrl(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[90] rounded-t-2xl border-t border-[#333] bg-[#1a1a1a] px-app-screen pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4">
            <p className="mb-4 text-center text-lg font-bold text-[#27AE60]">✓ {t('team.created')}</p>
            <p className="mb-4 text-center font-mono text-3xl font-bold tracking-[0.35em]">
              {createdUrl.match(/\/team\/([^?]+)/)?.[1] ?? ''}
            </p>
            <button
              type="button"
              onClick={copyCreated}
              className="mb-3 flex h-14 w-full items-center justify-center rounded-xl bg-[#F0B429] text-sm font-bold text-black"
            >
              {copied ? t('team.copied') : t('team.copyLink')}
            </button>
            <button
              type="button"
              onClick={goToLobby}
              className="flex h-14 w-full items-center justify-center rounded-xl border border-[#333] bg-[#141414] text-sm font-bold"
            >
              {t('team.goLobby')}
            </button>
          </div>
        </>
      )}

      <QuickCreateSheet
        open={createOpen}
        nickname={nickname}
        onNicknameChange={setNickname}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
