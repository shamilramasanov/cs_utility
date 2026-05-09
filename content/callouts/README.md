# `content/callouts/` — заметки по позициям и callouts

> Сюда складываем сырые данные по callout-ам: скрины с OnlyCSGO, текстовые списки, ручные заметки. Финал уезжает в `src/data/positions.ts`.

---

## 1. Workflow

1. Открой источник callouts для нужной карты (см. `content/SOURCES.md` §4).
2. Создай файл `_research/<map_id>.md` со списком всех callouts.
3. Заполни поля для каждого callout (см. шаблон ниже).
4. Когда черновик готов — переноси в `content/positions/<map_id>.json` (промежуточный JSON).
5. Когда несколько карт готовы — мердж в `src/data/positions.ts`.

---

## 2. Шаблон `_research/<map>.md`

```markdown
# Mirage callouts — сырьё

Источник: https://onlycsgo.com/callouts (Mirage = 30 callouts)
Дополнительно: https://liquipedia.net/counterstrike/Mirage

| ID | Label (EN) | RU | UK | Aliases | Side | Category | Hotspot | Layer |
|---|---|---|---|---|---|---|---|---|
| t_spawn | T Spawn | Т-спавн | Т-спавн | tspawn, спавн | T | spawn | TBD | — |
| ct_spawn | CT Spawn | КТ-спавн | КТ-спавн | ctspawn | CT | spawn | TBD | — |
| top_mid | Top Mid | Топ мид | Топ мід | mid, центр | both | mid | TBD | — |
| window | Window | Окно | Вікно | win, window-room | both | mid | TBD | — |
| connector | Connector | Коннектор | Коннектор | конн, коннект | CT | rotation | TBD | — |
| stairs | Stairs | Стейрс | Стейрс | лестница | T | a_site | TBD | — |
| jungle | Jungle | Джангл | Джангл | jung, кусты | CT | a_site | TBD | — |
| ticket_booth | Ticket Booth | Тикет, билеты | Квитки | ticket, билеты | both | a_site | TBD | — |
| firebox | Firebox | Файрбокс | Файербокс | fire | both | a_site | TBD | — |
| ramp | Ramp | Рампа | Рампа | rmp | T | a_site | TBD | — |
| palace | Palace | Палас | Палац | pal | T | a_site | TBD | — |
| a_site | A Site | A | A | a, сайт А | both | a_site | TBD | — |
| default_a | Default | Дефолт A | Дефолт A | def, default | both | a_site | TBD | — |
| apartments | Apartments | Апартаменты | Апартаменти | apps, апсы, апки | T | b_site | TBD | — |
| market | Market | Маркет | Ринок | market, маркет | T | b_site | TBD | — |
| kitchen | Kitchen | Кухня | Кухня | kit | both | b_site | TBD | — |
| van | Van | Ван (фургон) | Ван | van | both | b_site | TBD | — |
| bench | Bench | Бенч | Лава | bench | CT | b_site | TBD | — |
| short_b | Short | Шорт | Шорт | short, шорт | both | b_site | TBD | — |
| b_site | B Site | B | B | b, сайт Б | both | b_site | TBD | — |
| catwalk | Catwalk | Кэтвок | Кетвок | cat, котик | T | mid | TBD | — |
| under_palace | Under Palace | Под паласом | Під палацом | under | T | a_site | TBD | — |
| sandwich | Sandwich | Сэндвич | Сендвіч | sw | both | a_site | TBD | — |
| jungle_window | Jungle Window | Джанг-окно | Джунгль-вікно | jungle-win | CT | a_site | TBD | — |
```

> Hotspot оставляем `TBD` — заполним, когда будем класть точки на радар (через DevTools или будущую админскую кнопку).

---

## 3. Кол-во callouts по картам (по OnlyCSGO)

| Карта | Кол-во | Особенности |
| --- | --: | --- |
| Dust 2 | 30 | Самая «насыщенная» по жаргону |
| Mirage | 30 | Много RU-сленга |
| Inferno | 30 | Banana — основная связка |
| Nuke | 25 | ⚠ Указывать `layer_id: upper / lower` |
| Overpass | 25 | — |
| Anubis | 19 | — |
| Ancient | 19 | — |

---

## 4. Как разметить hotspots на радаре

### Способ A — DevTools (доступно прямо сейчас)

1. Открой страницу карты в браузере.
2. Открой DevTools → Console.
3. Включи логирование позиции: в `src/components/MapPageClient.tsx` (или похожем) уже подключён хук `useRadarImageBox`. Можно временно добавить `console.log(nx, ny)` в `onMouseMove`.
4. Наведись мышью на нужную точку → запиши координаты.
5. Перенеси в `content/positions/<map>.json`.

### Способ B — будущая админка (план UI §10)

В админке появится кнопка «Добавить callout мышью». Тогда координаты будут падать прямо в JSON.

### Точность

- `radius`: по умолчанию `0.05` (5% от ширины радара).
- Большие зоны (Top Mid, Apartments как зона) — `0.07`.
- Точечные (Default Plant, Sandwich) — `0.03`.

---

## 5. Особенности по картам

### Nuke

У всех hotspots добавляем `layer_id: 'upper' | 'lower'`. Например:

- `outside`, `silo`, `garage`, `heaven`, `site_a`, `rafters` — `upper`.
- `lobby`, `toxic`, `site_b`, `vent`, `big_box`, `decon` — `lower`.

UI плана выбора позиции переключает слой, скрывая нерелевантные точки.

### Anubis

Имена в комьюнити часто английские (`Mid`, `Connector`, `Heaven`, `Pit`) — RU-перевод иногда буквальный (`Мид`, `Коннектор`).

### Ancient

Уникальные термины: `Donut`, `Cave`, `Ruins`, `Temple`. Их в RU-сленге транслитерируют как `донат`, `кейв`, `руинс`, `темпл`.

---

## 6. Что не делать

- ❌ Не вводить новый callout «потому что у меня в команде так зовут» — берём только из канонических источников (OnlyCSGO / Liquipedia / Total CS). Свои варианты идут в `aliases[]`.
- ❌ Не оставлять hotspot без значения `radius` (это сломает радиус-проверку).
- ❌ Не писать RU-перевод обязательным — иногда `Apartments` так и остаётся `Apartments` (так все и зовут).

