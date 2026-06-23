-- SEEK NETWORK — Migração: observacoes + status + paid_at
-- Executar no Supabase SQL Editor

-- ─── referrals ────────────────────────────────────────────────────
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando', 'a_pagar', 'pago')),
  ADD COLUMN IF NOT EXISTS paid_at     timestamptz;

-- Atualizar status existente com base nos dados atuais
UPDATE referrals
SET status = CASE
  WHEN paid = true        THEN 'pago'
  WHEN product_value > 0  THEN 'a_pagar'
  ELSE 'aguardando'
END
WHERE status = 'aguardando';

-- ─── jr_referrals ─────────────────────────────────────────────────
ALTER TABLE jr_referrals
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando', 'a_pagar', 'pago')),
  ADD COLUMN IF NOT EXISTS paid_at     timestamptz;

-- Atualizar status existente com base nos dados atuais
UPDATE jr_referrals
SET status = CASE
  WHEN paid = true        THEN 'pago'
  WHEN product_value > 0  THEN 'a_pagar'
  ELSE 'aguardando'
END
WHERE status = 'aguardando';
