'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Grenade } from '@/types'
import { GRENADE_COLORS, GRENADE_LABELS, GRENADE_EMOJIS, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/lib/grenades'
import { useT } from '@/i18n'
import ThrowVariantOriginDock from './ThrowVariantOriginDock'

interface Props {
  grenade: Grenade
  onClose: () => void
  activeThrowVariantIndex?: number
  onThrowVariantIndexChange?: (i: number) => void
  /** true: часть flex-потока (карта видна сверху), без бэкдропа, без absolute */
  panel?: boolean
}

const THROW_LABELS: Record<string, string> = {
  normal: 'Левая кнопка мышки',
  jump: 'Левая кнопка+пробел',
  jumprun: 'w+левая кнопка+пробел',
  run: 'Правая кнопка мышки',
  right: 'Правая кнопка мышки',
  rightclick: 'Правая кнопка мышки',
  mouse2: 'Правая кнопка мышки',
  left_right: 'Левая+правая кнопка',
  leftright: 'Левая+правая кнопка',
  lr: 'Левая+правая кнопка',
  d_jumprun: 'd+левая кнопка+пробел',
  djumprun: 'd+левая кнопка+пробел',
  d_jump: 'd+левая кнопка+пробел',
  d_jumpthrow: 'd+левая кнопка+пробел',
}

const THROW_GUIDE_HINTS: Record<string, string> = {
  normal: 'Нажми и отпусти левую кнопку мышки.',
  jump: 'Одновременно: левая кнопка и пробел.',
  jumprun: 'Зажми W, затем одновременно левая кнопка и пробел.',
  run: 'Нажми и отпусти правую кнопку мышки.',
  right: 'Нажми и отпусти правую кнопку мышки.',
  rightclick: 'Нажми и отпусти правую кнопку мышки.',
  mouse2: 'Нажми и отпусти правую кнопку мышки.',
  left_right: 'Нажми левую и правую кнопку вместе.',
  leftright: 'Нажми левую и правую кнопку вместе.',
  lr: 'Нажми левую и правую кнопку вместе.',
  d_jumprun: 'Зажми D, затем одновременно левая кнопка и пробел.',
  djumprun: 'Зажми D, затем одновременно левая кнопка и пробел.',
  d_jump: 'Зажми D, затем одновременно левая кнопка и пробел.',
  d_jumpthrow: 'Зажми D, затем одновременно левая кнопка и пробел.',
}

export default function BottomSheet({
  grenade,
  onClose,
  activeThrowVariantIndex = 0,
  onThrowVariantIndexChange,
  panel = false,
}: Props) {
  const t = useT()
  const sheetRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaScrollRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const [showThrowGuide, setShowThrowGuide] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  const color = GRENADE_COLORS[grenade.type]
  const emoji = GRENADE_EMOJIS[grenade.type]
  const typeLabel = GRENADE_LABELS[grenade.type]
  const diffColor = DIFFICULTY_COLORS[grenade.difficulty] ?? '#888'
  const diffLabel = DIFFICULTY_LABELS[grenade.difficulty] ?? grenade.difficulty
  const variants = grenade.throw_variants?.filter(Boolean) ?? []
  const vi = Math.min(Math.max(0, activeThrowVariantIndex), Math.max(0, variants.length - 1))
  const activeVar = variants.length > 0 ? variants[vi] : null
  const showVariantDock = variants.length > 1 && Boolean(onThrowVariantIndexChange)
  const mediaUrl = activeVar?.media_url ?? grenade.media_url
  const gallery = (activeVar?.gallery_urls ?? grenade.gallery_urls)?.filter(Boolean) ?? []
  const throwType = activeVar?.throw_type ?? grenade.throw_type
  const variantDescription =
    activeVar?.description?.trim() && activeVar.description !== 'unused'
      ? activeVar.description
      : ''
  const rootDescription =
    grenade.description && grenade.description !== 'unused' ? grenade.description : ''
  const hasMediaBlock = Boolean(mediaUrl) || gallery.length > 0
  const throwLabel = THROW_LABELS[throwType] ?? throwType
  const throwGuideHint =
    activeVar?.method_hint?.trim() ||
    THROW_GUIDE_HINTS[throwType] ||
    'Используй комбинацию кнопок, указанную в чипе.'
  const throwGuideMedia = activeVar?.method_media_url?.trim() || ''

  useEffect(() => {
    const v = videoRef.current
    if (!v || !mediaUrl) return
    v.muted = true
    const play = () => {
      v.play().catch(() => {})
    }
    v.addEventListener('loadeddata', play)
    return () => v.removeEventListener('loadeddata', play)
  }, [mediaUrl])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !mediaUrl) return
    // При переключении позиции/варианта всегда начинаем ролик с начала,
    // даже если у разных вариантов совпадает один и тот же media_url.
    try {
      v.currentTime = 0
    } catch {
      /* ignore seek errors */
    }
    v.play().catch(() => {})
  }, [grenade.id, vi, mediaUrl])

  useEffect(() => {
    // При выборе другой гранаты/варианта всегда начинаем чтение контента сверху.
    const scroller = mediaScrollRef.current
    if (!scroller) return
    scroller.scrollTop = 0
  }, [grenade.id, vi])

  useEffect(() => {
    setShowThrowGuide(false)
  }, [grenade.id, vi])

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!showThrowGuide) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowThrowGuide(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showThrowGuide])

  const throwGuidePortal =
    portalReady && showThrowGuide && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[560] cursor-default border-0 bg-black/55 p-0"
              aria-label={t('common.close')}
              onClick={() => setShowThrowGuide(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="throw-guide-title"
              className="fixed left-1/2 top-1/2 z-[561] box-border w-[min(calc(100vw-2rem),22rem)] max-h-[min(85vh,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-emerald-400/45 bg-[#08140d] px-4 py-3 pr-12 shadow-[0_16px_48px_rgba(0,0,0,0.65)]"
            >
              <button
                type="button"
                onClick={() => setShowThrowGuide(false)}
                aria-label={t('common.close')}
                className="absolute right-2 top-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1a2e22] text-[#8fbc9a] transition-transform active:scale-90"
              >
                ✕
              </button>
              <p
                id="throw-guide-title"
                className="text-[11px] font-bold uppercase tracking-wide text-emerald-300"
              >
                Метод броска
              </p>
              <p className="mt-1 text-[12px] font-semibold text-emerald-100">{throwLabel}</p>
              {throwGuideMedia ? (
                <img
                  src={throwGuideMedia}
                  alt={throwLabel}
                  className="mt-2 max-h-28 w-full rounded-lg border border-emerald-400/30 object-contain bg-black/50"
                  loading="lazy"
                />
              ) : null}
              <p className="mt-2 text-[11px] leading-snug text-emerald-200/90">{throwGuideHint}</p>
            </div>
          </>,
          document.body,
        )
      : null

  useEffect(() => {
    if (panel) return
    const el = sheetRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY
      isDragging.current = true
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) {
        el.style.transform = `translateY(${delta}px)`
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current) return
      isDragging.current = false
      const delta = e.changedTouches[0].clientY - startY.current
      el.style.transform = ''
      if (delta > 80) onClose()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose, panel])

  if (panel) {
    return (
      <>
      <div
        ref={sheetRef}
        className="h-full flex flex-col slide-up"
        style={{
          background: '#0d0d0d',
          borderRadius: '16px 16px 0 0',
          transition: 'transform 0.1s',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
        }}
      >
        {/* Компактный ряд: тип, заголовок, бросок/позиция, закрыть */}
        <div className="relative flex shrink-0 items-start gap-2 border-b border-[#262626]/90 px-app-screen pb-2 pt-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-start gap-2 pt-2 pl-0.5">
              <span
                className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold sm:px-2.5 sm:text-[12px]"
                style={{ background: `${color}22`, color }}
              >
                {emoji} {typeLabel}
              </span>
              <span className="rounded-full border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1 text-[11px] font-semibold text-[#e6e6e6] sm:px-2.5 sm:text-[12px]">
                {grenade.title}
              </span>
              <button
                type="button"
                onClick={() => setShowThrowGuide((v) => !v)}
                className="throw-method-attention shrink-0 rounded-full border bg-[#102015] px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-[12px]"
              >
                {throwLabel}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-[#888] transition-transform active:scale-90"
          >
            ✕
          </button>
        </div>
        {(rootDescription || variantDescription) && (
          <p className="border-b border-[#262626]/55 px-app-screen py-1.5 text-[11px] leading-snug text-[#777] line-clamp-2">
            {variantDescription || rootDescription}
          </p>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col">
          {hasMediaBlock ? (
            <div
              ref={mediaScrollRef}
              className={`min-h-0 flex-1 overflow-y-auto snap-y snap-mandatory bg-black/30 ${
                showVariantDock ? 'pb-20' : ''
              }`}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {mediaUrl && (
                <section className="snap-start flex h-full min-h-0 flex-col justify-start bg-black shrink-0">
                  <video
                    ref={videoRef}
                    key={mediaUrl}
                    src={mediaUrl}
                    className="h-full w-full min-h-0 flex-1 object-cover object-center bg-black md:object-contain"
                    playsInline
                    loop
                    muted
                    controls
                  />
                </section>
              )}
              {gallery.map((url, i) => (
                <section
                  key={`${url}-${i}`}
                  className="snap-start flex h-full min-h-0 flex-col justify-start px-2 pt-0.5 shrink-0"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#666] px-2 pb-1 shrink-0">
                    Фото {i + 1}/{gallery.length}
                  </p>
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full min-h-0 flex-1 rounded-xl bg-[#111] object-cover object-center md:object-contain"
                    loading="lazy"
                  />
                </section>
              ))}
            </div>
          ) : (
            <div
              className={`flex min-h-0 flex-1 flex-col mx-4 mb-3 rounded-2xl items-center justify-center gap-1.5 ${
                showVariantDock ? 'pb-20' : ''
              }`}
              style={{ background: '#242424', border: `1px dashed ${color}44` }}
            >
              <div className="text-3xl">{emoji}</div>
              <div className="text-[#555] text-sm">Нет видео и фото</div>
            </div>
          )}
        </div>

        {showVariantDock && onThrowVariantIndexChange && (
          <ThrowVariantOriginDock
            pinToScreenBottom
            count={variants.length}
            activeIndex={vi}
            onChange={onThrowVariantIndexChange}
            labels={variants.map((v) => v.label)}
          />
        )}
      </div>
      {throwGuidePortal}
      </>
    )
  }

  return (
    <>
      <div
        className="absolute inset-0 bg-black/40 z-40"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />

      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-50 slide-up flex flex-col max-h-[92vh]"
        style={{
          background: '#1a1a1a',
          borderRadius: '20px 20px 0 0',
          transition: 'transform 0.1s',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
      >
        <div className="shrink-0 pt-2 pb-1">
          <div className="sheet-handle mx-auto" />
        </div>

        <div className="relative flex shrink-0 items-start gap-2 border-b border-[#333]/80 px-5 pb-2 pt-1">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-start gap-2 pt-2 pl-0.5">
              <span
                className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold sm:px-2.5 sm:text-[12px]"
                style={{ background: `${color}22`, color }}
              >
                {emoji} {typeLabel}
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium sm:px-2.5 sm:text-[12px]"
                style={{ background: `${diffColor}22`, color: diffColor }}
              >
                {diffLabel}
              </span>
              <span className="rounded-full border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1 text-[11px] font-semibold text-[#e6e6e6] sm:px-2.5 sm:text-[12px]">
                {grenade.title}
              </span>
              <button
                type="button"
                onClick={() => setShowThrowGuide((v) => !v)}
                className="throw-method-attention shrink-0 rounded-full border bg-[#102015] px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-[12px]"
              >
                {throwLabel}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-[#888] active:scale-90"
          >
            ✕
          </button>
        </div>

        {(rootDescription || variantDescription) && (
          <p className="border-b border-[#333]/50 px-5 py-1.5 text-[11px] leading-snug text-[#999] line-clamp-2">
            {variantDescription || rootDescription}
          </p>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col">
          {hasMediaBlock && (
            <div
              ref={mediaScrollRef}
              className={`min-h-0 flex-1 overflow-y-auto snap-y snap-mandatory rounded-t-2xl bg-black/30 ${
                showVariantDock ? 'pb-20' : ''
              }`}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {mediaUrl && (
                <section className="snap-start min-h-[min(72vh,520px)] flex flex-col justify-center bg-black shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-[#666] px-4 pt-2 pb-1">Видео</p>
                  <video
                    ref={videoRef}
                    key={mediaUrl}
                    src={mediaUrl}
                    className="h-[min(68vh,500px)] w-full object-cover bg-black md:object-contain"
                    playsInline
                    loop
                    muted
                    controls
                  />
                </section>
              )}
              {gallery.map((url, i) => (
                <section
                  key={`${url}-${i}`}
                  className="snap-start min-h-[min(60vh,420px)] flex flex-col justify-center px-2 py-3 shrink-0"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#666] px-2 pb-1">
                    Фото {i + 1} / {gallery.length}
                  </p>
                  <img
                    src={url}
                    alt=""
                    className="h-[min(58vh,400px)] w-full rounded-xl bg-[#111] object-cover md:object-contain"
                    loading="lazy"
                  />
                </section>
              ))}
            </div>
          )}

          {!hasMediaBlock && (
            <div
              className={`mx-5 mb-4 flex aspect-video shrink-0 flex-col items-center justify-center gap-2 rounded-2xl ${
                showVariantDock ? 'mb-20' : ''
              }`}
              style={{ background: '#242424', border: `1px dashed ${color}44` }}
            >
              <div className="text-4xl">{emoji}</div>
              <div className="text-[#555] text-sm">Нет видео и фото</div>
              <div className="text-[#333] text-xs">Добавь в админке</div>
            </div>
          )}
        </div>

        {showVariantDock && onThrowVariantIndexChange && (
          <ThrowVariantOriginDock
            pinToScreenBottom
            count={variants.length}
            activeIndex={vi}
            onChange={onThrowVariantIndexChange}
            labels={variants.map((v) => v.label)}
          />
        )}
      </div>
      {throwGuidePortal}
    </>
  )
}
