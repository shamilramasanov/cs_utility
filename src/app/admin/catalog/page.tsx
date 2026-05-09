import Link from 'next/link'
import { getMaps } from '@/lib/grenades'

export default function AdminCatalogIndexPage() {
  const maps = getMaps()
  return (
    <div className="min-h-screen bg-[#0d0d0d] px-3 py-4 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="inline-block rounded-full bg-[#222] px-3 py-1.5 text-sm">
          ← Админ
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Каталог позиций</h1>
        <p className="mt-1 text-sm text-[#888]">Выбери карту — список callout’ов и правки в JSON без пересборки кода.</p>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {maps.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/catalog/${m.id}`}
                className="block rounded-2xl border border-[#262626] bg-[#161616] px-4 py-3 transition-colors hover:bg-[#1a1a1a]"
              >
                <span className="font-semibold">{m.display_name}</span>
                <span className="mt-1 block font-mono text-[10px] text-[#666]">{m.id}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
