/** Общая сетка верхней панели тактика ↔ раскидки (фиксированные высоты — без прыжков). */
export const MEET_TOOLBAR_SHELL_CLASS =
  'sticky top-0 z-30 shrink-0 border-b border-[#1f1f1f] bg-[#0d0d0d]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#0d0d0d]/88'

export const MEET_TOOLBAR_INNER_CLASS = 'space-y-2 px-app-screen pb-3 pt-1'

/** Слот под заголовок тактики или ряд фильтра гранат. */
export const MEET_CONTEXT_SLOT_CLASS = 'flex min-h-[5.125rem] flex-col justify-start'

/** Высота ряда «Тактика / Раскидки» (как блок T/CT). */
export const MEET_DOCK_SLOT_CLASS = 'h-11 shrink-0'

/** Контент карты под панелью (как в PositionSelector). */
export const MEET_MAP_PANEL_CLASS = 'flex min-h-0 flex-1 flex-col px-app-screen pt-1'
