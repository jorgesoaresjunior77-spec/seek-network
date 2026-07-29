-- SEEK NETWORK — Migração: Arquitetura de Push Notifications (preparação)
-- Execute no Supabase SQL Editor
--
-- Prepara toda a estrutura de dados para Web Push (dispositivos registrados,
-- fila de envios individuais, e campanhas de broadcast como o Desafio do Mês)
-- SEM depender de nenhuma Edge Function ainda implantada. O app já grava
-- registros aqui normalmente; o envio real (que exige a chave VAPID privada,
-- nunca exposta no cliente) só passa a acontecer quando a Edge Function
-- 'send-push' for escrita e implantada — ver dispatchPush() em index.html.

-- ─── push_subscriptions (um dispositivo assinado por dono) ─────────
-- owner_type cobre todos os papéis que podem registrar um dispositivo:
-- 'adm' (vendedor), 'master', 'member' (SEEK), 'jr' (SEEK JR).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('adm','master','member','jr')),
  owner_id    TEXT NOT NULL,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── push_campaigns (estrutura para broadcasts, ex: Desafio do Mês) ──
-- `type`/`target` são texto livre, sem CHECK de valores: qualquer campanha
-- futura (aviso admin, prêmio, ranking, etc.) usa a mesma tabela.
CREATE TABLE IF NOT EXISTS push_campaigns (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  target      TEXT NOT NULL DEFAULT 'all_seeks',
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','sent','failed')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  sent_at     TIMESTAMPTZ
);

-- ─── push_notifications (fila/log de envio por dispositivo) ───────
-- Uma linha por (campanha OU teste avulso) x dispositivo. `status` começa
-- 'pending' e só muda pra 'sent'/'failed' quando a Edge Function processar.
CREATE TABLE IF NOT EXISTS push_notifications (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id      BIGINT REFERENCES push_campaigns(id) ON DELETE CASCADE,
  subscription_id  BIGINT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  body             TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  sent_at          TIMESTAMPTZ
);

-- ─── RLS (consistente com as demais tabelas do projeto) ───────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON push_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_campaigns' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON push_campaigns FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_notifications' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON push_notifications FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
