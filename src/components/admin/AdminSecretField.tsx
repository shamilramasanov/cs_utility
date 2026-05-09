'use client'

import { useEffect, useState } from 'react'

export default function AdminSecretField() {
  const [v, setV] = useState('')

  useEffect(() => {
    setV(sessionStorage.getItem('cs2-admin-secret') ?? '')
  }, [])

  return (
    <div className="px-3 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl mb-4">
      <label className="text-[11px] text-[#888] block mb-1.5">
        Если включён <code className="text-[#aaa]">ADMIN_SECRET</code> в .env — введи ключ (хранится только в
        этом браузере):
      </label>
      <input
        type="password"
        autoComplete="off"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const prev = sessionStorage.getItem('cs2-admin-secret') ?? ''
          const next = v.trim()
          sessionStorage.setItem('cs2-admin-secret', next)
          if (next !== prev) window.location.reload()
        }}
        className="w-full rounded-xl bg-[#222] border border-[#444] px-3 py-3 text-base min-h-[48px]"
        placeholder="Секрет для API и загрузки файлов"
      />
    </div>
  )
}
