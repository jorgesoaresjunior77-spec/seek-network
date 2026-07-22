-- SEEK NETWORK — Migração: coluna "paid" em spin_rewards
-- Execute no Supabase SQL Editor
--
-- spin_rewards foi criada (migration-roleta.sql, spin-rewards-migration.sql,
-- migration-fluxo-indicacoes.sql) só com a coluna "used" (controla se a
-- chance já foi girada). O app inteiro sempre tratou "paid" como a coluna
-- que controla se o prêmio já foi pago ao SEEK/JR — mas essa coluna nunca
-- existiu. Toda leitura de spin_rewards.paid retornava sempre false, e
-- toda tentativa de UPDATE paid=true falhava silenciosamente (console.error,
-- sem alerta na tela), fazendo a Roleta aparecer pendente para sempre em
-- todos os painéis, mesmo depois de "PAGAR TUDO".

ALTER TABLE spin_rewards
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;
