import type { Side } from './index'

export type PositionCategory =
  | 'spawn'
  | 'a_site'
  | 'b_site'
  | 'mid'
  | 'rotation'
  | 'utility'

export interface PositionHotspot {
  /** Нормализованные координаты [0..1] на радар-PNG */
  x: number
  y: number
  /** Радиус кликабельной зоны в нормализованных единицах. По умолчанию 0.05. */
  radius?: number
  /** Какой слой радара (для Nuke — 'upper' / 'lower'); если не задано — все слои. */
  layer_id?: string
}

export type LocalizedString = Partial<Record<'ru' | 'en' | 'uk', string>>

export interface MapPosition {
  /** Стабильный slug, попадает в URL (`apartments`, `top_mid`). */
  id: string
  /** Карта (`de_mirage`, `de_dust2`, ...). */
  map: string
  /** К какой стороне применима. `both` — для общих локаций (например, mid). */
  side: Side
  category: PositionCategory
  /** Канонический англ. callout. */
  label: string
  /** Локализованные имена (RU/EN/UK). */
  label_i18n?: LocalizedString
  /** Альтернативные названия — для поиска. */
  aliases?: string[]
  /** Кружок на радаре. */
  hotspot?: PositionHotspot
  /** In-game POV скриншот для визуального picker'а (план UI §5.4). */
  screenshot_url?: string

  /**
   * Если задано — это sub-spot (под-позиция, физическая точка появления игрока).
   * Sub-spot'ы НЕ показываются в `PositionList` / `PositionPhotoGrid` —
   * они появляются как «второй ярус» picker-а только после выбора родителя.
   */
  parent_id?: string
  /**
   * Точка на радаре, где физически стоит игрок (для отрисовки маркера sub-spot'а
   * на карте и подсветки её при выборе).
   */
  point?: { x: number; y: number }
  /** Короткое описание для подсказки под фото в правой панели. */
  description_i18n?: LocalizedString
}

/**
 * Runtime-правки позиции (живут в `src/data/position-overrides.json`,
 * редактируются модераторами через админку, мерджатся поверх статики).
 *
 * Это позволяет заливать `screenshot_url` (in-game POV) без пересборки кода —
 * аналогично тому, как `custom-lineups.json` хранит модерируемые раскидки.
 */
export interface PositionOverride {
  screenshot_url?: string
  /** Вертикальное позиционирование фото цели в UI */
  screenshot_position?: 'top' | 'center' | 'bottom'
  /** Тонкая настройка по Y в процентах (0..100), приоритетнее screenshot_position */
  screenshot_focus_y?: number
  /** Тонкая настройка по X в процентах (0..100) */
  screenshot_focus_x?: number
  /** Масштаб фото в блоке цели (0.6..2.5) */
  screenshot_zoom?: number
}

export interface PositionOverridesFile {
  overrides: Record<string, PositionOverride>
}

export interface PositionZone {
  /** Стабильный id зоны (например: a, mid, b, lurk). */
  id: string
  /** Название зоны для UI. */
  label: string
  /** Фоновое фото зоны для этапа выбора зоны. */
  image_url?: string
  /** Порядок отображения (меньше = выше). */
  order: number
  /** Позиции (start areas), которые относятся к зоне. */
  position_ids: string[]
  /** Позиции, временно скрытые из пользовательского выбора (чекбокс в админке). */
  disabled_position_ids?: string[]
}

export interface PositionZonesFile {
  maps: Record<
    string,
    Partial<Record<'t' | 'ct', PositionZone[]>>
  >
}
