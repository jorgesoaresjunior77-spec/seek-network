-- SEEK NETWORK — Migração: Desafio Mensal (recorrente e configurável)
-- Executar no Supabase SQL Editor
--
-- Substitui/generaliza o desafio pontual de julho por um sistema configurável
-- pelo Vendedor todo mês: meta de indicações (target_n) e 3 percentuais de
-- bônus por faixa de conversão (pct1 = 1ª venda, pct2 = 2ª venda, pct3 = todas
-- as target_n vendas). Uma linha por mês/ano de vigência — o histórico de
-- meses passados nunca é apagado, apenas o mês corrente é editado/substituído.
--
-- Não há tabela de "progresso"/rastreamento separada: o progresso e o bônus
-- de cada indicação são sempre CALCULADOS a partir das tabelas já existentes
-- (referrals / jr_referrals, usando year/month/created_at/status), a mesma
-- lógica já usada para o desafio pontual de julho e para o Cofre Misterioso
-- (evita duplicar estado e dessincronizar).

CREATE TABLE IF NOT EXISTS monthly_challenge_config (
  id bigint generated always as identity primary key,
  year int not null,
  month int not null,
  target_n int not null default 3,
  pct1 numeric not null default 5,
  pct2 numeric not null default 8,
  pct3 numeric not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (year, month)
);
