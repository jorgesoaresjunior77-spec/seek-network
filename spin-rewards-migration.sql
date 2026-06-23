-- Migration: spin_rewards table
-- Run this in the Supabase SQL Editor before deploying the Roleta feature.

create table if not exists spin_rewards (
  id           uuid primary key default gen_random_uuid(),
  seek_id      text,              -- ID do SEEK (members.id), nulo se for JR
  jr_id        text,              -- ID do SEEK JR (seek_jrs.id), nulo se for SEEK
  referral_id  text,              -- ID da indicação que gerou o prêmio
  value        numeric not null,  -- Valor ganho (5, 10, 15, 20, 50 ou 100)
  created_at   timestamptz not null default now()
);

alter table spin_rewards enable row level security;

create policy "allow_all" on spin_rewards
  for all to anon
  using (true)
  with check (true);
