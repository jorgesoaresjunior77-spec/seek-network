-- SEEK NETWORK — Migração Minigame (genérica, reaproveitada entre jogos)
-- Execute este arquivo no Supabase SQL Editor

-- Tabela: minigame_scores
-- Guarda o high score e o XP acumulado do minigame vigente por SEEK ou SEEK JR
-- (atualmente "Estoura Oportunidade" — a tabela não é específica de um jogo).
-- XP do minigame é independente do sistema de níveis por volume de vendas
-- (SEEK_LEVELS / calcPoints) — não afeta comissão nem bônus de produto.
CREATE TABLE IF NOT EXISTS minigame_scores (
  id           BIGSERIAL PRIMARY KEY,
  seek_id      TEXT,
  jr_id        TEXT,
  high_score   INTEGER NOT NULL DEFAULT 0,
  total_xp     INTEGER NOT NULL DEFAULT 0,
  plays_count  INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE minigame_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_minigame_scores" ON minigame_scores FOR ALL TO anon USING (true) WITH CHECK (true);
