-- SEEK NETWORK — Migração: Pipeline de Status da Indicação + Central de Notificações
-- Execute no Supabase SQL Editor
--
-- Adiciona um campo `stage` PARALELO ao `status` financeiro existente
-- (aguardando/a_pagar/pago/nao_fechou), que continua intocado e continua
-- sendo a única fonte de verdade para comissão/roleta/cofre/desafio do mês.
-- `stage` é só o pipeline de CRM (nova indicação, em contato, aguardando,
-- vendido, não comprou, e o que mais for adicionado no futuro).
--
-- De propósito, `stage` NÃO tem CHECK constraint (ao contrário de `status`):
-- a lista de estágios válidos vive só no código (REFERRAL_STAGES, index.html),
-- então adicionar um estágio novo no futuro não exige nenhuma migração.

-- ─── referrals ────────────────────────────────────────────────────
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'nova',
  ADD COLUMN IF NOT EXISTS stage_note text,
  ADD COLUMN IF NOT EXISTS stage_reason text,
  ADD COLUMN IF NOT EXISTS stage_reason_other text,
  ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz;

UPDATE referrals SET stage='vendido'     WHERE stage='nova' AND (status='pago' OR status='a_pagar');
UPDATE referrals SET stage='nao_comprou' WHERE stage='nova' AND status='nao_fechou';

-- ─── jr_referrals ─────────────────────────────────────────────────
ALTER TABLE jr_referrals
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'nova',
  ADD COLUMN IF NOT EXISTS stage_note text,
  ADD COLUMN IF NOT EXISTS stage_reason text,
  ADD COLUMN IF NOT EXISTS stage_reason_other text,
  ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz;

UPDATE jr_referrals SET stage='vendido'     WHERE stage='nova' AND (status='pago' OR status='a_pagar');
UPDATE jr_referrals SET stage='nao_comprou' WHERE stage='nova' AND status='nao_fechou';

-- ─── referral_timeline (linha do tempo — nunca editada, só inserida) ──
CREATE TABLE IF NOT EXISTS referral_timeline (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referral_id      TEXT NOT NULL,
  referral_type    TEXT NOT NULL CHECK (referral_type IN ('member','jr')),
  stage            TEXT NOT NULL,
  reason           TEXT,
  reason_other     TEXT,
  note             TEXT,
  changed_by_name  TEXT,
  changed_by_role  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── notifications (Central de Notificações — genérica) ───────────
-- `type`/`link_type` são texto livre, sem CHECK: qualquer módulo futuro
-- (desafio do mês, comissão liberada, prêmio, ranking, campanha, aviso
-- administrativo, etc.) pode inserir aqui sem precisar de nova migração.
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('member','jr')),
  owner_id    TEXT NOT NULL,
  type        TEXT NOT NULL,
  icon        TEXT,
  color       TEXT,
  title       TEXT NOT NULL,
  body        TEXT,
  link_type   TEXT,
  link_id     TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS (consistente com as demais tabelas do projeto) ───────────
ALTER TABLE referral_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referral_timeline' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON referral_timeline FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON notifications FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
