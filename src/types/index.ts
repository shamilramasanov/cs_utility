export type GrenadeType = 'smoke' | 'flash' | 'molotov' | 'he'
export type Side = 'T' | 'CT' | 'both'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Position {
  x: number
  y: number
}

export interface MapLayer {
  id: string
  label: string
  file: string
}

export interface MapCalibration {
  pos_x: number
  pos_y: number
  scale: number
}

export interface MapData {
  id: string
  display_name: string
  radar: string
  layers: MapLayer[]
  calibration: MapCalibration
  spawns: { ct: Position; t: Position }
  sites: Record<string, Position>
  competitive: boolean
}

/** Один способ броска в ту же точку приёма (разные старты → один land) */
export interface ThrowVariant {
  id: string
  label: string
  start_pos: Position
  throw_type: string
  media_url: string | null
  gallery_urls: string[]
  description: string
  /** Подсказка метода броска: gif/картинка с нажатиями. */
  method_media_url?: string | null
  /** Подсказка метода броска: текстовый сценарий. */
  method_hint?: string
}

export interface Grenade {
  id: string
  map: string
  title: string
  type: GrenadeType
  side: Side
  difficulty: Difficulty
  throw_type: string
  start_pos: Position
  land_pos: Position | null
  media_url: string | null
  description: string
  source: string
  /** Доп. кадры позиции (URL), листать после видео */
  gallery_urls?: string[]
  /** Имя файла слоя радара (например de_nuke_lower_radar_psd.png), если только для одного слоя */
  layer_file?: string | null
  /** Если задано: маркер на land_pos, линии от каждого варианта (в UI — по выбранному) */
  throw_variants?: ThrowVariant[]
  /** ID позиций (callouts), к которым относится бросок (старт). См. `src/data/positions.ts`. */
  position_ids?: string[]
}

/** Вариант броска в JSON админки (плоские координаты) */
export interface CustomThrowVariant {
  id: string
  label?: string
  sx: number
  sy: number
  throw_type?: string
  video_url?: string
  gallery?: string[]
  description?: string
  /** Gif/картинка подсказки метода броска. */
  method_media_url?: string
  /** Текст подсказки метода броска. */
  method_hint?: string
}

/** Запись админки — сохраняется в custom-lineups.json */
export interface CustomLineup {
  id: string
  map: string
  layer_file: string
  /** Точка приёма (маркер), если есть throw_variants; иначе единственная точка как раньше */
  x: number
  y: number
  type: GrenadeType
  title: string
  description: string
  video_url: string
  gallery: string[]
  side?: Side
  difficulty?: Difficulty
  /** Несколько стартов в одну точку x,y (приём) */
  throw_variants?: CustomThrowVariant[]
  /** ID позиций (callouts), к которым относится бросок. См. `src/data/positions.ts`. */
  position_ids?: string[]
}

export interface CustomLineupsFile {
  lineups: CustomLineup[]
  /** id из grenades.json — скрыты с карты (псевдо-удаление базы) */
  hidden_seed_ids?: string[]
}
