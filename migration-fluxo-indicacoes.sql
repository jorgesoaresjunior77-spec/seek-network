-- migration-fluxo-indicacoes.sql
-- Executa no Supabase SQL Editor

-- 1) Coluna status em referrals
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'a_pagar'
  CHECK (status IN ('aguardando','a_pagar','pago'));

UPDATE referrals SET status='pago'      WHERE paid=true;
UPDATE referrals SET status='a_pagar'   WHERE paid=false AND product_value>0 AND status='a_pagar';
UPDATE referrals SET status='aguardando' WHERE paid=false AND (product_value IS NULL OR product_value=0);

-- 2) Coluna status em jr_referrals
ALTER TABLE jr_referrals
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'a_pagar'
  CHECK (status IN ('aguardando','a_pagar','pago'));

UPDATE jr_referrals SET status='pago'      WHERE paid=true;
UPDATE jr_referrals SET status='a_pagar'   WHERE paid=false AND product_value>0 AND status='a_pagar';
UPDATE jr_referrals SET status='aguardando' WHERE paid=false AND (product_value IS NULL OR product_value=0);

-- 3) Tabela spin_pending (criar se não existir)
CREATE TABLE IF NOT EXISTS spin_pending (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seek_id     TEXT,
  jr_id       TEXT,
  referral_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Tabela spin_rewards (criar se não existir)
CREATE TABLE IF NOT EXISTS spin_rewards (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seek_id     TEXT,
  jr_id       TEXT,
  referral_id TEXT,
  value       NUMERIC NOT NULL DEFAULT 0,
  used        BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5) RLS (consistente com demais tabelas do projeto)
ALTER TABLE spin_pending  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_rewards  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='spin_pending' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON spin_pending FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='spin_rewards' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON spin_rewards FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
