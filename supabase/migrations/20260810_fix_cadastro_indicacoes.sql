-- SEEK NETWORK — Fix: cadastro de indicações falhando para todos os perfis
-- Execute no Supabase SQL Editor.
--
-- CAUSA RAIZ (confirmada em produção em 2026-08-10, via teste direto na API
-- REST do Supabase): a coluna `city` NUNCA foi de fato criada em `referrals`/
-- `jr_referrals`, apesar de `supabase/migrations/20260731_prospeccao.sql` já
-- existir no repositório com o ALTER TABLE necessário — por algum motivo
-- esse arquivo não chegou a ser executado no banco real (a documentação de
-- sessões anteriores registrava como "confirmado executado", o que se
-- mostrou incorreto).
--
-- `addReferral`/`addJrReferral` (index.html) sempre enviam `city` no insert
-- principal (LeadForm sempre inclui o campo, mesmo vazio → null). Sem a
-- coluna, o Supabase (PostgREST) responde com o erro:
--   {"code":"PGRST204","message":"Could not find the 'city' column of
--    'referrals' in the schema cache"}
-- O código só sabia reconhecer o erro clássico do Postgres puro (42703,
-- "coluna não existe") como sinal para cair no próximo tier do fallback —
-- nunca reconhecia PGRST204, que é o código que o PostgREST usa quando o
-- CACHE DE SCHEMA dele (não o Postgres em si) desconhece a coluna. Resultado:
-- nenhum fallback disparava, e TODA tentativa de cadastrar indicação (por
-- Vendedor, SEEK ou SEEK JR — os três perfis que têm o formulário de
-- indicação) falhava com a caixa vermelha de erro.
--
-- Esta migration resolve a causa raiz de fato (a coluna que deveria existir).
-- Em paralelo, index.html foi corrigido para reconhecer também PGRST204 em
-- todos os fallbacks (isMissingColumnError) — assim uma coluna nova faltando
-- no futuro nunca mais quebra o cadastro por completo, mesmo antes da
-- migration correspondente ser executada.
--
-- Idempotente e seguro rodar mesmo que 20260731_prospeccao.sql já tenha sido
-- executado (ADD COLUMN IF NOT EXISTS não falha se a coluna já existir).

ALTER TABLE referrals    ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE jr_referrals ADD COLUMN IF NOT EXISTS city text;

COMMENT ON COLUMN referrals.city IS
  'Cidade do cliente indicado (opcional, preenchida no cadastro da indicação). Usada pela tela Prospecção do MASTER.';
COMMENT ON COLUMN jr_referrals.city IS
  'Cidade do cliente indicado (opcional, preenchida no cadastro da indicação). Usada pela tela Prospecção do MASTER.';
