-- SEEK NETWORK — Migração: city em referrals e jr_referrals
-- Executar no Supabase SQL Editor.
--
-- Adiciona o campo "Cidade" (opcional) ao cadastro de indicação, usado pela
-- nova tela "Prospecção" do painel MASTER (banco permanente de clientes
-- indicados). Sem esta migração, o app continua funcionando normalmente —
-- o insert cai no fallback sem `city` (mesmo padrão de todas as migrações
-- pendentes deste projeto) e a coluna Cidade aparece vazia ("—") na
-- Prospecção.

ALTER TABLE referrals    ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE jr_referrals ADD COLUMN IF NOT EXISTS city text;

COMMENT ON COLUMN referrals.city IS
  'Cidade do cliente indicado (opcional, preenchida no cadastro da indicação). Usada pela tela Prospecção do MASTER.';
COMMENT ON COLUMN jr_referrals.city IS
  'Cidade do cliente indicado (opcional, preenchida no cadastro da indicação). Usada pela tela Prospecção do MASTER.';
