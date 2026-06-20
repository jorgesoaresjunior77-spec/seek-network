# Projeto SEEK — Contexto Técnico Completo

> Cole este documento inteiro como primeira mensagem para o Claude Code começar já com contexto completo do projeto.

## O que é o app

App de controle de indicações para a Motomecânica Volkswagen (Junior Soares, consultor de vendas). Três perfis de usuário:

- **ADM** — Junior Soares, telefone `51996509660`, senha `0000` (hardcoded no código, não é um registro de dados).
- **SEEK** — indicadores cadastrados pelo ADM. Cada um tem ID numérico sequencial, ganham comissão sobre indicações que viram venda.
- **SEEK JR** — sub-indicadores, cadastrados por um SEEK (seu "padrinho"). ID = `{idDoSeekPai}JR` (ex: SEEK `3` → JR `3JR`; se houver mais de um, `3JR2`, `3JR3`...). O SEEK pai ganha bônus sobre as comissões do seu JR.

## Estado atual da implementação

**Single-file React app**: tudo em um `index.html`, sem build step — React 18 + Babel Standalone carregados via CDN (`<script type="text/babel">`), JSX compilado no próprio navegador. Dados salvos em `localStorage` (sem backend real).

Esse é exatamente o ponto que você quer resolver migrando para Supabase.

## Estrutura de dados atual (localStorage)

```
sk_members      → array de {id, name, whatsapp, pixKey, notes}
sk_credentials  → objeto { "<memberId>": {login, pin}, "jr_<jrId>": {login, pin} }
sk_referrals    → array de indicações feitas por SEEKs
sk_jr_referrals → array de indicações feitas por SEEK JRs
sk_seekjrs      → array de {id, name, whatsapp, seekId, pin}
sk_nextId       → contador para o próximo ID de SEEK
sk_nextJrId     → contador para o próximo ID de JR (pouco usado, já que o ID é derivado de seekId)
sk_passReqs     → solicitações de "esqueci minha senha"
sk_levelNotifs  → notificações de mudança de nível (gamificação)
sk_offers       → ofertas/promoções cadastradas pelo ADM, compartilháveis via WhatsApp
```

**Importante**: `whatsapp`/`login` é sempre armazenado como **dígitos puros** (sem parênteses, traço, espaço). Essa foi uma fonte recorrente de bugs — havia campos de telefone mascarados (`(DD)XXXXX-XXXX`) que, mesmo armazenando dígitos puros internamente, geravam confusão. Foi criado um componente `PlainPhoneInput` (texto puro, sem máscara) e usado em todo formulário ligado a login (cadastro de SEEK, cadastro de JR, edição de SEEK).

## Login

Tela única (sem abas separadas ADM/SEEK/JR). Campos: telefone (só números) + senha (4 dígitos). O sistema tenta, nessa ordem:
1. Telefone+senha == ADM hardcoded → entra como admin.
2. Telefone+senha bate com alguma entrada de `sk_credentials` sem prefixo `jr_` → entra como SEEK.
3. Fallback: telefone bate com `whatsapp` de algum membro em `sk_members` (cobre credenciais antigas com `login` vazio).
4. Mesma lógica para JR, usando entradas com prefixo `jr_`.

## Regras de negócio (comissões)

```
Produtos (rate = % de comissão sobre o valor do produto):
  Automóveis:    0.001  (0,1%)
  Consórcios:    0.002  (0,2%)
  Empresariais:  0.0012 (0,12%)

Níveis SEEK (bônus de comissão por pontos acumulados, 1 ponto = R$100.000 em vendas):
  Seek Start:  0-9 pts    → 0% bônus
  Seek One:    10-19 pts  → 5% bônus
  Seek Plus:   20-49 pts  → 10% bônus
  Seek Pro:    50-99 pts  → 15% bônus
  Seek Elite:  100+ pts   → 20% bônus

Comissão SEEK = valor_venda × rate_produto × (1 + bonus_nivel)

Níveis JR (bônus que o SEEK pai recebe sobre o volume mensal do JR):
  JR1: 0-500k       → 5%
  JR2: 500k-1M      → 7%
  JR3: 1M-1.5M      → 10%
  JR4: 1.5M+        → 12%

Graduação: JR vira SEEK automaticamente após R$2.000.000 em vendas acumuladas.
```

## Bugs reais já corrigidos nesta sessão (histórico para não repetir)

1. **Comparação de ID inconsistente (string vs number)** — `member.id` é number, mas após round-trip por `JSON.stringify`/`localStorage`, chaves de objeto sempre viram string. Comparações `===` diretas falhavam silenciosamente. **Solução aplicada**: função utilitária `sameId(a,b)` (`String(a)===String(b)`) usada em **todas** as comparações de ID do projeto — nunca usar `===` direto entre IDs.

2. **Migração de localStorage que "ressuscitava" dados apagados** — havia uma função que, a cada boot do app, MESCLAVA dados de chaves antigas de localStorage (de versões anteriores: `sk_m`, `sk_c`, etc.) de volta nas chaves atuais. Isso fazia registros excluídos reaparecerem. **Solução aplicada**: função `cleanupLegacyStorageKeys()` que só **deleta** chaves antigas, nunca lê seu conteúdo de volta.

3. **Exclusão incompleta (cascata)** — excluir um SEEK removia o registro mas deixava a credencial (login/senha) órfã, e SEEK JRs vinculados continuavam existindo e conseguindo logar. **Solução aplicada**: `deleteMember()` agora cascade-deleta: credencial do membro, todos os JRs dele, credenciais desses JRs, e todas as indicações (do SEEK e dos JRs). Existe também `deleteSeekJr()` com a mesma lógica.

4. **Formulário de telefone mascarado causando inconsistência** — `PhoneInput` (mascarado `(DD)XXXXX-XXXX`) era usado em formulários de cadastro de login, mas a pessoa relatou que cadastro e login "não bateriam". Mesmo o componente normalizando internamente para dígitos, a experiência mascarada gerava desconfiança e havia pelo menos um campo com `onChange` quebrado (no-op) que não salvava nada. **Solução aplicada**: criado `PlainPhoneInput` (campo de texto puro, sem máscara) e usado em todo lugar ligado a autenticação.

5. **Erro de sintaxe JSX não detectado por verificação superficial** — um `.map()` retornando dois elementos-irmãos sem `<Fragment>` quebrava o parse do Babel no navegador, gerando `"Script error."` sem detalhes (por rodar dentro de um script de origem cruzada via CDN). **Lição**: balanceamento de chaves não é suficiente para validar JSX; é necessário um parser real (usei `esbuild`, que tem binário disponível neste ambiente, para validar parse + transform antes de cada entrega).

## Funcionalidades implementadas

- Login único com detecção automática de perfil
- Cadastro de SEEK pelo ADM (nome, telefone, PIX, senha inicial 0000)
- Cadastro de SEEK JR pelo SEEK (telefone, senha inicial 0000) — mesmo padrão espelhado no painel ADM
- Indicações com produto, valor, cálculo automático de comissão
- Painel ADM: dashboard, lista de membros (com JRs expansíveis), notificações (sino), regras de comissão, ofertas
- Painel SEEK: indicações, progresso de nível, lista de seus JRs, ofertas, alterar senha
- Painel SEEK JR: indicações, progresso, dados do SEEK padrinho, alterar senha
- Sistema de "esqueci minha senha" (solicitação cai nas notificações do ADM)
- Galeria de ofertas com compartilhamento via WhatsApp
- Logo "SEEK Network" em SVG (3 hexágonos metálicos)
- Modal de "subiu de nível" com medalhas em SVG

## O que falta / próximos passos sugeridos para o Claude Code

1. **Migrar localStorage → Supabase**: criar tabelas `members`, `seek_jr`, `referrals`, `jr_referrals`, `offers`, `pass_requests`, com `id` consistente (UUID ou serial, sempre o mesmo tipo) e RLS adequado. Isso elimina de raiz a classe de bug #1 e #2 acima.
2. **Migrar para projeto Vite/Next.js real**, separando os ~44 componentes que hoje vivem todos em um único arquivo de 2200 linhas.
3. **Autenticação real**: hoje senha de 4 dígitos é guardada em texto puro no `localStorage`. Vale considerar Supabase Auth (com telefone como identificador) ou ao menos hash da senha.
4. **Setup de ambiente**: o app usa fontes Google Fonts (Inter, Manrope) e ícones SVG inline — nenhuma dependência externa além de React/Babel, então a migração para um bundler é direta.

## Validação usada nesta sessão (referência)

Para qualquer mudança futura em JSX, validar com parser real antes de considerar pronto:
```bash
esbuild arquivo.jsx --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --outfile=/tmp/out.js
```
Um simples contador de chaves/parênteses NÃO é suficiente para pegar erros de JSX (ex: elementos-irmãos sem Fragment).
