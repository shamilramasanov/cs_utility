# Mirage — план раскидок (T + CT)

> Упорядочено по приоритету. После записи раскидки ставим `[x]` в столбце «Готово».
>
> Источник по умолчанию: NartOutHere `xPCYPKFG44E` (Mirage 18:54). Альтернативный — GRAPE CS2 `tk-9WAcn0FA` (52 nades).

---

## T-side · цель: 18 раскидок

| # | Тип | Название | Старт (position_id) | Приём (position_id) | Источник | tactic_uses | Готово |
|--:|---|---|---|---|---|---|:--:|
| 1 | smoke | Stairs | top_mid | stairs | Nart 04:12 | mirage_t_default_a (entry, support) | [ ] |
| 2 | smoke | CT | top_mid | ct_spawn | Nart 05:30 | mirage_t_default_a (entry) | [ ] |
| 3 | smoke | Jungle | top_mid | jungle | Nart 06:50 | mirage_t_default_a (support) | [ ] |
| 4 | smoke | Window | t_spawn | window | Nart 02:40 | mirage_t_default_a (support) | [ ] |
| 5 | smoke | Connector | t_spawn | connector | Nart 08:15 | mirage_t_b_apps_rush | [ ] |
| 6 | smoke | Market door | apartments | market | Grape 04:20 | mirage_t_b_apps_rush | [ ] |
| 7 | smoke | Site (B short) | apartments | b_site | Grape 05:30 | mirage_t_b_apps_rush | [ ] |
| 8 | smoke | Triple stack | apartments | a_site | Grape 06:00 | — | [ ] |
| 9 | flash | Pop-flash через top mid | top_mid | window | Grape 03:10 | mirage_t_default_a (entry) | [ ] |
| 10 | flash | A exec flash через stairs | t_spawn | a_site | Nart 07:20 | mirage_t_default_a (support) | [ ] |
| 11 | flash | B exec flash через apps | apartments | b_site | Nart 09:30 | mirage_t_b_apps_rush | [ ] |
| 12 | flash | Mid pop-flash | t_spawn | top_mid | Grape 02:50 | — | [ ] |
| 13 | molotov | Под пальмой (default A) | t_spawn | default_a | Nart 11:00 | mirage_t_default_a (igl) | [ ] |
| 14 | molotov | Connector (B exec) | apartments | connector | Nart 12:15 | mirage_t_b_apps_rush | [ ] |
| 15 | molotov | Underpass (anti-rotation) | t_spawn | underpass | Grape 09:30 | — | [ ] |
| 16 | he | Triple от ramp | t_spawn | ramp | Nart 14:00 | — | [ ] |
| 17 | he | Window peek | t_spawn | window | Grape 10:20 | — | [ ] |
| 18 | he | B Site default | apartments | b_site | Nart 15:10 | — | [ ] |

## CT-side · цель: 8 раскидок

| # | Тип | Название | Старт | Приём | Источник | tactic_uses | Готово |
|--:|---|---|---|---|---|---|:--:|
| 19 | smoke | Window (CT defense) | ct_spawn | window | Nart 16:00 | mirage_ct_default | [ ] |
| 20 | smoke | Connector retake | ct_spawn | connector | Nart 16:40 | mirage_ct_default | [ ] |
| 21 | smoke | Stairs защита | jungle | stairs | Nart 17:10 | mirage_ct_default | [ ] |
| 22 | flash | Pop-flash на mid (от sandwich) | sandwich | top_mid | — | mirage_ct_a_stack | [ ] |
| 23 | flash | Push apps от market | market | apartments | — | mirage_ct_default | [ ] |
| 24 | molotov | Apartments retake | b_site | apartments | Nart 17:50 | mirage_ct_default | [ ] |
| 25 | molotov | A Site retake (под палас) | jungle | palace | — | mirage_ct_a_stack | [ ] |
| 26 | molotov | Connector clear | ct_spawn | connector | — | mirage_ct_default | [ ] |

> Кол-во меньше, чем у T (18+8=26 вместо 36) — потому что на CT-стороне раскидки в основном для retake, и команда часто делает их через ту же ютилку: 1 смок ставится из нескольких стартов.

---

## Памятка

- `tactic_uses` — какая тактика будет тыкать на эту раскидку через `grenade_id`. Это помогает понимать, что точно нужно к MVP.
- `Источник` формата `<автор> <минута:секунда>` — куда вернуться, если что-то непонятно.
- Когда раскидка готова — ставим `[x]` и записываем `grenade_id` (UUID из `custom-lineups.json`) в Notion / комментарий.

