-- SEEK NETWORK — Migração: indicação "Não Fechou Negócio"
-- Execute no Supabase SQL Editor
--
-- Adiciona o status terminal 'nao_fechou' (cliente indicado não comprou —
-- a indicação é encerrada e nunca mais entra em vendas/comissão/roleta/
-- cofre/ranking) e a coluna que controla a notificação de "não lida" para
-- o SEEK/SEEK JR dono da indicação.
--
-- O CHECK constraint de status foi criado sem nome explícito em
-- migration-status-pagamento.sql, então localizamos e derrubamos o nome
-- gerado automaticamente pelo Postgres em vez de arriscar um nome errado.

-- ─── referrals ────────────────────────────────────────────────────
DO $$
DECLARE c text;
BEGIN
  SELECT con.conname INTO c
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'referrals' AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE referrals DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE referrals
  ADD CONSTRAINT referrals_status_check
    CHECK (status IN ('aguardando', 'a_pagar', 'pago', 'nao_fechou'));

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS closed_notice_read boolean NOT NULL DEFAULT true;

-- ─── jr_referrals ─────────────────────────────────────────────────
DO $$
DECLARE c text;
BEGIN
  SELECT con.conname INTO c
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'jr_referrals' AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE jr_referrals DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE jr_referrals
  ADD CONSTRAINT jr_referrals_status_check
    CHECK (status IN ('aguardando', 'a_pagar', 'pago', 'nao_fechou'));

ALTER TABLE jr_referrals
  ADD COLUMN IF NOT EXISTS closed_notice_read boolean NOT NULL DEFAULT true;
