'use client'

import Link from 'next/link'
import { useT } from '@/i18n'
import type { MapData } from '@/types'
import type { SideKey } from '@/lib/side'

interface Props {
  map: MapData
  pickHref?: { t: string; ct: string }
  onPick?: (side: SideKey) => void
}

const T_COLOR = '#F0B429'
const CT_COLOR = '#3B82F6'

export default function SideSelector({ map, pickHref, onPick }: Props) {
  const t = useT()
  const useLinks = Boolean(pickHref?.t && pickHref?.ct)

  return (
    <div
      className="relative isolate z-0 flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip bg-[#0d0d0d]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="side-selector-title"
    >
      {/* Фон как на скриншоте: приглушённый миникар */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-center bg-cover opacity-20"
        style={{
          backgroundImage: `url(/minimaps/${map.layers[0]?.file ?? map.radar})`,
          filter: 'blur(2px)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90"
        aria-hidden
      />

      <header className="relative z-40 flex shrink-0 items-center gap-2 px-app-screen pb-3 pt-3">
        <Link
          href="/"
          prefetch={false}
          className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#1a1a1a] text-lg transition-transform active:scale-90 [-webkit-tap-highlight-color:transparent]"
          aria-label={t('map.backToMaps')}
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] uppercase tracking-wider text-[#888]">{map.display_name}</p>
          <h2 id="side-selector-title" className="truncate text-lg font-bold leading-tight text-white">
            {t('side.title')}
          </h2>
        </div>
      </header>

      {/* min-w-0 на flex-детях — иначе на iOS карточки вылезают за экран */}
      <div className="relative z-40 flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col gap-3 overflow-x-clip px-app-screen pb-2 pt-1 sm:flex-row sm:items-stretch sm:gap-4 sm:pb-4 sm:pt-2">
        <SideChoice
          side="t"
          useLinks={useLinks}
          href={pickHref?.t}
          onPick={onPick}
          color={T_COLOR}
          short={t('side.t.short')}
          full={t('side.t.full')}
          hint={t('side.t.hint')}
        />
        <SideChoice
          side="ct"
          useLinks={useLinks}
          href={pickHref?.ct}
          onPick={onPick}
          color={CT_COLOR}
          short={t('side.ct.short')}
          full={t('side.ct.full')}
          hint={t('side.ct.hint')}
        />
      </div>

      <p className="relative z-40 shrink-0 px-app-screen pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-center text-[10px] leading-snug text-[#666] max-sm:break-words sm:text-xs">
        {t('side.subtitle')}
      </p>
    </div>
  )
}

interface ChoiceProps {
  side: SideKey
  useLinks: boolean
  href?: string
  onPick?: (side: SideKey) => void
  color: string
  short: string
  full: string
  hint: string
}

function SideChoice({ side, useLinks, href, onPick, color, short, full, hint }: ChoiceProps) {
  const chip = `${short}-side`
  const sideImageUrl = side === 't' ? '/side-selection/t.png' : '/side-selection/ct.png'
  /** Круг только внутри padding-box карточки — без отрицательных inset (иначе режется у края экрана на iOS). */
  const badgeChars = short.length
  const badgeTextClass =
    badgeChars <= 2 ? `text-[clamp(1.35rem,5.5vmin,2.125rem)] sm:text-[clamp(2.25rem,3vw,3rem)]` : 'text-sm sm:text-base'

  const shellClass =
    'group relative z-50 flex min-h-[max(8rem,21dvh)] w-full min-w-0 max-w-full flex-1 basis-0 touch-manipulation flex-col overflow-hidden rounded-3xl border-2 box-border [-webkit-user-select:none] select-none [-webkit-tap-highlight-color:transparent] [contain:paint] transition-opacity active:opacity-[0.93] sm:min-h-[220px]'

  const style = {
    background: `linear-gradient(135deg, ${color}1f 0%, ${color}05 60%)`,
    borderColor: `${color}55`,
    touchAction: 'manipulation',
  } as const

  const deco = (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: `url(${sideImageUrl})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-black/30 to-black/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-3 top-3 z-0 flex h-[4rem] w-[4rem] items-center justify-center rounded-full font-black leading-none shadow-none sm:right-6 sm:top-6 sm:h-[6.75rem] sm:w-[6.75rem]"
        style={{ background: color, color: '#0a0a0a' }}
        aria-hidden
      >
        <span className={badgeTextClass}>{short}</span>
      </div>
      <div className="relative z-10 mt-auto flex min-h-0 min-w-0 flex-1 flex-col justify-end px-5 pb-[1.125rem] pl-5 pt-4 text-left max-sm:pr-[5.75rem] sm:min-h-[6.25rem] sm:p-6 sm:pr-7">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
          {chip}
        </p>
        <h3 className="mt-1 break-words text-2xl font-bold leading-snug tracking-tight text-white">{full}</h3>
        <p className="mt-1.5 break-words text-sm leading-snug text-[#aaa]">{hint}</p>
      </div>
    </>
  )

  if (useLinks && href) {
    return (
      <Link href={href} scroll={false} prefetch={false} className={shellClass + ' cursor-pointer'} style={style}>
        {deco}
      </Link>
    )
  }

  if (onPick) {
    return (
      <button type="button" className={shellClass + ' cursor-pointer text-left'} style={style} onClick={() => onPick(side)}>
        {deco}
      </button>
    )
  }

  return (
    <div className={`${shellClass} opacity-60`} style={style} role="status">
      {deco}
    </div>
  )
}
