-- SEEK Network — Supabase schema
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard/project/upgefuunepjtvppybmki/sql)

create table members (
  id serial primary key,
  name text not null,
  whatsapp text,
  pix_key text,
  notes text
);

create table seek_jrs (
  id text primary key,
  name text not null,
  whatsapp text,
  seek_id text,
  pin text default '0000',
  is_new boolean default true
);

create table credentials (
  key text primary key,
  login text,
  pin text not null default '0000'
);

create table referrals (
  id bigserial primary key,
  member_id text not null,
  client_name text,
  whatsapp text,
  product_type text default 'auto',
  product_value numeric default 0,
  commission numeric default 0,
  year integer,
  month integer,
  day integer,
  paid boolean default false,
  is_new boolean default true
);

create table jr_referrals (
  id bigserial primary key,
  jr_id text not null,
  client_name text,
  whatsapp text,
  product_type text default 'auto',
  product_value numeric default 0,
  commission numeric default 0,
  year integer,
  month integer,
  day integer,
  paid boolean default false,
  is_new boolean default true
);

create table pass_requests (
  id bigserial primary key,
  phone text,
  type text default 'forgot',
  resolved boolean default false
);

create table level_notifs (
  id bigserial primary key,
  member_id text,
  level_id text,
  dismissed boolean default false
);

create table offers (
  id bigserial primary key,
  url text,
  caption text
);

-- RLS + políticas permissivas para anon (chave pública do cliente)
alter table members      enable row level security;
alter table seek_jrs     enable row level security;
alter table credentials  enable row level security;
alter table referrals    enable row level security;
alter table jr_referrals enable row level security;
alter table pass_requests enable row level security;
alter table level_notifs enable row level security;
alter table offers       enable row level security;

create policy "allow_all" on members      for all to anon using (true) with check (true);
create policy "allow_all" on seek_jrs     for all to anon using (true) with check (true);
create policy "allow_all" on credentials  for all to anon using (true) with check (true);
create policy "allow_all" on referrals    for all to anon using (true) with check (true);
create policy "allow_all" on jr_referrals for all to anon using (true) with check (true);
create policy "allow_all" on pass_requests for all to anon using (true) with check (true);
create policy "allow_all" on level_notifs for all to anon using (true) with check (true);
create policy "allow_all" on offers       for all to anon using (true) with check (true);
