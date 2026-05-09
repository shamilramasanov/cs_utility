'use client'

import { useRef, useState } from 'react'
import { uploadGrenadeMedia } from '@/lib/admin-upload-browser'

const BTN =
  'min-h-[56px] py-4 px-4 rounded-2xl text-base font-semibold touch-manipulation active:scale-[0.98] transition-transform disabled:opacity-50'

interface Props {
  videoUrl: string
  onVideoUrlChange: (v: string) => void
  galleryText: string
  onGalleryTextChange: (v: string) => void
}

function parseGalleryLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getDisplayFileName(url: string): string {
  try {
    const clean = url.split('?')[0].split('#')[0]
    const raw = clean.split('/').pop() ?? url
    const decoded = decodeURIComponent(raw)
    return decoded || url
  } catch {
    return url
  }
}

export default function MediaFields({
  videoUrl,
  onVideoUrlChange,
  galleryText,
  onGalleryTextChange,
}: Props) {
  const vidRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'video' | 'image' | null>(null)
  const [err, setErr] = useState('')

  const galleryLines = parseGalleryLines(galleryText)
  const setGalleryLines = (next: string[]) => onGalleryTextChange(next.join('\n'))

  const upload = async (file: File, kind: 'video' | 'image') => {
    setErr('')
    setBusy(kind)
    try {
      const url = await uploadGrenadeMedia(file)
      if (kind === 'video') {
        onVideoUrlChange(url)
      } else {
        const lines = parseGalleryLines(galleryText)
        lines.push(url)
        onGalleryTextChange(lines.join('\n'))
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось загрузить')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[#888] text-xs">Видео — ссылка или загрузка на сервер</span>
        <input
          className="mt-1 w-full rounded-xl bg-[#222] border border-[#333] px-3 py-3 text-sm min-h-[48px]"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          placeholder="https://… или загрузи файл ниже"
        />
        <input
          ref={vidRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) upload(f, 'video')
          }}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => vidRef.current?.click()}
          className={`mt-2 w-full ${BTN} bg-[#2a3a50] text-sky-200 border border-sky-700/50`}
        >
          {busy === 'video' ? 'Загрузка…' : '📤 Загрузить видео'}
        </button>
      </label>

      <label className="block">
        <span className="text-[#888] text-xs">
          Фото — ссылки (с новой строки) или загрузка по одному. Порядок можно менять кнопками ниже.
        </span>
        {galleryLines.length > 0 && (
          <div className="mt-2 space-y-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-2">
            {galleryLines.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="flex items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#171717] px-2 py-2"
              >
                <span className="w-6 shrink-0 text-center text-xs text-[#888]">{idx + 1}</span>
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[#333] bg-[#0f0f0f]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
                <input
                  className="min-w-0 flex-1 rounded-lg border border-[#333] bg-[#222] px-2 py-2 text-xs text-[#ddd]"
                  value={url}
                  onChange={(e) => {
                    const next = [...galleryLines]
                    next[idx] = e.target.value.trim()
                    setGalleryLines(next.filter(Boolean))
                  }}
                />
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx <= 0) return
                      const next = [...galleryLines]
                      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                      setGalleryLines(next)
                    }}
                    disabled={idx === 0}
                    className="rounded-md border border-[#3a3a3a] bg-[#222] px-2 py-1 text-xs text-[#ddd] disabled:opacity-40"
                    aria-label="Поднять фото выше"
                    title="Поднять выше"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx >= galleryLines.length - 1) return
                      const next = [...galleryLines]
                      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                      setGalleryLines(next)
                    }}
                    disabled={idx === galleryLines.length - 1}
                    className="rounded-md border border-[#3a3a3a] bg-[#222] px-2 py-1 text-xs text-[#ddd] disabled:opacity-40"
                    aria-label="Опустить фото ниже"
                    title="Опустить ниже"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryLines(galleryLines.filter((_, i) => i !== idx))
                    }}
                    className="rounded-md border border-red-800/50 bg-[#2f1616] px-2 py-1 text-xs text-red-200"
                    aria-label="Удалить фото"
                    title="Удалить фото"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {galleryLines.length > 0 && (
          <p className="mt-1 text-[11px] text-[#7d7d7d]">
            Сейчас: {galleryLines.map((u, i) => `${i + 1}) ${getDisplayFileName(u)}`).join(' · ')}
          </p>
        )}
        <textarea
          className="mt-1 w-full rounded-xl bg-[#222] border border-[#333] px-3 py-3 min-h-[80px] text-sm"
          value={galleryText}
          onChange={(e) => onGalleryTextChange(e.target.value)}
          placeholder="https://… или только загрузки"
        />
        <input
          ref={imgRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            let acc = galleryText
            for (const f of files) {
              setErr('')
              setBusy('image')
              try {
                const url = await uploadGrenadeMedia(f)
                const lines = parseGalleryLines(acc)
                lines.push(url)
                acc = lines.join('\n')
                onGalleryTextChange(acc)
              } catch (e) {
                setErr(e instanceof Error ? e.message : 'Не удалось загрузить')
                break
              } finally {
                setBusy(null)
              }
            }
          }}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => imgRef.current?.click()}
          className={`mt-2 w-full ${BTN} bg-[#2a3a50] text-sky-200 border border-sky-700/50`}
        >
          {busy === 'image' ? 'Загрузка…' : '📤 Загрузить фото'}
        </button>
      </label>

      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  )
}
