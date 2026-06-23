-- Migration: spin_rewards e spin_pending
-- Execute no SQL Editor do Supabase antes de publicar a versão com Roleta.

-- Tabela de recompensas já giradas
create table if not exists spin_rewards (
  id           uuid primary key default gen_random_uuid(),
  seek_id      text,              -- ID do SEEK (members.id), nulo se for JR
  jr_id        text,              -- ID do SEEK JR (seek_jrs.id), nulo se for SEEK
  referral_id  text,              -- ID da indicação que gerou o prêmio
  value        numeric not null,  -- Valor ganho (5, 10, 15, 20, 50 ou 100)
  used         boolean not null default true, -- sempre true (registro pós-giro)
  created_at   timestamptz not null default now()
);

alter table spin_rewards enable row level security;
create policy "allow_all" on spin_rewards for all to anon using (true) with check (true);

-- Tabela de chances pendentes (ainda não giradas)
create table if not exists spin_pending (
  id           uuid primary key default gen_random_uuid(),
  seek_id      text,              -- nulo se for JR
  jr_id        text,              -- nulo se for SEEK
  referral_id  text,
  created_at   timestamptz not null default now()
);

alter table spin_pending enable row level security;
create policy "allow_all" on spin_pending for all to anon using (true) with check (true);
