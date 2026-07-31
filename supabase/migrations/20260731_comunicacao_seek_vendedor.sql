-- SEEK NETWORK — Migração: conversa livre entre Vendedor e Seek/JR dentro de
-- uma indicação (referral_messages) + liberar notifications para o Vendedor.
-- Executar no Supabase SQL Editor.
--
-- Contexto: `referral_timeline` (migration-notification-center.sql, já
-- executada) é estritamente "1 linha = 1 mudança de estágio" (Standby/
-- Vendido/Não fechou) — não serve para troca livre de mensagens (ida e
-- volta) entre Vendedor e Seek dentro da mesma indicação. `referral_messages`
-- é uma tabela nova e paralela, sem CHECK em `sender_role` (mesmo motivo do
-- resto do projeto: crescer sem migração nova). Nenhuma mensagem é editável
-- ou apagável — não há coluna/rotina de delete previstas de propósito.

CREATE TABLE IF NOT EXISTS referral_messages (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referral_id    TEXT NOT NULL,
  referral_type  TEXT NOT NULL CHECK (referral_type IN ('member','jr')),
  sender_role    TEXT NOT NULL,
  sender_name    TEXT,
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE referral_messages IS
  'Conversa livre (várias mensagens, ida e volta) entre Vendedor e Seek/JR dentro de UMA indicação. Diferente de referral_timeline (1 linha = 1 mudança de estágio). Imutável: sem UPDATE/DELETE previstos pelo app.';
COMMENT ON COLUMN referral_messages.referral_id IS
  'ID da linha em referrals ou jr_referrals, conforme referral_type. Sem FOREIGN KEY: referral_id é polimórfico (aponta pra uma de duas tabelas diferentes, cada uma com sua própria sequência de id), mesmo padrão já usado em referral_timeline/notifications/spin_rewards neste projeto.';
COMMENT ON COLUMN referral_messages.referral_type IS
  'member = referrals.id, jr = jr_referrals.id.';
COMMENT ON COLUMN referral_messages.sender_role IS
  'adm (Vendedor) | member (Seek) | jr (Seek Jr). Sem CHECK de propósito, mesmo padrão do resto do projeto — crescer sem migração nova.';

-- Índice de suporte para buscar o histórico de UMA indicação (referral_id +
-- referral_type), e manter a ordem cronológica dentro dela. O boot da app
-- ainda busca a tabela inteira de uma vez (mesma arquitetura de fetch único
-- já usada em todo o projeto — ver memória do projeto), mas este índice
-- prepara o terreno caso uma consulta filtrada por indicação seja adicionada
-- no futuro (ex: abrir só a conversa de uma indicação sem baixar tudo).
CREATE INDEX IF NOT EXISTS idx_referral_messages_referral
  ON referral_messages (referral_id, referral_type, created_at);

ALTER TABLE referral_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referral_messages' AND policyname='allow_all') THEN
    CREATE POLICY allow_all ON referral_messages FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── notifications: liberar owner_type='adm'/'master' ─────────────
-- A tabela `notifications` (migration-notification-center.sql, já executada)
-- foi criada só para notificar SEEK/JR (owner_type IN ('member','jr')).
-- Agora o Vendedor também recebe notificação (ex: mensagem nova do Seek) —
-- a mesma tabela genérica é reaproveitada, só ampliando o CHECK de
-- owner_type. 'master' incluído por simetria/futuro-proofing, ainda sem
-- consumidor no código (Master continua somente leitura, sem notificações
-- próprias nesta feature).
DO $$
DECLARE
  con text;
BEGIN
  SELECT tc.constraint_name INTO con
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name AND tc.table_name = ccu.table_name
  WHERE tc.table_name = 'notifications' AND tc.constraint_type = 'CHECK' AND ccu.column_name = 'owner_type';

  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT %I', con);
  END IF;

  ALTER TABLE notifications
    ADD CONSTRAINT notifications_owner_type_check CHECK (owner_type IN ('member','jr','adm','master'));
END $$;

COMMENT ON COLUMN notifications.owner_type IS
  'member | jr | adm | master — dono da notificação. adm/master liberados em 2026-07-31 (antes só member/jr) para a Central de Notificações do Vendedor.';
