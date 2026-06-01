-- CourtIQ — esquema Supabase / PostgreSQL
-- Extensión para gen_random_uuid() (Supabase la trae; declararla es buena práctica en PG puro).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Caché de jugadores buscados
CREATE TABLE IF NOT EXISTS players_cache (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  team         TEXT,
  league       TEXT        NOT NULL,
  season       TEXT,
  stats        JSONB       NOT NULL,
  metrics      JSONB,
  salary_usd   INTEGER,
  lqw          DECIMAL(4,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source_url   TEXT
);

CREATE INDEX IF NOT EXISTS idx_players_name   ON players_cache USING GIN(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_players_league ON players_cache(league);

-- Rosters guardados por usuario (FK a auth.users de Supabase Auth)
CREATE TABLE IF NOT EXISTS saved_rosters (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  players    JSONB       NOT NULL,
  metrics    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuario ve solo sus rosters
ALTER TABLE saved_rosters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users see own rosters" ON saved_rosters;
CREATE POLICY "users see own rosters" ON saved_rosters
  USING (auth.uid() = user_id);

-- Logs de búsquedas
CREATE TABLE IF NOT EXISTS search_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  query         TEXT        NOT NULL,
  results_count INTEGER,
  avg_uv_score  DECIMAL(5,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
