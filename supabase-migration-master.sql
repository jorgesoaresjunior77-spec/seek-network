-- SEEK Network — Migration: perfil MASTER + vendedores (ADMs)
-- Execute no SQL Editor do Supabase após o schema inicial

-- 1. Tabela de vendedores (ADMs)
create table adms (
  id serial primary key,
  name text not null,
  whatsapp text,
  pix_key text,
  notes text
);
alter table adms enable row level security;
create policy "allow_all" on adms for all to anon using (true) with check (true);

-- 2. Vincular cada SEEK (member) a um vendedor
alter table members add column adm_id integer;
