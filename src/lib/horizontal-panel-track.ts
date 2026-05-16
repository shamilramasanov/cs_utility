/** Быстрый отклик свайпа между панелями — единый тайминг по приложению. */
export const HORIZONTAL_PANEL_TRACK_TRANSITION =
  'transform 180ms cubic-bezier(0.32, 0.92, 0.2, 1)'

export function setHorizontalPanelTrackTransform(
  el: HTMLElement | null,
  index: number,
  viewportWidth: number,
  offsetPx: number,
  transition?: string,
): void {
  if (!el || viewportWidth <= 0) return
  if (transition !== undefined) {
    el.style.transition = transition
    el.style.willChange = transition === 'none' ? 'transform' : 'transform'
  }
  el.style.transform = `translate3d(${-(index * viewportWidth) + offsetPx}px, 0, 0)`
}
