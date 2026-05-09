'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'

export interface RadarBox {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Раньше был сдвиг в px для «оптического» центра — на десктопе он расходился с реальным
 * object-fit в разных браузерах, маркеры визуально уезжали вниз. Оставляем геометрический центр.
 */
export const RADAR_CENTER_VERTICAL_BIAS_PX = 0

export function radarImageObjectPosition(yAlign: 'center' | 'top'): string {
  if (yAlign === 'top') return 'center top'
  return 'center'
}

/**
 * Прямоугольник, в который object-fit: contain вписывает картинку
 * (без «полей» вокруг неё в layout-box элемента img).
 */
export function getObjectFitContainRect(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number,
  /** Соответствует `object-position` по вертикали при `object-fit: contain`. */
  yAlign: 'center' | 'top' = 'center',
): RadarBox {
  if (naturalW <= 0 || naturalH <= 0 || boxW <= 0 || boxH <= 0) {
    return { left: 0, top: 0, width: boxW, height: boxH }
  }
  const scale = Math.min(boxW / naturalW, boxH / naturalH)
  const drawW = naturalW * scale
  const drawH = naturalH * scale
  const slackX = boxW - drawW
  const slackY = boxH - drawH
  const left = slackX / 2
  if (yAlign === 'top') {
    return { left, top: 0, width: drawW, height: drawH }
  }
  const top = Math.max(0, slackY / 2 - RADAR_CENTER_VERTICAL_BIAS_PX)
  return { left, top, width: drawW, height: drawH }
}

/**
 * Координаты области радара на экране — только «живая» картинка, не letterbox.
 * Зависимости эффекта — только `[imgReady, yAlign]` (фиксированная длина для Fast Refresh).
 */
export function useRadarImageBox(
  containerRef: RefObject<HTMLDivElement | null>,
  imgRef: RefObject<HTMLImageElement | null>,
  imgReady: boolean,
  yAlign: 'center' | 'top' = 'center',
): RadarBox | null {
  const [box, setBox] = useState<RadarBox | null>(null)

  useLayoutEffect(() => {
    if (!imgReady) {
      setBox(null)
      return
    }

    const measure = () => {
      const container = containerRef.current
      const img = imgRef.current
      if (!container || !img || !img.naturalWidth) return
      const boxW = container.clientWidth
      const boxH = container.clientHeight
      const rect = getObjectFitContainRect(
        img.naturalWidth,
        img.naturalHeight,
        boxW,
        boxH,
        yAlign,
      )
      setBox(rect)
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    const el = containerRef.current
    const img = imgRef.current
    if (el) ro.observe(el)
    if (img) ro.observe(img)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [imgReady, yAlign])

  return box
}
