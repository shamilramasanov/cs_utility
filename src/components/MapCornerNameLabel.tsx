'use client'

/** Плашка названия карты в левом верхнем углу блока миникарты (как на выборе зоны). */
export default function MapCornerNameLabel({
  name,
  lowerOnMdForFloatingBar = false,
}: {
  name: string
  /** Под фикс. «Откуда бросаем?» на мобиле — не уезжать под оверлей */
  lowerOnMdForFloatingBar?: boolean
}) {
  /** Ниже шапки «Откуда бросаем?»; после ужатия шапки — ~3.25rem достаточно */
  const topCls = lowerOnMdForFloatingBar
    ? 'top-[3.25rem] md:top-3'
    : 'top-2.5 sm:top-3'
  return (
    <p
      className={`pointer-events-none absolute left-2.5 z-20 max-w-[calc(100%-5rem)] truncate rounded-md bg-black/55 px-2 py-1 text-[10px] font-black uppercase leading-tight tracking-wider text-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-md sm:left-3 sm:max-w-[min(70%,18rem)] sm:px-2.5 sm:py-1 sm:text-[11px] ${topCls}`}
      aria-hidden
    >
      {name}
    </p>
  )
}
