-- migration-cofre.sql
-- Cofre Misterioso: tabelas para pendentes e recompensas

create table if not exists chest_pending (
  id          bigserial primary key,
  seek_id     bigint references members(id) on delete cascade,
  jr_id       bigint references seek_jrs(id) on delete cascade,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists chest_rewards (
  id          bigserial primary key,
  seek_id     bigint references members(id) on delete cascade,
  jr_id       bigint references seek_jrs(id) on delete cascade,
  valor       numeric(10,2) not null,
  paid        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- RLS: allow all for anon (igual às demais tabelas)
alter table chest_pending  enable row level security;
alter table chest_rewards  enable row level security;

create policy allow_all on chest_pending  for all to anon using (true) with check (true);
create policy allow_all on chest_rewards  for all to anon using (true) with check (true);
