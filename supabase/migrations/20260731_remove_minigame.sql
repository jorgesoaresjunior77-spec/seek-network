-- SEEK NETWORK — Migração: remover infraestrutura do Minigame
-- Executar no Supabase SQL Editor.
--
-- Contexto: o usuário pediu a remoção completa do módulo de Minigame
-- ("Estoura Oportunidade" — telas, menus, componentes, notificações e todo
-- o código relacionado já foram removidos do index.html). Esta migração
-- remove a única tabela dedicada a ele, que não é usada por mais nada no
-- app. Não afeta nenhuma outra tabela.

DROP TABLE IF EXISTS minigame_scores;
