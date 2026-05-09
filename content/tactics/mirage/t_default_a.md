---
id: mirage_t_default_a
map: de_mirage
side: T
scenario: full

name:
  ru: T Default A
  en: T Default A
  uk: T Default A

description:
  ru: |
    Стандартный заход T-стороны на A через mid → window → stairs.
    Лурк через апки страхует ротацию. AWP-холд из top mid снимается смоком на window.
  en: |
    Standard T-side A execute via mid → window → stairs.
    Lurker covers rotations through Apartments. The mid AWP hold is denied with a Window smoke.
  uk: |
    Стандартний захід Т-сторони на A через mid → window → stairs.
    Лурк через апки страхує ротацію. AWP-холд з top mid знімається димом на window.

source:
  type: steam_guide
  url: https://steamcommunity.com/sharedfiles/filedetails/?l=english&id=3134150813
  author: CS2 Mirage Strategies (Steam Community)

extra_sources:
  - https://www.youtube.com/watch?v=xPCYPKFG44E
  - https://cs2.eu/guides/maps/mirage

author: TODO
created_at: 2026-05-05
---

## entry

brief:
  ru: Первым залетает на A через stairs после смока на window и flash-поддержки support'а.
  en: First to enter A via stairs after the Window smoke and support's flash.

steps:
  - kind: spawn
    text:
      ru: "Закуп: AK-47, kevlar+helmet, флешка, смок."
      en: "Buy: AK-47, kevlar+helmet, flash, smoke."
  - kind: move
    time: 5
    position_id: t_spawn
    text:
      ru: Бежим в Top Mid через спавн.
      en: Run to Top Mid via spawn.
  - kind: hold
    time: 15
    position_id: top_mid
    text:
      ru: Хольд за ящиком, ждём дымы support'а.
      en: Hold behind the boxes, wait for support's smokes.
  - kind: throw
    time: 25
    grenade_id: TODO
    position_id: top_mid
    text:
      ru: Свой смок на CT — закрыть ротацию из spawn.
      en: Throw a CT smoke to deny rotations.
  - kind: exec
    time: 35
    position_id: stairs
    text:
      ru: По всем дымам залетаем через Stairs на Site.
      en: Once all smokes are up, enter A Site via Stairs.
  - kind: peek
    time: 45
    position_id: a_site
    text:
      ru: Холд Jungle и Ticket Booth, ждём support'а на трейд.
      en: Hold Jungle and Ticket Booth, wait for support to trade.


## awp

brief:
  ru: AWP-пик из top mid, после первого фрага — отход в коннектор, потом ротация на A.
  en: AWP peeks from Top Mid, retreats to Connector after first kill, then rotates to A.

steps:
  - kind: spawn
    text:
      ru: "Закуп: AWP, deagle/usp, kevlar+helmet, флешка."
      en: "Buy: AWP, deagle/usp, kevlar+helmet, flash."
  - kind: move
    time: 5
    text:
      ru: Бежим в Top Mid за entry.
      en: Run to Top Mid behind the entry.
  - kind: peek
    time: 12
    position_id: top_mid
    text:
      ru: Быстрый пик через ящик до того, как закроют window.
      en: Quick peek over the box before the Window smoke goes up.
  - kind: rotate
    time: 30
    position_id: connector
    text:
      ru: После пика — отход в Connector, страховка sup'а.
      en: After the peek, fall back to Connector to support.
  - kind: exec
    time: 40
    position_id: a_site
    text:
      ru: Заход на сайт после entry. Холд Default или CT через смоки.
      en: Enter A after entry. Hold Default or CT through smokes.


## lurker

brief:
  ru: Лурк через B Apps, ловит ротацию CT через mid.
  en: Lurks through B Apartments, catches CT rotation through mid.

steps:
  - kind: spawn
    text:
      ru: "Закуп: AK-47, kevlar+helmet, smoke."
      en: "Buy: AK-47, kevlar+helmet, smoke."
  - kind: move
    time: 5
    position_id: apartments
    text:
      ru: Бежим в Apartments через spawn.
      en: Run to Apartments via spawn.
  - kind: hold
    time: 25
    position_id: apartments
    text:
      ru: Хольд тихо в апсике, не выдаём шум.
      en: Hold quietly in Apartments, do not give away noise.
  - kind: peek
    time: 40
    position_id: market
    text:
      ru: Тихий пик через Market после exec'а команды на A.
      en: Silent peek through Market after the team's A execute.
  - kind: rotate
    time: 70
    position_id: connector
    text:
      ru: Если CT пошли на ретейк — режем через Connector в спину.
      en: If CTs go for retake, cut through Connector behind them.


## support

brief:
  ru: Кладёт смоки на window и stairs, флешит entry.
  en: Drops Window and Stairs smokes, flashes the entry in.

steps:
  - kind: spawn
    text:
      ru: "Закуп: AK-47, kevlar+helmet, 2 смока, флешка."
      en: "Buy: AK-47, kevlar+helmet, 2 smokes, flash."
  - kind: move
    time: 5
    text:
      ru: Бежим в Top Mid за awp.
      en: Run to Top Mid behind AWP.
  - kind: throw
    time: 18
    grenade_id: TODO
    position_id: top_mid
    text:
      ru: Смок на Window — отрезать AWP CT.
      en: Smoke Window — cut off the CT AWP.
  - kind: throw
    time: 24
    grenade_id: TODO
    position_id: top_mid
    text:
      ru: Смок на Stairs — закрыть Jungle.
      en: Smoke Stairs — block Jungle.
  - kind: throw
    time: 35
    grenade_id: TODO
    position_id: stairs
    text:
      ru: Pop-flash через ящик для entry.
      en: Pop-flash over the box for entry.
  - kind: exec
    time: 38
    position_id: a_site
    text:
      ru: Залетаем вторым после entry, держим Default.
      en: Enter second after the entry, hold Default.


## igl

brief:
  ru: Командует темпом, при +1 на mid читает ситуацию и зовёт A или B.
  en: Calls tempo. After a mid pick, reads the situation and calls either A or B.

steps:
  - kind: spawn
    text:
      ru: "Закуп: AK-47, kevlar+helmet, флешка, смок (опц.)."
      en: "Buy: AK-47, kevlar+helmet, flash, smoke (optional)."
  - kind: move
    time: 5
    text:
      ru: Бежим в Top Mid с командой.
      en: Run to Top Mid with the team.
  - kind: hold
    time: 15
    position_id: top_mid
    text:
      ru: Слушаем шум — где CT, кто играет mid.
      en: Listen for sounds — where CTs are, who plays mid.
  - kind: note
    time: 25
    text:
      ru: Решение — A exec или фейк A → ротация через коннектор на B.
      en: Decision — A exec or fake A → rotate through Connector to B.
  - kind: exec
    time: 40
    position_id: a_site
    text:
      ru: Залетаем третьим, прикрываем default angle.
      en: Enter third, cover default angle.
