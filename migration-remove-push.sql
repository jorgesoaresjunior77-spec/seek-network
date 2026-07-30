-- Remove completamente a infraestrutura de Push Notifications do Supabase.
-- Rodar manualmente no SQL Editor do Supabase (mesma convenção dos outros
-- arquivos migration-*.sql deste repo).
--
-- Contexto: a arquitetura de Push (registro de dispositivo, filas,
-- campanhas) foi preparada em 2026-07-29 mas o envio real nunca foi
-- ativado (dependia de uma Edge Function que nunca chegou a ser implantada
-- no Supabase). Em 2026-07-30 o usuário decidiu remover a feature por
-- completo desta versão do app e manter apenas a Central de Notificações
-- interna (tabela `notifications`, lida pelo sino do app) — Push voltará,
-- se for o caso, em um projeto separado e planejado do zero.
--
-- Não afeta: `notifications`, `referral_timeline` (Central de Notificações
-- interna) nem nenhuma outra tabela do app.

DROP TABLE IF EXISTS push_notifications;
DROP TABLE IF EXISTS push_campaigns;
DROP TABLE IF EXISTS push_subscriptions;
