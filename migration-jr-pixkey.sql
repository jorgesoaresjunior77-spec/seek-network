-- SEEK NETWORK — Migração: pix_key em seek_jrs
-- Executar no Supabase SQL Editor
--
-- A coluna pix_key foi adicionada ao formulário/insert de SEEK JR (commit adfc283,
-- "PIX no JR") mas a migração da tabela nunca foi criada. Sem esta coluna, todo
-- INSERT em seek_jrs falha com erro 42703 (coluna inexistente) e o cadastro de
-- SEEK JR não é salvo.

ALTER TABLE seek_jrs ADD COLUMN IF NOT EXISTS pix_key text;
