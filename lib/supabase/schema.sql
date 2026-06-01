-- CourtIQ — esquema Supabase / PostgreSQL
-- Modelo: BASE COMPARTIDA (sin login). Todos los que entran con la clave de acceso comparten
-- la misma tabla de jugadores y rosters. La protección real es el gate de la app, no RLS por usuario.
--
-- SEGURIDAD (honesto): la anon key viaja en el frontend; cualquiera que la extraiga puede
-- escribir vía la API de Supabase. Aceptable para un workspace de scouting detrás de un gate
-- casual. Para multi-tenant real haría falta Supabase Auth + RLS por usuario.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Jugadores cargados (fuente de la verdad compartida). Guardamos el objeto Player completo
-- como JSONB para no tener que migrar el esquema cada vez que cambia el tipo en la app.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id         TEXT        PRIMARY KEY,          -- id de la app, ej. "manual-..."
  data       JSONB       NOT NULL,             -- objeto Player completo (name, stats, league, history, etc.)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_updated ON players(updated_at DESC);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- Workspace compartido: la anon key puede leer y escribir (la barrera es el gate de la app).
DROP POLICY IF EXISTS "shared players read"  ON players;
DROP POLICY IF EXISTS "shared players write" ON players;
CREATE POLICY "shared players read"  ON players FOR SELECT USING (true);
CREATE POLICY "shared players write" ON players FOR ALL    USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Rosters guardados (compartidos también).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rosters (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  slots      JSONB       NOT NULL,             -- { Base: playerId, Pívot: playerId, ... }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shared rosters read"  ON rosters;
DROP POLICY IF EXISTS "shared rosters write" ON rosters;
CREATE POLICY "shared rosters read"  ON rosters FOR SELECT USING (true);
CREATE POLICY "shared rosters write" ON rosters FOR ALL    USING (true) WITH CHECK (true);
