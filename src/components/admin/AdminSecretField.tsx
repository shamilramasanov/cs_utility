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

  useEffect(() => {
    setV(sessionStorage.getItem('cs2-admin-secret') ?? '')
  }, [])

  const apply = useCallback(() => {
    persistAndReloadIfChanged(v)
  }, [v])

  return (
    <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 py-3">
      <label className="mb-1.5 block text-[11px] text-[#888]">
        Ключ <code className="text-[#aaa]">ADMIN_SECRET</code> с сервера (тот же, что в Vercel / локальном{' '}
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
        placeholder="Вставь ADMIN_SECRET (как в Vercel)"
      />
    </div>
  )
}
