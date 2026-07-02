-- SEEK NETWORK — Migração: birthday_year (ano de aniversário)
-- Executar no Supabase SQL Editor

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS birthday_year integer;
ALTER TABLE jr_referrals ADD COLUMN IF NOT EXISTS birthday_year integer;
