-- SEEK NETWORK — Migração Roleta da Sorte
-- Execute este arquivo no Supabase SQL Editor

-- Tabela: spin_pending
-- Controla chances de roleta pendentes (ainda não giradas)
CREATE TABLE IF NOT EXISTS spin_pending (
  id          BIGSERIAL PRIMARY KEY,
  seek_id     TEXT,
  jr_id       TEXT,
  referral_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spin_pending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_spin_pending" ON spin_pending FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabela: spin_rewards
-- Registra os valores ganhos em cada giro
CREATE TABLE IF NOT EXISTS spin_rewards (
  id          BIGSERIAL PRIMARY KEY,
  seek_id     TEXT,
  jr_id       TEXT,
  referral_id TEXT,
  value       NUMERIC NOT NULL,
  used        BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spin_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_spin_rewards" ON spin_rewards FOR ALL TO anon USING (true) WITH CHECK (true);
