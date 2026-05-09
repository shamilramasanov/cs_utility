import Link from 'next/link'
import { getMaps } from '@/lib/grenades'
import AdminChangelogLink from '@/components/admin/AdminChangelogLink'

export default function AdminIndexPage() {
  const maps = getMaps()
  return (
    <div className="bg-[#0d0d0d] text-white">
      <div className="mx-auto max-w-3xl px-app-screen pb-12 pt-4">
        <div className="mb-6 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#666]">Admin</p>
            <h1 className="text-2xl font-bold">Раскидки</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/catalog"
              className="rounded-full border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-xs font-semibold text-[#F0B429]/90"
            >
              Каталог позиций
            </Link>
            <AdminChangelogLink variant="button" />
          </div>
        </div>

        <p className="text-sm text-[#888] mb-5 leading-snug">
          Редактор по карте: радар, маркеры, медиа и сохранение в{' '}
          <code className="text-[#aaa]">src/data/custom-lineups.json</code>. Теги стороны и позиции выставляй в карточке
          точки — так же, как видит игрок на публичной карте.
        </p>

        <ul className="grid gap-2 sm:grid-cols-2">
          {maps.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl bg-[#161616] border border-[#262626] overflow-hidden"
            >
              <Link
                href={`/admin/${m.id}`}
                className="block px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{m.display_name}</span>
                  <span className="text-[#666] text-[10px] font-mono">{m.id}</span>
                </div>
                <span className="text-[11px] text-[#F0B429]/80 mt-1.5 block">
                  Открыть редактор →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className="inline-block mt-8 text-sm text-[#F0B429]">
          ← На главную
        </Link>
      </div>
    </div>
  )
}
