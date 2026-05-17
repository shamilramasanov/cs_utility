# Админка тактик, кастомные сценарии и AI-ассистент

> Документ-продукт: **как** строим редактор тактик для разработчика и игроков, и **куда** развиваем AI (черновики → **Voice Intel Tracker** в раунде).
>
> **Killer feature проекта:** [Voice Intel Tracker](#9-voice-intel-tracker) — команда говорит, карта обновляется у всех.
>
> Связанные файлы:
> - `TACTICS_MAP_GRID.md` — SVG, сетка, координаты, загрузка карт
> - `PLAN_TEAM_TACTICS.md` — флоу `/team`, meet, роли
> - `UI_UX_TACTICS_VISION.md` — UX просмотра в матче
> - `src/data/tactics.json` — пресеты `source: 'preset'`
> - `src/app/admin/*` — текущая админка (lineups, каталог позиций)

---

## 1. Зачем отдельная админка тактик

| Сейчас | Цель |
|--------|------|
| Тактики в `tactics.json`, правки только в коде | **Дефолтные** тактики из админки без деплоя |
| Нет UI создания тактики | **Кастомные** тактики капитанов и комьюнити |
| Карта + path вручную в JSON | Визуальный редактор на SVG-сетке |
| AI нет | Позже: черновик, подсказки, «слушает команду» |

**Принцип:** один редактор, два класса публикации — различаются правами и видимостью, не разным UI.

---

## 2. Два типа тактик

```ts
type TacticSource = 'preset' | 'custom'

interface TacticMeta {
  id: string
  source: TacticSource
  /** preset: всем; custom: автор + его meet / публичная ссылка */
  visibility: 'public' | 'team' | 'private' | 'draft'
  author_id?: string
  author_display?: string
  map_id: string
  side: 't' | 'ct'
  scenario: 'pistol' | 'eco' | 'force' | 'full' | 'any'
  name: string
  description: string
  created_at: string
  updated_at: string
  published_at?: string
  /** Версия для отката и AI-диффов */
  version: number
}
```

### 2.1. Дефолтные (разработчик)

- Создаёт **только** роль `admin` (секрет `ADMIN_SECRET` / будущий список редакторов).
- Попадают в общую библиотеку: briefing в `/team`, фильтр «Официальные».
- Проходят **ревью** (чеклист качества) перед `visibility: public`.
- Можно **клонировать** в custom как шаблон для игроков.

### 2.2. Кастомные (пользователь)

- Создаёт **капитан** в meet или в личном кабинете `/team/my-tactics` (будущий раздел).
- По умолчанию `visibility: team` — видна только встречам с кодом или ссылкой.
- Опция «Опубликовать в сообщество» → модерация → `public` (фаза 2).
- Лимиты на бесплатном тарифе (опционально): N черновиков, без AI-live.

### 2.3. Единая модель контента

Тело тактики = существующий `Tactic` (`role_plans`, `steps`, `path`, `tactic_overview`) — см. `src/types/tactics.ts`.  
Меняется только **обёртка** (`TacticMeta`) и **хранение** (D1, не только JSON в git).

---

## 3. Роли и доступ

| Роль | Действия |
|------|----------|
| **Admin (dev)** | CRUD preset, модерация public custom, карты SVG, `map_profiles`, changelog |
| **Captain** | CRUD custom для своей команды, AI-черновик (лимит), публикация в meet |
| **Player** | Просмотр, предложить правку текстом, **голосовой репорт** на live-сессии (фаза AI-live) |
| **Guest** | Только просмотр по ссылке meet |

Авторизация админки: как сейчас `ADMIN_SECRET` + cookie/session.  
Для пользователей: привязка к `meet` member id + optional аккаунт (фаза 2).

---

## 4. Информационная архитектура админки

```text
/admin
├── /admin/tactics                    ← список всех preset (+ фильтр custom на модерации)
├── /admin/tactics/new
├── /admin/tactics/[id]               ← редактор (полный)
├── /admin/tactics/[id]/preview       ← как видит игрок в /team
├── /admin/maps                       ← SVG upload, map_profiles (см. TACTICS_MAP_GRID)
├── /admin/maps/[mapId]/grid          ← crop, spawns, sites, сетка
└── /admin/tactics/import             ← импорт JSON / клон с другой карты

/team (капитан, не /admin)
├── /team/tactics                     ← мои custom
├── /team/tactics/new                 ← упрощённый редактор или тот же компонент
└── /team/tactics/[id]/edit
```

**Один компонент редактора** `TacticEditor` — проп `mode: 'admin' | 'captain'` скрывает лишнее (модерация, preset-only поля).

---

## 5. Редактор тактик — экраны и UX

### 5.1. Макет (desktop-first в админке, адаптив на планшет)

```text
┌──────────────────────────────────────────────────────────────┐
│ [←] Mirage · T · Full · «Default A»     [Черновик] [Опубл.] │
├────────────────────┬─────────────────────────────────────────┤
│ ШАГИ / РОЛИ        │  КАРТА (SVG + сетка + zoom)             │
│                    │  ┌─────────────────────────────────┐   │
│ [igl] [entry] …    │  │  радар, path, маркеры, exec ★    │   │
│                    │  └─────────────────────────────────┘   │
│ ▼ Entry            │  [Слой: все | моя роль] [Сетка] [Снэп] │
│  1. move  …        ├─────────────────────────────────────────┤
│  2. throw 💨       │  СВОЙСТВА ШАГА                          │
│  + шаг             │  kind, text, time, grenade_id, path…    │
├────────────────────┴─────────────────────────────────────────┤
│ Описание раунда · Exec target · Сценарий · Теги              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2. Обязательные функции редактора

| Функция | Описание |
|---------|----------|
| **Выбор карты / стороны / сценария** | До рисования; смена карты → предупреждение «сбросить path?» |
| **Роли** | Табы или список; у каждой роли свой `brief` + список шагов |
| **Timeline шагов** | Drag reorder, duplicate, delete |
| **Рисование path** | ЛКМ по карте; снэп к сетке 16×16; undo/redo |
| **Маркер гранаты** | На шаге `throw`: точка + привязка `grenade_id` из каталога карты |
| **Exec target** | Одна звезда «цель раунда» (`tactic_overview`) |
| **Привязка к позиции** | Опционально `position_id` из каталога (клик по hotspot) |
| **Превью** | Split: как `RolePlanView` + `TacticMapView` |
| **Валидация** | Пустые шаги, path из 1 точки, throw без grenade — warnings |
| **Версии** | «Сохранить» → `version++`; история (admin) |
| **Клон** | С другой тактики / другая карта (масштаб path — вручную) |

### 5.3. Чеклист публикации preset (dev)

- [ ] Есть `tactic_overview.exec_target`
- [ ] У каждой роли ≥ 1 шаг с понятным `text`
- [ ] Entry/support имеют `throw` с `grenade_id` где нужно
- [ ] Path не вылезает за crop карты
- [ ] Превью на T и CT (если зеркальная тактика — отдельная копия)
- [ ] Запись в changelog

### 5.4. Публикация custom (капитан)

- **Черновик** — только автор видит в `/team/tactics`
- **Для встречи** — появляется в briefing этой meet
- **В сообщество** (позже) — очередь модерации в `/admin/tactics?tab=moderation`

---

## 6. Хранение (D1)

```ts
// editor_content keys (расширение)
'custom_tactics'     → Record<string, Tactic>           // legacy shape, миграция
'tactics_catalog'    → { presets: TacticMeta[], index by map/side }

// или нормализованно (фаза 2):
// table tactics (id, meta json, body json, version)
```

**Рекомендация MVP:** один ключ `tactics_store`:

```ts
interface TacticsStore {
  presets: Array<Tactic & TacticMeta>
  customs: Array<Tactic & TacticMeta>
}
```

Seed: импорт из `tactics.json` один раз (`npm run db:seed-tactics`).

**Медиа:** видео раскидок — как сейчас (`grenade_id` → lineups). SVG карт — `map_profiles` (см. `TACTICS_MAP_GRID.md`).

---

## 7. API (админка + пользователь)

| Method | Path | Кто | Описание |
|--------|------|-----|----------|
| GET | `/api/tactics?map=&side=&source=` | все | Список для briefing |
| GET | `/api/tactics/[id]` | все | Одна тактика |
| POST | `/api/admin/tactics` | admin | Создать preset |
| PATCH | `/api/admin/tactics/[id]` | admin | Обновить preset |
| DELETE | `/api/admin/tactics/[id]` | admin | Архив |
| POST | `/api/tactics/custom` | captain | Создать custom |
| PATCH | `/api/tactics/custom/[id]` | author | Обновить свой |
| POST | `/api/tactics/[id]/clone` | admin/captain | Клон |
| POST | `/api/tactics/ai-draft` | admin/captain | AI черновик (фаза AI-1) |

Все admin routes — заголовок `Authorization: Bearer ADMIN_SECRET` как у lineups.

---

## 8. AI — дорожная карта

### Фаза AI-0 (сейчас)

- Только ручной ввод в редакторе (после его реализации).
- Документы и схема JSON для будущих промптов.

### Фаза AI-1 — «Помощник автору» (ближайшее)

**Кто:** admin и captain в редакторе.  
**Вход:** текстовое поле «Опиши раунд» + контекст (`map_id`, `side`, `scenario`, `MapGridProfile`).

**Выход:** JSON `Tactic` (черновик) → вставка в редактор → человек правит path и grenade_id.

**Промпт получает:**

- сетка 16×16, spawns, sites, zone_labels;
- список ролей в meet;
- примеры 1–2 preset тактик на эту карту (few-shot).

**UI:**

- Кнопка «Сгенерировать черновик» → спиннер → diff preview (опционально) → «Применить».
- Кнопка «Дописать тексты шагов» для уже нарисованного path.

**Ограничения:**

- Модель **не видит** SVG (только текстовая карта зон). Path уточняет человек на карте.
- Лимит запросов / день для captain.

### Фаза AI-2 — «Умный редактор»

- Подсказка следующего шага: «Entry обычно смокит окно» на основе preset-библиотеки.
- Проверка дыр: «Нет смока на CT угол» — эвристики + LLM.
- Авто-привязка `grenade_id` по ближайшему маркеру раскидки на карте.

### Фаза AI-3 — Voice Intel Tracker

Полное описание — [§9 Voice Intel Tracker](#9-voice-intel-tracker). Не замена IGL, а «второй монитор» для mix/scrim.

---

## 9. Voice Intel Tracker

> **Простыми словами:** вы играете и говорите как в Discord — *«один яма»*, *«двое Б»*, *«сейв ушёл»*. Приложение превращает это в точки на SVG-карте у **всех** в meet и подсказывает, куда имеет смысл зайти.

### Суть в одном предложении

Команда говорит в микрофон во время раунда → AI понимает CS2-коллауты → на радаре у каждого игрока обновляется «картина врагов» → в конце AI предлагает 2–3 варианта выхода.

### Как это выглядит

1. В `/team/[code]` вкладка **«Ситуация»** рядом с планом и картой.
2. Игроки общаются как обычно (Discord + телефон у капитана/аналитика).
3. На **SVG-радаре** появляется:
   - 🔴 **яркая точка** — враг, позиция подтверждена;
   - 🔴 **полупрозрачная + «?»** — «слышал / кажется»;
   - 💨 **иконка гранаты** — враг кинул смок/флеш (позже — привязка к базе раскидок);
   - **счётчик живых** — уменьшается на «сейв», «впал», «один остался».
4. Старое (**>20 с**) бледнеет и исчезает.
5. Внизу — **2–3 совета** по exec из библиотеки тактик или короткий ad-hoc текст.

### Без голоса тоже работает

Плашки одним тапом: `1` `2` `3` `4` `5` · `A` `B` `Mid` · `AWP` `Save` `Rotate` — тот же пайплайн, что и голос.

### Как это устроено (стек cs-utility)

```text
Голос / тап
    → текст (Web Speech API бесплатно, позже Whisper для сленга)
    → Worker + LLM (Claude / GPT) + словарь позиций из map_profiles
    → IntelReport / EnemyEstimate
    → синхрон всем в meet (DO или SSE)
    → перерисовка SVG-слоя угроз
```

**Задержка:** ~2–3 с от фразы до точки.

**Realtime:**

| Вариант | Плюсы | Минусы |
|---------|--------|--------|
| **Durable Objects** + WebSocket | Мгновенно всем в комнате | Платный план CF (~$5/мес) |
| **Workers + SSE / polling** | Бесплатно, проще MVP | Задержка ~1–2 с |

Данные раунда — **D1** (опционально) или память DO на время scrim. Весь стек на **Cloudflare**, не Supabase.

**Связь с раскидками:** *«кинули смок на B»* → AI может подсветить **вашу** раскидку-контр из базы.

### Модель данных (упрощённо)

```ts
interface IntelReport {
  at: number
  player_id: string
  role?: TeamRole
  source: 'voice' | 'manual'
  raw_text?: string
  entities: Array<{
    type: 'enemy_position' | 'grenade_thrown' | 'enemy_count' | 'save' | 'rotate'
    position_id?: string
    count?: number
    grenade_type?: 'smoke' | 'flash' | 'molotov' | 'he'
    confidence: 'confirmed' | 'heard' | 'estimated'
  }>
}

interface EnemyEstimate {
  position_id: string
  grid_cell: { col: number; row: number }
  count: number
  confidence: 'confirmed' | 'heard' | 'estimated'
  reported_at: number
  reported_by: string
}

interface LiveCoachSuggestion {
  summary: string
  enemy_estimates: EnemyEstimate[]
  recommendations: Array<{
    title: string
    tactic_id?: string
    highlight_roles?: TeamRole[]
  }>
  risks: string[]
}
```

### Фазы Vit

| Фаза | Что делаем | Сложность |
|------|------------|-----------|
| **Vit-MVP** | Плашки + LLM → точки + простой совет | Низкая |
| **Vit-Voice** | Web Speech API | Средняя |
| **Vit-Whisper** | Лучше сленг | Средняя |
| **Vit-Suggest** | Exec из библиотеки тактик | Средняя |
| **Vit-Nades** | Вражеские гранаты ↔ ваши lineups | Высокая |

**AI-3** = Vit-MVP … Vit-Suggest, **AI-4** = Vit-Whisper и polish.

### Зависимости

- Meet `/team/[code]`, роли, код комнаты.
- SVG-радар + `map_profiles` ([TACTICS_MAP_GRID.md](./TACTICS_MAP_GRID.md)).
- Realtime: DO или SSE.
- LLM на Worker (секрет в Cloudflare).

Vit-MVP можно начать **сразу после** базового meet, без голоса.

### Правила продукта

- «AI строит **гипотезу**, не факт».
- Капитан подтверждает смену тактики.
- Репорты не публикуются без согласия команды.

### Метрика успеха

«Ситуация» ≥1 раз за scrim + команда сказала, что помогло принять решение.

---

## 10. Связь админки с картой (SVG + сетка)

| Шаг в админке карт | Шаг в админке тактик |
|--------------------|----------------------|
| Upload `de_mirage.svg` | Выбор `map_id` в редакторе |
| Задать spawns / sites | AI и path используют те же точки |
| Включить сетку 16×16 | Снэп path, AI cells |
| Опубликовать `map_profiles` | Preset тактики на этой карте |

Без опубликованного `map_profiles` редактор тактик **не даёт** рисовать — явная ошибка «Сначала настройте карту».

---

## 11. Фазы внедрения (сводка)

| Фаза | Содержание |
|------|------------|
| **T1** | `TacticEditor` + D1 `tactics_store` + `/admin/tactics` CRUD preset |
| **T2** | Импорт `tactics.json` → seed; preview; changelog |
| **T3** | Captain custom + выбор в briefing |
| **T4** | SVG upload + `map_profiles` (см. TACTICS_MAP_GRID) |
| **AI-1** | `/api/tactics/ai-draft` в редакторе |
| **AI-2** | Подсказки, валидация, grenade match |
| **Vit / AI-3** | Voice Intel Tracker MVP: плашки + карта угроз + совет |
| **Vit+ / AI-4** | Голос (STT), DO/WebSocket, привязка гранат |

---

## 12. Метрики успеха

- Время создания preset тактики (dev) < 30 мин с редактором.
- ≥ 80% капитанов создают custom без поддержки.
- AI-1: ≥ 50% черновиков принимают с правками < 5 мин.
- **Voice Intel:** ≥1 использование «Ситуации» за scrim + положительный фидбек.

---

## 13. Открытые вопросы

1. Модерация community custom — нужна ли на старте?
2. Один глобальный `TacticEditor` или упрощённый wizard для капитана?
3. Voice: только браузерный микрофон или Discord-бот (фаза 2)?
4. Durable Objects vs SSE для MVP?
5. Хранить IntelReport в D1 для разбора после матча?
6. Платные лимиты AI / Vit для captain?

---

## 14. Резюме

- **Админка тактик** — один редактор: SVG + сетка + роли + preset/custom.
- **Voice Intel Tracker** — killer feature: голос и кнопки → общая карта врагов → совет по exec.
- Стек: **Workers + D1**; realtime — DO или SSE; LLM на Worker.

Следующий шаг разработки: **T1** (редактор тактик), параллельно закладывать meet под Vit-MVP.

---

## 15. Инструкция для AI-агента

При любых задачах по `/team`, тактикам, картам или AI учитывай:

1. **Voice Intel Tracker** — целевая «фишка» продукта; архитектура не должна ей мешать.
2. **Cloudflare-only:** D1, Workers, Pages; синхрон через **Durable Objects** (лучше) или **SSE/polling** (MVP).
3. **SVG + `map_profiles`** — координаты угроз в Layer B / `position_id` из каталога.
4. Модели: `Meet`, `MeetMember`, `Tactic`, `IntelReport`, `EnemyEstimate` — см. §9.
5. LLM вызывать **с Worker**, секреты в Cloudflare, не с клиента.
6. Связанные документы: `TACTICS_MAP_GRID.md`, `PLAN_TEAM_TACTICS.md`, `UI_UX_TACTICS_VISION.md`.

**Приоритет после базового meet:** Vit-MVP (ручные репорты) раньше, чем голос — быстрее проверить ценность.
