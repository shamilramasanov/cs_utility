-- Таблица для контента редактора (lineups, overrides, расширения каталога, зоны).
-- Railway: если во вкладке Database → Data нет кнопки Run, выполни с ПК: npm run db:schema
-- (в .env публичный DATABASE_URL из Postgres → Variables). Иначе вставь этот SQL в Query и выполни.

CREATE TABLE IF NOT EXISTS editor_content (
  key text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
