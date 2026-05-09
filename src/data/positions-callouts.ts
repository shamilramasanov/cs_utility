/**
 * Полные каталоги callouts для всех карт кроме Mirage (Mirage см. positions.ts).
 * Источники: Total CS callouts, CS Console, Liquipedia, cs2pulse / сообщество.
 * Координаты hotspot — приблизительные (норм. PNG-радар), можно уточнять через DevTools.
 */
import type { MapPosition } from '@/types/positions'
import type { Side } from '@/types'
import type { PositionCategory } from '@/types/positions'

function ca(
  mapId: string,
  slug: string,
  side: Side,
  category: PositionCategory,
  label: string,
  ru: string,
  uk: string,
  x: number,
  y: number,
  radius = 0.05,
  aliases?: string[],
  layer?: 'upper' | 'lower',
): MapPosition {
  const prefix = mapId.replace(/^de_/, '')
  const hotspot = { x, y, radius, ...(layer ? { layer_id: layer } : {}) }
  return {
    id: `${prefix}_${slug}`,
    map: mapId,
    side,
    category,
    label,
    label_i18n: { ru, en: label, uk },
    aliases,
    hotspot,
  }
}

/** Dust II (~24 зоны) — de_dust2 */
const dust2: MapPosition[] = [
  ca('de_dust2', 'long_doors', 'T', 'mid', 'Long Doors', 'Длинные двери', 'Довгі двері', 0.52, 0.78),
  ca('de_dust2', 'outside_long', 'both', 'mid', 'Outside Long', 'Снаружи лонга', 'Зовні лонгу', 0.62, 0.62, 0.06),
  ca('de_dust2', 'blue', 'both', 'a_site', 'Blue', 'Лонг-блю', 'Блю лонгу', 0.88, 0.14, 0.04, ['long corner', 'угол']),
  ca('de_dust2', 'pit', 'both', 'a_site', 'Pit', 'Пит', 'Піт', 0.91, 0.18),
  ca('de_dust2', 'car', 'both', 'a_site', 'Car', 'Машина', 'Авто', 0.83, 0.2),
  ca('de_dust2', 'catwalk', 'both', 'mid', 'Catwalk', 'Кэт к шорту', 'Кет до шорту', 0.58, 0.34),
  ca('de_dust2', 'mid_doors', 'both', 'mid', 'Mid Doors', 'Мид-дорс', 'Мід-двері', 0.5, 0.36),
  ca('de_dust2', 'xbox', 'both', 'mid', 'Xbox', 'Иксбокс', 'Іксбокс', 0.48, 0.44, 0.05, ['иксбокс']),
  ca('de_dust2', 'top_mid', 'T', 'mid', 'Top Mid', 'Топ-мид', 'Топ-мід', 0.41, 0.58, 0.055, ['suicide', 'самоуб']),
  ca('de_dust2', 'lower_tunnels', 'T', 'rotation', 'Lower Tunnels', 'Нижние тоннели', 'Нижні тунелі', 0.28, 0.52, 0.055),
  ca('de_dust2', 'upper_tunnels', 'T', 'rotation', 'Upper Tunnels', 'Верхние тоннели', 'Верхні тунелі', 0.24, 0.42, 0.055),
  ca('de_dust2', 'a_short', 'both', 'a_site', 'Short', 'Шорт А', 'Шорт А', 0.66, 0.26, 0.05, ['a short']),
  ca('de_dust2', 'goose', 'CT', 'a_site', 'Goose', 'Гусь', 'Гусь', 0.71, 0.2),
  ca('de_dust2', 'ramp', 'both', 'a_site', 'Ramp', 'Рампа А', 'Рампа А', 0.68, 0.22),
  ca('de_dust2', 'elevator', 'both', 'a_site', 'Elevator', 'Лифт', 'Ліфт', 0.76, 0.15),
  ca('de_dust2', 'ninja', 'both', 'utility', 'Ninja', 'Ниндзя', 'Ніндзя', 0.73, 0.17),
  ca('de_dust2', 'barrels', 'both', 'a_site', 'Barrels', 'Бочки А', 'Бочки А', 0.77, 0.2),
  ca('de_dust2', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.8, 0.16, 0.075, ['сайт a']),
  ca('de_dust2', 'a_default', 'both', 'a_site', 'Default Plant', 'Дефолт А', 'Дефолт А', 0.78, 0.17, 0.04),
  ca('de_dust2', 'ct_mid', 'CT', 'mid', 'CT Mid', 'КТ-мид', 'КТ-мід', 0.58, 0.24),
  ca('de_dust2', 'fence', 'CT', 'rotation', 'Fence', 'Фенс', 'Фенс', 0.27, 0.38),
  ca('de_dust2', 'b_doors', 'both', 'b_site', 'B Doors', 'Би-дорс', 'Би-двері', 0.32, 0.16),
  ca('de_dust2', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.21, 0.12, 0.075, ['сайт b']),
  ca('de_dust2', 'back_plat', 'both', 'b_site', 'Back Plat', 'Бэк-плат', 'Бек-платформа', 0.17, 0.102, 0.04),
  ca('de_dust2', 'closet', 'CT', 'b_site', 'Closet', 'Клозет', 'Клоzet', 0.19, 0.138, 0.04, ['b closet']),
  ca('de_dust2', 'double_stack', 'both', 'b_site', 'Double Stack', 'Дабл стэк', 'Дабл стек', 0.235, 0.14, 0.04),
]

/** Inferno (~21) — de_inferno */
const inferno: MapPosition[] = [
  ca('de_inferno', 'mid', 'T', 'mid', 'Second Mid', 'Секонд мид', 'Секонд мід', 0.14, 0.48, 0.06, ['2nd mid', 'arch side']),
  ca('de_inferno', 'logs', 'T', 'mid', 'Logs', 'Брёвна', 'Колоди', 0.11, 0.53),
  ca('de_inferno', 'apartments', 'T', 'b_site', 'Apartments', 'Апартаменты', 'Апартаменти', 0.2, 0.58, 0.06, ['apps', 'апки']),
  ca('de_inferno', 'balcony', 'T', 'b_site', 'Balcony', 'Балкон', 'Балкон', 0.27, 0.6),
  ca('de_inferno', 'boiler', 'both', 'mid', 'Boiler', 'Бойлер', 'Бойлер', 0.54, 0.52),
  ca('de_inferno', 'pit', 'both', 'a_site', 'Pit', 'Пит', 'Піт', 0.6, 0.64),
  ca('de_inferno', 'moto', 'both', 'a_site', 'Moto', 'Мото', 'Мото', 0.69, 0.72),
  ca('de_inferno', 'graveyard', 'both', 'a_site', 'Graveyard', 'Грейвард', 'Грейвард', 0.79, 0.68),
  ca('de_inferno', 'library', 'CT', 'a_site', 'Library', 'Библиотека', 'Бібліотека', 0.84, 0.665),
  ca('de_inferno', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.81, 0.69, 0.075),
  ca('de_inferno', 'banana', 'both', 'mid', 'Banana', 'Банан', 'Банан', 0.38, 0.36, 0.07),
  ca('de_inferno', 'top_banana', 'T', 'mid', 'Top Banana', 'Топ банан', 'Топ банан', 0.32, 0.42),
  ca('de_inferno', 'car', 'both', 'mid', 'Car', 'Машина (банан)', 'Машина', 0.42, 0.28),
  ca('de_inferno', 'sandbags', 'both', 'b_site', 'Sandbags', 'Мешки', 'Мішки', 0.455, 0.24, 0.04, ['sand bags']),
  ca('de_inferno', 'dark', 'both', 'b_site', 'Coffins', 'Гробы / дарк', 'Труни', 0.47, 0.23, 0.045, ['coffins']),
  ca('de_inferno', 'porch', 'both', 'b_site', 'Porch', 'Крыльцо', 'Ганок', 0.5, 0.218),
  ca('de_inferno', 'fountain', 'CT', 'b_site', 'Fountain', 'Фонтан', 'Фонтан', 0.53, 0.178),
  ca('de_inferno', 'church', 'CT', 'b_site', 'Church', 'Церковь', 'Церква', 0.58, 0.2),
  ca('de_inferno', 'new_box', 'CT', 'b_site', 'New Box', 'Нью бокс', 'Нью бокс', 0.442, 0.2),
  ca('de_inferno', 'spools', 'CT', 'b_site', 'Spools', 'Шпули', 'Котушки', 0.446, 0.195, 0.03, ['spool']),
  ca('de_inferno', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.49, 0.22, 0.075),
]

/** Nuke — верхний + нижний ярусы (layer_id) */
const nuke: MapPosition[] = [
  ca('de_nuke', 'outside', 'T', 'mid', 'Outside', 'Аутсайд', 'Аутсаїд', 0.11, 0.55, 0.065, [], 'upper'),
  ca('de_nuke', 'lobby', 'T', 'rotation', 'Lobby', 'Лобби', 'Лобі', 0.22, 0.52, 0.05, ['t lobby'], 'upper'),
  ca('de_nuke', 'hut', 'both', 'mid', 'Hut', 'Хатка', 'Хатинка', 0.31, 0.48, 0.045, [], 'upper'),
  ca('de_nuke', 'mini', 'both', 'rotation', 'Mini', 'Мини', 'Міні', 0.24, 0.5, 0.04, ['squeaky'], 'upper'),
  ca('de_nuke', 'garage', 'CT', 'rotation', 'Garage', 'Гараж', 'Гараж', 0.86, 0.47, 0.06, [], 'upper'),
  ca('de_nuke', 'control', 'CT', 'rotation', 'Control', 'Контроль', 'Контроль', 0.75, 0.46, 0.05, ['control room'], 'upper'),
  ca('de_nuke', 'ramp', 'both', 'rotation', 'Ramp', 'Рампа', 'Рампа', 0.47, 0.52, 0.05, ['upper ramp'], 'upper'),
  ca('de_nuke', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.58, 0.48, 0.075, [], 'upper'),
  ca('de_nuke', 'hell', 'both', 'a_site', 'Hell', 'Хелл', 'Пекло', 0.53, 0.52, 0.045, [], 'upper'),
  ca('de_nuke', 'heaven', 'CT', 'a_site', 'Heaven', 'Хевен', 'Хевен', 0.62, 0.42, 0.05, [], 'upper'),
  ca('de_nuke', 'rafters', 'CT', 'a_site', 'Rafters', 'Рафтерс', 'Рафтерс', 0.61, 0.44, 0.04, [], 'upper'),
  ca('de_nuke', 'silo', 'T', 'mid', 'Silo', 'Сайло', 'Сайло', 0.16, 0.46, 0.05, [], 'upper'),
  ca('de_nuke', 'secret', 'both', 'rotation', 'Secret', 'Сикрет', 'Сікрет', 0.4, 0.6, 0.055, [], 'lower'),
  ca('de_nuke', 'vents', 'both', 'rotation', 'Vents', 'Венты', 'Вентиляція', 0.45, 0.58, 0.05, [], 'lower'),
  ca('de_nuke', 'decon', 'both', 'b_site', 'Decon', 'Декон', 'Декон', 0.52, 0.58, 0.05, [], 'lower'),
  ca('de_nuke', 'toxic', 'both', 'b_site', 'Toxic', 'Токсик', 'Токсик', 0.65, 0.62, 0.05, [], 'lower'),
  ca('de_nuke', 'main', 'both', 'mid', 'Main', 'Мейн', 'Мейн', 0.48, 0.54, 0.06, ['lower main'], 'lower'),
  ca('de_nuke', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.58, 0.58, 0.075, [], 'lower'),
]

/** Overpass (~18) */
const overpass: MapPosition[] = [
  ca('de_overpass', 'toilets', 'T', 'mid', 'Toilets', 'Туалеты', 'Туалети', 0.72, 0.88, 0.05),
  ca('de_overpass', 'playground', 'T', 'mid', 'Playground', 'Площадка', 'Майданчик', 0.58, 0.72, 0.06),
  ca('de_overpass', 'long', 'T', 'mid', 'Long', 'Лонг', 'Лонг', 0.75, 0.65, 0.055),
  ca('de_overpass', 'monster', 'both', 'mid', 'Monster', 'Монстр', 'Монстр', 0.48, 0.55, 0.06),
  ca('de_overpass', 'dumpster', 'both', 'mid', 'Dumpster', 'Мусорка', 'Смітник', 0.54, 0.48),
  ca('de_overpass', 'canals', 'both', 'mid', 'Canals', 'Каналы', 'Канали', 0.42, 0.42),
  ca('de_overpass', 'connector', 'both', 'rotation', 'Connector', 'Коннектор', 'Коннектор', 0.54, 0.36),
  ca('de_overpass', 'stairs', 'both', 'rotation', 'Stairs', 'Лестница', 'Сходи', 0.58, 0.4),
  ca('de_overpass', 'short', 'both', 'a_site', 'Short', 'Шорт', 'Шорт', 0.62, 0.31),
  ca('de_overpass', 'bridge', 'both', 'a_site', 'Bridge', 'Мост', 'Міст', 0.58, 0.277),
  ca('de_overpass', 'party', 'CT', 'a_site', 'Party', 'Пати', 'Паті', 0.653, 0.22),
  ca('de_overpass', 'bathrooms', 'CT', 'a_site', 'Bathrooms', 'Бассрумы', 'Ванни', 0.52, 0.177),
  ca('de_overpass', 'snipers_nest', 'CT', 'a_site', "Sniper's Nest", 'Гнездо', 'Гніздо', 0.48, 0.195, 0.045),
  ca('de_overpass', 'fountain', 'both', 'a_site', 'Fountain', 'Фонтан', 'Фонтан', 0.68, 0.278),
  ca('de_overpass', 'truck', 'CT', 'a_site', 'Truck', 'Трак', 'Трал', 0.62, 0.258),
  ca('de_overpass', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.55, 0.23, 0.075),
  ca('de_overpass', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.7, 0.31, 0.075),
]

/** Anubis (~17) */
const anubis: MapPosition[] = [
  ca('de_anubis', 'water', 'T', 'mid', 'Water', 'Вода', 'Вода', 0.12, 0.55),
  ca('de_anubis', 'tunnel', 'T', 'mid', 'Tunnel', 'Тоннель', 'Тунель', 0.18, 0.595),
  ca('de_anubis', 'main', 'T', 'rotation', 'Main', 'Мейн', 'Мейн', 0.33, 0.495),
  ca('de_anubis', 'canal', 'both', 'mid', 'Canal', 'Канал', 'Канал', 0.24, 0.518),
  ca('de_anubis', 'mid', 'both', 'mid', 'Mid', 'Мид', 'Мід', 0.445, 0.45),
  ca('de_anubis', 'connector', 'both', 'rotation', 'Connector', 'Коннектор', 'Коннектор', 0.55, 0.39),
  ca('de_anubis', 'window', 'both', 'rotation', 'Window', 'Окно', 'Вікно', 0.62, 0.418),
  ca('de_anubis', 'lane', 'T', 'mid', 'Lane', 'Лайн', 'Лінія', 0.22, 0.628),
  ca('de_anubis', 'camel', 'both', 'rotation', 'Camel', 'Верблюд', 'Верблюд', 0.32, 0.36),
  ca('de_anubis', 'snake', 'both', 'b_site', 'Snake', 'Снейк', 'Змійка', 0.378, 0.31),
  ca('de_anubis', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.33, 0.28, 0.075),
  ca('de_anubis', 'plat', 'CT', 'a_site', 'Plat', 'Платформа', 'Платформа', 0.724, 0.61),
  ca('de_anubis', 'house', 'both', 'a_site', 'House', 'Хауз', 'Будівля', 0.66, 0.582),
  ca('de_anubis', 'dark', 'both', 'a_site', 'Dark', 'Дарк', 'Дарк', 0.698, 0.552),
  ca('de_anubis', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.73, 0.62, 0.075),
  ca('de_anubis', 'heaven', 'CT', 'a_site', 'Heaven', 'Хевен', 'Хевен', 0.785, 0.575),
  ca('de_anubis', 'beast', 'CT', 'a_site', 'Beast', 'Бист', 'Біст', 0.762, 0.595),
]

/** Ancient (~17) */
const ancient: MapPosition[] = [
  ca('de_ancient', 'ramp', 'T', 'mid', 'Ramp', 'Рампа', 'Рампа', 0.15, 0.55),
  ca('de_ancient', 'yard', 'T', 'mid', 'Yard', 'Ярд', 'Подвір’я', 0.275, 0.56),
  ca('de_ancient', 'mid', 'both', 'mid', 'Mid', 'Мид', 'Мід', 0.45, 0.51, 0.065),
  ca('de_ancient', 'donut', 'both', 'mid', 'Donut', 'Донат', 'Донат', 0.486, 0.475, 0.045),
  ca('de_ancient', 'elbow', 'both', 'mid', 'Elbow', 'Эльбоу', 'Лікоть', 0.557, 0.475),
  ca('de_ancient', 'walkway', 'both', 'rotation', 'Walkway', 'Волквей', 'Підхід', 0.533, 0.53),
  ca('de_ancient', 'pillar', 'both', 'rotation', 'Pillar', 'Столб', 'Стовп', 0.54, 0.445),
  ca('de_ancient', 'snipers_nest', 'CT', 'mid', 'Sniper Nest', 'Снайперка', 'Снайперне', 0.695, 0.425, 0.05, ['nest', 'red']),
  ca('de_ancient', 'house', 'CT', 'rotation', 'House', 'Хаус', 'Будівля', 0.58, 0.418),
  ca('de_ancient', 'temple', 'both', 'a_site', 'Temple', 'Темпл', 'Храм', 0.64, 0.62),
  ca('de_ancient', 'ruins', 'both', 'a_site', 'Ruins', 'Руины', 'Руїни', 0.682, 0.63),
  ca('de_ancient', 'tomb', 'both', 'a_site', 'Tomb', 'Тумб', 'Гробниця', 0.668, 0.615),
  ca('de_ancient', 'jungle', 'both', 'a_site', 'Jungle', 'Джангл', 'Джангл', 0.42, 0.52),
  ca('de_ancient', 'hut', 'both', 'b_site', 'Hut', 'Хатка', 'Хата', 0.348, 0.345),
  ca('de_ancient', 'cave', 'both', 'b_site', 'Cave', 'Пещера', 'Печера', 0.315, 0.305),
  ca('de_ancient', 'cheetah', 'T', 'b_site', 'Cheetah', 'Чита', 'Гепард', 0.28, 0.34),
  ca('de_ancient', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.7, 0.65, 0.075),
  ca('de_ancient', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.3, 0.32, 0.075),
]

/** Cache (~22) — см. Total CS Cache callouts table */
const cache: MapPosition[] = [
  ca('de_cache', 'garage', 'T', 'mid', 'Garage', 'Гараж', 'Гараж', 0.32, 0.68, 0.06),
  ca('de_cache', 'dumpster', 'T', 'mid', 'Dumpster', 'Мусорка', 'Смітник', 0.34, 0.628),
  ca('de_cache', 'boost', 'T', 'mid', 'Boost', 'Буст', 'Буст', 0.52, 0.52, 0.04),
  ca('de_cache', 'sand_bags', 'both', 'mid', 'Sand Bags', 'Мешки', 'Мішки', 0.54, 0.52, 0.04),
  ca('de_cache', 'mid_roof', 'both', 'mid', 'Mid Roof', 'Крыша мид', 'Дах міду', 0.548, 0.505, 0.042),
  ca('de_cache', 'connector', 'both', 'rotation', 'Connector', 'Коннектор', 'Коннектор', 0.446, 0.445),
  ca('de_cache', 'mid', 'both', 'mid', 'Mid', 'Мид', 'Мід', 0.498, 0.555, 0.055),
  ca('de_cache', 'highway', 'both', 'rotation', 'Highway', 'Хайвей', 'Хайвеї', 0.47, 0.405),
  ca('de_cache', 'white_box', 'both', 'rotation', 'White Box', 'Белый бокс', 'Білий бокс', 0.455, 0.385),
  ca('de_cache', 'squeaky', 'both', 'a_site', 'Squeaky', 'Свик', 'Піщанка', 0.415, 0.315, 0.04),
  ca('de_cache', 'quad', 'both', 'a_site', 'Quad', 'Квад', 'Квад', 0.36, 0.245, 0.05),
  ca('de_cache', 'forklift', 'both', 'a_site', 'Forklift', 'Погрузчик', 'Навантажувач', 0.397, 0.255),
  ca('de_cache', 'balcony', 'both', 'a_site', 'Balcony', 'Балкон', 'Балкон', 0.382, 0.23),
  ca('de_cache', 'shroud', 'both', 'a_site', 'Shroud Boxes', 'Боксы Шруд', 'Шруд бокси', 0.402, 0.265, 0.035),
  ca('de_cache', 'nbk', 'both', 'a_site', 'NBK', 'НБК', 'НБК', 0.368, 0.252, 0.03),
  ca('de_cache', 'a_default', 'both', 'a_site', 'Default Plant', 'Дефолт А', 'Дефолт А', 0.387, 0.265),
  ca('de_cache', 'a_site', 'both', 'a_site', 'A Site', 'Сайт A', 'Сайт A', 0.39, 0.27, 0.075),
  ca('de_cache', 'vents', 'both', 'rotation', 'Vents', 'Венты', 'Венти', 0.565, 0.485),
  ca('de_cache', 'checkers', 'both', 'b_site', 'Checkers', 'Шахматы', 'Шахівниця', 0.642, 0.455),
  ca('de_cache', 'back_checkers', 'both', 'b_site', 'Back Checkers', 'Бэк шахматы', 'Бек шахи', 0.665, 0.442),
  ca('de_cache', 'b_halls', 'both', 'b_site', 'B Halls', 'Би-холлс', 'Бі-холи', 0.75, 0.495),
  ca('de_cache', 'b_main', 'both', 'b_site', 'B Main', 'Би-мейн', 'Бі-мейн', 0.762, 0.462),
  ca('de_cache', 'sun_room', 'both', 'b_site', 'Sun Room', 'Санрум', 'Санрум', 0.738, 0.505),
  ca('de_cache', 'toxic', 'both', 'b_site', 'Toxic', 'Токсик', 'Токсик', 0.72, 0.515),
  ca('de_cache', 'heaven', 'CT', 'b_site', 'Heaven', 'Хевен', 'Хевен', 0.785, 0.438),
  ca('de_cache', 'tree', 'CT', 'rotation', 'Tree', 'Дерево', 'Дерево', 0.795, 0.53),
  ca('de_cache', 'hell', 'CT', 'b_site', 'Hell', 'Хелл', 'Пекло', 0.82, 0.465),
  ca('de_cache', 'truck', 'both', 'mid', 'Truck', 'Трак', 'Трал', 0.7, 0.402),
  ca('de_cache', 'b_site', 'both', 'b_site', 'B Site', 'Сайт B', 'Сайт B', 0.78, 0.45, 0.075),
]

export const POSITIONS_EXTENDED_CALLOUTS: MapPosition[] = [
  ...dust2,
  ...inferno,
  ...nuke,
  ...overpass,
  ...anubis,
  ...ancient,
  ...cache,
]
