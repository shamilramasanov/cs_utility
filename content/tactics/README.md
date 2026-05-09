# `content/tactics/` — текстовые тактики

> Тактики живут в markdown с YAML-фронтматтером. Один файл = одна тактика на одной карте за одну сторону.
>
> Эти файлы — источник правды. В `src/data/tactics.json` они попадают через конвертер `scripts/tactics-md-to-json.ts` (V2). Пока — читаем глазами и копируем нужное в JSON руками.

---

## 1. Шаблон (копируй в `<map>/<id>.md`)

```markdown
---
id: mirage_t_default_a
map: de_mirage
side: T
scenario: full        # full | pistol | eco | force | any

name:
  ru: T Default A
  en: T Default A
  uk: T Default A

description:
  ru: Стандартный заход на A через mid → window → stairs.
  en: Standard A execute via mid → window → stairs.
  uk: Стандартний захід на A через mid → window → stairs.

source:
  type: youtube         # youtube | steam_guide | liquipedia | self
  url: https://www.youtube.com/watch?v=xPCYPKFG44E
  author: NartOutHere

author: ALEX            # кто составлял у нас
created_at: 2026-05-05
---

## entry

brief:
  ru: Первым залетает на сайт через stairs после смока.
  en: First to enter A site via stairs after smokes are up.

steps:
  - kind: spawn
    text:
      ru: "Покупка: AK-47, kevlar+helmet, флешка, дым."
      en: "Buy: AK-47, kevlar+helmet, flash, smoke."
  - kind: move
    time: 5
    position_id: t_spawn
    text:
      ru: Бежим в Top Mid через спавн.
      en: Run to Top Mid via spawn.
  - kind: throw
    time: 25
    grenade_id: TODO       # ← заполнить, когда раскидка появится в админке
    position_id: top_mid
    text:
      ru: Смок Window — закрыть AWP-холд.
      en: Smoke Window — block the AWP hold.
  - kind: exec
    time: 35
    position_id: stairs
    text:
      ru: По смоку залетаем через Stairs на Site.
      en: Enter A Site via Stairs once smokes are up.
  - kind: peek
    time: 45
    position_id: a_site
    text:
      ru: Холд новых углов: Jungle, Ticket Booth.
      en: Hold new angles: Jungle, Ticket Booth.

---

## awp

brief:
  ru: …

steps:
  - …

---

## lurker
…

---

## support
…

---

## igl
…
```

---

## 2. Поля шага

| Поле | Тип | Обязательно? | Назначение |
| --- | --- | :--: | --- |
| `kind` | enum | ✅ | `spawn` / `move` / `hold` / `throw` / `peek` / `exec` / `rotate` / `note` |
| `time` | секунды от старта раунда (0..115) | — | Если задано — UI подсветит шаг по таймеру |
| `text.ru` / `text.en` / `text.uk` | string | ✅ хотя бы `ru` | Краткий императив, 5–10 слов |
| `position_id` | slug из `src/data/positions.ts` | — | Для пилюли callout-а |
| `grenade_id` | UUID из `custom-lineups.json` | для `kind: throw` | Тап → открывает видео |
| `path[]` | `[ {x, y}, … ]` | — | Маршрут на радаре (V2) |

> Если на момент написания тактики раскидки ещё нет в библиотеке — ставь `grenade_id: TODO`, заполнишь потом.

---

## 3. Канонические роли

| Роль | T-side | CT-side | Что делает |
| --- | :--: | :--: | --- |
| `igl` | ✅ | ✅ | Капитан, командует, может играть любую позицию |
| `entry` | ✅ | — | Первым залетает на сайт |
| `awp` | ✅ | ✅ | Снайпер |
| `lurker` | ✅ | — | Одиночка, играет за спиной у CT |
| `support` | ✅ | ✅ | Бросает ютилку, прикрывает |
| `anchor_a` | — | ✅ | Держит A |
| `anchor_b` | — | ✅ | Держит B |

> Не каждая тактика покрывает всех 5. Нормально иметь 4 роли расписанных и 1 «общую».

---

## 4. Стартовый список тактик

| ID файла | Карта | Сторона | Сценарий | Источник | Статус |
| --- | --- | --- | --- | --- | :--: |
| `mirage/t_default_a.md` | Mirage | T | full | Steam Guide 3134150813 + NartOutHere | [ ] |
| `mirage/t_b_apps_rush.md` | Mirage | T | force | Liquipedia | [ ] |
| `mirage/ct_default.md` | Mirage | CT | full | cs2.eu | [ ] |
| `mirage/ct_a_stack.md` | Mirage | CT | full | Steam Guide | [ ] |
| `dust2/t_long_default.md` | Dust 2 | T | full | Steam Guide | [ ] |
| `dust2/t_b_split.md` | Dust 2 | T | full | Liquipedia | [ ] |
| `dust2/ct_pistol_default.md` | Dust 2 | CT | pistol | Dignitas blog | [ ] |
| `inferno/t_b_default.md` | Inferno | T | full | Steam Guide 3134169812 | [ ] |
| `inferno/t_a_apps_arch.md` | Inferno | T | full | NartOutHere fWDE1KH9odg | [ ] |
| `inferno/ct_default.md` | Inferno | CT | full | Steam Guide | [ ] |

> Готовый пример (заполненный) — `mirage/t_default_a.md`.

---

## 5. Стиль написания шагов

### Хорошо

- «Бежим в Top Mid через спавн.» — императив, 5 слов
- «Смок Window — закрыть AWP-холд.» — действие + цель
- «Холд апсика, ловим CT-ротацию через шорт.» — позиция + цель

### Плохо

- «Игрок должен выдвинуться из спавна и направиться в сторону Top Mid…» — слишком много слов
- «Кидай дым.» — куда? зачем?
- «Делай свою работу.» — нулевая полезность

### Правило «5 секунд»

Игрок читает шаг во время разминки или закупа. Если не понятно за 5 секунд — переформулировать.

---

## 6. Что не делать

- ❌ Не описывать тактику с привязкой к конкретному составу (это делает её непереносимой).
- ❌ Не путать «тактику» (последовательность во времени) и «раскидку» (точечное знание). Тактика **ссылается** на раскидку.
- ❌ Не использовать жаргон без перевода (для UK-аудитории «апсик» нужно расшифровать в первый раз).
- ❌ Не оставлять `position_id` пустым у шагов `move`/`hold`/`exec`/`peek` — это убьёт фильтрацию.

