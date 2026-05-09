'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { MapData } from '@/types'
import type { MapPosition, PositionCategory } from '@/types/positions'
import { positions as STATIC_POSITIONS } from '@/data/positions'
import { mergePositionCatalog } from '@/lib/position-catalog-merge'
import { getAdminSecretFromBrowser } from '@/lib/admin-client'
import { SearchInputLeadingIcon } from '@/components/SearchInputLeadingIcon'

const CATEGORIES: Array<{ id: PositionCategory; label: string }> = [
  { id: 'spawn', label: 'Спавн' },
  { id: 'a_site', label: 'Точка A' },
  { id: 'b_site', label: 'Точка B' },
  { id: 'mid', label: 'Мид' },
  { id: 'rotation', label: 'Ротация' },
  { id: 'utility', label: 'Утилити' },
]

function catalogPositionSearchBlob(p: MapPosition): string {
  return [
    p.id,
    p.label,
    String(p.category),
    p.side,
    p.parent_id ?? '',
    ...(p.aliases ?? []),
    p.label_i18n?.ru,
    p.label_i18n?.en,
    p.label_i18n?.uk,
  ]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' \n ')
    .toLowerCase()
}

/** Фильтр с учётом иерархии: совпал корень — показываем все sub; совпал только sub — корень и совпавшие sub. */
function filterCatalogRows(rows: MapPosition[], needle: string): MapPosition[] {
  const n = needle.trim().toLowerCase()
  if (!n) return rows

  const directMatch = (p: MapPosition) => catalogPositionSearchBlob(p).includes(n)
  const roots = rows.filter((p) => !p.parent_id)
  const subsByParent = new Map<string, MapPosition[]>()
  for (const p of rows) {
    if (!p.parent_id) continue
    const arr = subsByParent.get(p.parent_id) ?? []
    arr.push(p)
    subsByParent.set(p.parent_id, arr)
  }

  const out: MapPosition[] = []
  const orphanSubs: MapPosition[] = []
  const rootIds = new Set(roots.map((r) => r.id))

  for (const r of roots) {
    const childSubs = subsByParent.get(r.id) ?? []
    if (directMatch(r)) {
      out.push(r, ...childSubs)
      continue
    }
    const matchingSubs = childSubs.filter(directMatch)
    if (matchingSubs.length > 0) out.push(r, ...matchingSubs)
  }

  for (const p of rows) {
    if (!p.parent_id) continue
    if (rootIds.has(p.parent_id)) continue
    if (directMatch(p)) orphanSubs.push(p)
  }
  out.push(...orphanSubs)

  return out
}

interface Props {
  mapId: string
  map: MapData
}

export default function AdminCatalogClient({ mapId, map }: Props) {
  const [extensions, setExtensions] = useState<MapPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newFormOpen, setNewFormOpen] = useState(false)
  const [newFormSession, setNewFormSession] = useState(0)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [debouncedCatalogQuery, setDebouncedCatalogQuery] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedCatalogQuery(catalogQuery), 200)
    return () => window.clearTimeout(t)
  }, [catalogQuery])

  const staticIdsForMap = useMemo(
    () => new Set(STATIC_POSITIONS.filter((p) => p.map === mapId).map((p) => p.id)),
    [mapId],
  )

  const extIdsForMap = useMemo(
    () => new Set(extensions.filter((p) => p.map === mapId).map((p) => p.id)),
    [extensions, mapId],
  )

  const mergedCatalog = useMemo(
    () => mergePositionCatalog(STATIC_POSITIONS, extensions),
    [extensions],
  )

  const rows = useMemo(() => {
    const list = mergedCatalog.filter((p) => p.map === mapId)
    const roots = list.filter((p) => !p.parent_id)
    const subs = list.filter((p) => p.parent_id)
    roots.sort((a, b) => pickSort(a) - pickSort(b))
    subs.sort((a, b) => a.id.localeCompare(b.id))
    return [...roots, ...subs]
  }, [mergedCatalog, mapId])

  const filteredRows = useMemo(
    () => filterCatalogRows(rows, debouncedCatalogQuery),
    [rows, debouncedCatalogQuery],
  )

  const emptyNewDraft = useMemo(
    (): MapPosition => ({
      id: '',
      map: mapId,
      side: 'T',
      category: 'utility',
      label: '',
      label_i18n: { ru: '', en: '', uk: '' },
      hotspot: { x: 0.5, y: 0.5, radius: 0.05 },
    }),
    [mapId],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/position-catalog-extensions?map=${encodeURIComponent(mapId)}`, {
        headers: adminHeaders(),
        cache: 'no-store',
      })
      const j = r.ok ? await r.json() : { positions: [] }
      setExtensions(Array.isArray(j.positions) ? j.positions : [])
    } finally {
      setLoading(false)
    }
  }, [mapId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const rowSource = (p: MapPosition): 'static' | 'override' | 'ext' => {
    if (extIdsForMap.has(p.id)) return staticIdsForMap.has(p.id) ? 'override' : 'ext'
    return 'static'
  }

  const saveExtensions = async (nextForMap: MapPosition[]): Promise<boolean> => {
    setMsg('Сохранение…')
    const res = await fetch('/api/admin/position-catalog-extensions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        map: mapId,
        positions: nextForMap,
        secret: getAdminSecretFromBrowser() ?? undefined,
      }),
    })
    if (!res.ok) {
      setMsg('Ошибка сохранения')
      return false
    }
    await refresh()
    setMsg('Сохранено')
    setTimeout(() => setMsg(''), 2000)
    return true
  }

  const removeExtensionEntry = async (id: string) => {
    const next = extensions.filter((p) => !(p.map === mapId && p.id === id))
    await saveExtensions(next)
  }

  const duplicateFromRow = (p: MapPosition): MapPosition => ({ ...p, map: mapId })

  const openNewPositionForm = () => {
    setNewFormSession((s) => s + 1)
    setNewFormOpen(true)
    setEditingId(null)
  }

  const closeNewPositionForm = () => setNewFormOpen(false)

  const onEditCopy = (p: MapPosition) => {
    const copy = duplicateFromRow(p)
    const next = [...extensions.filter((x) => !(x.map === mapId && x.id === copy.id)), copy]
    setExtensions(next)
    setEditingId(copy.id)
    void saveExtensions(next)
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 text-white">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/admin" className="rounded-full bg-[#222] px-3 py-1.5 text-sm">
          ← Админ
        </Link>
        <Link
          href="/admin/catalog"
          className="rounded-full border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-[#aaa]"
        >
          Все карты
        </Link>
        <Link
          href={`/admin/${mapId}`}
          className="rounded-full border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-[#F0B429]/90"
        >
          Раскидки: {map.display_name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Каталог позиций</h1>
      <p className="mt-1 text-sm text-[#888]">
        База в коде + правки в{' '}
        <code className="text-[#aaa]">src/data/position-catalog-extensions.json</code>. Запись с тем же id
        заменяет позицию из бандла. Удали запись из JSON — снова подтянется статика.
      </p>
      {msg && <p className="mt-2 text-sm text-emerald-400/90">{msg}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (newFormOpen ? closeNewPositionForm() : openNewPositionForm())}
          className={`rounded-xl px-4 py-2 text-sm font-semibold active:scale-[0.99] ${
            newFormOpen
              ? 'border border-[#F0B429]/50 bg-[#F0B429]/15 text-[#F0B429]'
              : 'bg-[#F0B429] text-black'
          }`}
        >
          {newFormOpen ? 'Скрыть форму' : '+ Новая позиция'}
        </button>
        {newFormOpen && (
          <span className="text-[11px] text-[#666]">Заполни поля и нажми «Добавить в каталог».</span>
        )}
      </div>

      {newFormOpen && (
        <div className="mt-4 rounded-2xl border border-[#F0B429]/35 bg-[#141414] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F0B429]">Новая позиция</h2>
            <button
              type="button"
              onClick={closeNewPositionForm}
              className="rounded-lg border border-[#444] bg-[#222] px-3 py-1.5 text-xs text-[#aaa] active:scale-[0.98]"
            >
              Отмена
            </button>
          </div>
          <PositionInlineForm
            key={`new-${newFormSession}`}
            value={emptyNewDraft}
            submitLabel="Добавить в каталог"
            onSave={async (next) => {
              if (!next.id.trim() || !next.label.trim()) {
                setMsg('Укажи id и название (EN)')
                setTimeout(() => setMsg(''), 2500)
                return
              }
              const nextRow: MapPosition = { ...next, map: mapId }
              const mergedExt = [...extensions.filter((x) => !(x.map === mapId && x.id === nextRow.id)), nextRow]
              setExtensions(mergedExt)
              const ok = await saveExtensions(mergedExt)
              if (ok) closeNewPositionForm()
            }}
          />
        </div>
      )}

      <div className="mt-4">
        <div className="relative">
          <SearchInputLeadingIcon />
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            value={catalogQuery}
            onChange={(e) => setCatalogQuery(e.target.value)}
            placeholder="Поиск: id, название, алиасы, категория, сторона, parent_id…"
            className="h-11 w-full rounded-2xl border border-[#2a2a2a] bg-[#141414] pl-10 pr-4 text-sm text-white placeholder:text-[#555] focus:border-[#F0B429]/50 focus:outline-none"
          />
        </div>
        {!loading && (
          <p className="mt-1.5 text-[11px] text-[#666]">
            {debouncedCatalogQuery.trim()
              ? `Показано ${filteredRows.length} из ${rows.length}`
              : `Всего позиций: ${rows.length}`}
          </p>
        )}
      </div>

      {loading ? (
        <p className="mt-6 text-[#888]">Загрузка…</p>
      ) : filteredRows.length === 0 && debouncedCatalogQuery.trim() ? (
        <p className="mt-6 text-sm text-[#888]">Ничего не найдено — попробуй другой запрос.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filteredRows.map((p) => {
            const src = rowSource(p)
            const isSub = Boolean(p.parent_id)
            return (
              <li
                key={p.id}
                className={`rounded-2xl border border-[#2a2a2a] bg-[#141414] p-3 ${
                  isSub ? 'ml-4 border-l-2 border-l-[#F0B429]/40' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-[#F0B429]">{p.id}</span>
                      {isSub && (
                        <span className="rounded-full bg-[#2a2a2a] px-2 py-0.5 text-[10px] text-[#aaa]">
                          sub · {p.parent_id}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          src === 'static'
                            ? 'bg-[#1a2a1a] text-emerald-300'
                            : src === 'override'
                              ? 'bg-[#3a3018] text-[#F0B429]'
                              : 'bg-[#1a253a] text-sky-300'
                        }`}
                      >
                        {src === 'static' ? 'база' : src === 'override' ? 'JSON · правка' : 'JSON · новая'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-white">
                      {p.label}
                      {p.label_i18n?.ru ? <span className="text-[#888]"> · {p.label_i18n.ru}</span> : null}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#666]">
                      {p.side} · {p.category}
                      {p.hotspot
                        ? ` · hotspot ${p.hotspot.x.toFixed(2)},${p.hotspot.y.toFixed(2)} r=${(p.hotspot.radius ?? 0.05).toFixed(2)}`
                        : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {src !== 'static' && (
                      <button
                        type="button"
                        onClick={() => removeExtensionEntry(p.id)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-200"
                      >
                        Убрать из JSON
                      </button>
                    )}
                    {src === 'static' && (
                      <button
                        type="button"
                        onClick={() => onEditCopy(p)}
                        className="rounded-lg border border-[#444] bg-[#222] px-2 py-1 text-xs text-white"
                      >
                        Править копией в JSON
                      </button>
                    )}
                    {(src === 'ext' || src === 'override') && (
                      <button
                        type="button"
                        onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                        className="rounded-lg border border-[#444] bg-[#222] px-2 py-1 text-xs text-white"
                      >
                        {editingId === p.id ? 'Свернуть' : 'Поля'}
                      </button>
                    )}
                  </div>
                </div>
                {editingId === p.id && (src === 'ext' || src === 'override') && (
                  <PositionInlineForm
                    key={p.id}
                    value={p}
                    onSave={(next) => {
                      const others = extensions.filter((x) => !(x.map === mapId && x.id === p.id))
                      const merged = [...others, next]
                      setExtensions(merged)
                      void saveExtensions(merged)
                      setEditingId(null)
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function pickSort(p: MapPosition): number {
  const o = { spawn: 0, a_site: 1, mid: 2, b_site: 3, rotation: 4, utility: 5 }
  return o[p.category] ?? 9
}

function adminHeaders(): Record<string, string> {
  const sec = getAdminSecretFromBrowser()
  return sec ? { 'x-admin-secret': sec } : {}
}

function PositionInlineForm({
  value,
  onSave,
  submitLabel = 'Сохранить поля',
}: {
  value: MapPosition
  onSave: (p: MapPosition) => void | Promise<void>
  submitLabel?: string
}) {
  const [id, setId] = useState(value.id)
  const [label, setLabel] = useState(value.label)
  const [ru, setRu] = useState(value.label_i18n?.ru ?? '')
  const [side, setSide] = useState<'T' | 'CT' | 'both'>(value.side)
  const [category, setCategory] = useState<PositionCategory>(value.category)
  const [parentId, setParentId] = useState(value.parent_id ?? '')
  const [hx, setHx] = useState(String(value.hotspot?.x ?? ''))
  const [hy, setHy] = useState(String(value.hotspot?.y ?? ''))
  const [hr, setHr] = useState(String(value.hotspot?.radius ?? '0.05'))

  return (
    <div className="mt-3 grid gap-2 border-t border-[#2a2a2a] pt-3 sm:grid-cols-2">
      <label className="block text-[11px] text-[#888]">
        id
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] text-[#888]">
        label (en)
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] text-[#888] sm:col-span-2">
        label_ru
        <input
          value={ru}
          onChange={(e) => setRu(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] text-[#888]">
        side
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as 'T' | 'CT' | 'both')}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        >
          <option value="T">T</option>
          <option value="CT">CT</option>
          <option value="both">both</option>
        </select>
      </label>
      <label className="block text-[11px] text-[#888]">
        category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PositionCategory)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] text-[#888] sm:col-span-2">
        parent_id (sub-spot, опционально)
        <input
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          placeholder="например ramp"
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] text-[#888]">
        hotspot x
        <input
          value={hx}
          onChange={(e) => setHx(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] text-[#888]">
        hotspot y
        <input
          value={hy}
          onChange={(e) => setHy(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-[11px] text-[#888]">
        radius
        <input
          value={hr}
          onChange={(e) => setHr(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => {
            const x = Number(hx)
            const y = Number(hy)
            const r = Number(hr)
            const next: MapPosition = {
              ...value,
              id: id.trim(),
              label: label.trim(),
              side,
              category,
              label_i18n: {
                ru: ru.trim() || label.trim(),
                en: label.trim(),
                uk: label.trim(),
              },
              parent_id: parentId.trim() ? parentId.trim() : undefined,
              hotspot:
                Number.isFinite(x) && Number.isFinite(y)
                  ? { x, y, radius: Number.isFinite(r) ? r : 0.05 }
                  : undefined,
            }
            if (!next.parent_id) delete next.parent_id
            void Promise.resolve(onSave(next))
          }}
          className="mt-2 rounded-xl bg-[#F0B429] px-4 py-2 text-sm font-semibold text-black"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
