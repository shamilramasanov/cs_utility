'use client'

import { useCallback, useEffect, useState } from 'react'

function persistAndReloadIfChanged(nextRaw: string) {
  const prev = sessionStorage.getItem('cs2-admin-secret') ?? ''
  const next = nextRaw.trim()
  sessionStorage.setItem('cs2-admin-secret', next)
  if (next !== prev) window.location.reload()
}

export default function AdminSecretField() {
  const [v, setV] = useState('')
  const [hydrated, setHydrated] = useState(false)
  /** Показать полную форму (в т.ч. после «Изменить»). */
  const [editOpen, setEditOpen] = useState(true)

  useEffect(() => {
    const raw = sessionStorage.getItem('cs2-admin-secret') ?? ''
    setV(raw)
    const has = raw.trim().length > 0
    setEditOpen(!has)
    setHydrated(true)
  }, [])

  const apply = useCallback(() => {
    persistAndReloadIfChanged(v)
  }, [v])

  const hasSecret = v.trim().length > 0
  const collapsed = hydrated && hasSecret && !editOpen

  if (!hydrated) {
    return (
      <div
        className="mb-4 h-[5.5rem] rounded-xl border border-[#2a2a2a] bg-[#141414]/70"
        aria-busy="true"
        aria-label="Загрузка блока ключа"
      />
    )
  }

  if (collapsed) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 py-2">
        <p className="text-[11px] text-[#888]">
          Ключ <code className="text-[#aaa]">ADMIN_SECRET</code> задан в этой вкладке (
          <code className="text-[#aaa]">sessionStorage</code>).
        </p>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="shrink-0 rounded-lg border border-[#444] bg-[#222] px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#2a2a2a]"
        >
          Изменить
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 py-3">
      {hydrated && hasSecret ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setEditOpen(false)}
            className="rounded-lg border border-[#444] bg-[#222] px-2.5 py-1 text-[10px] text-[#aaa] hover:bg-[#2a2a2a]"
          >
            Свернуть
          </button>
        </div>
      ) : null}
      <label className="mb-1.5 block text-[11px] text-[#888]">
        Ключ <code className="text-[#aaa]">ADMIN_SECRET</code> с сервера (тот же, что в Cloudflare / локальном{' '}
        <code className="text-[#aaa]">.env</code>) — введи сюда на <strong className="text-[#ccc]">этом сайте</strong>;
        в браузер он сам не подставляется. Хранится только в <code className="text-[#aaa]">sessionStorage</code>.
      </label>
      <p className="mb-2 text-[10px] leading-snug text-[#666]">
        После ввода нажми <strong className="text-[#888]">Enter</strong> или кликни вне поля — страница обновится и
        запросы пойдут с заголовком.
      </p>
      <input
        type="password"
        autoComplete="off"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => persistAndReloadIfChanged(v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            apply()
          }
        }}
        className="min-h-[48px] w-full rounded-xl border border-[#444] bg-[#222] px-3 py-3 text-base"
        placeholder="Вставь ADMIN_SECRET (как в Cloudflare)"
      />
    </div>
  )
}
