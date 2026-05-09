'use client'

import Link from 'next/link'
import { useT } from '@/i18n'

interface Props {
  /** `button` — как остальные кнопки в шапке админки; `inline` — текстовая ссылка */
  variant?: 'button' | 'inline'
}

export default function AdminChangelogLink({ variant = 'inline' }: Props) {
  const t = useT()
  const className =
    variant === 'button'
      ? 'inline-flex items-center h-9 px-3 rounded-full bg-[#1a1a1a] border border-[#333] text-[#F0B429] text-xs font-semibold no-underline active:scale-95 transition-transform shrink-0'
      : 'text-xs font-semibold text-[#F0B429] underline-offset-2 hover:underline shrink-0'
  return (
    <Link href="/admin/changelog" className={className}>
      {t('admin.changelogNav')}
    </Link>
  )
}
