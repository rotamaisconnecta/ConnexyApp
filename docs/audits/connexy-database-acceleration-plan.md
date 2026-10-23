# Connexy — Plano de Aceleração: Baseline e Conexão

- **Tipo:** diagnóstico e planejamento técnico. Nenhum código, `.env`, `supabase/config.toml` ou
  migração foi alterado. Nenhuma operação de rede/login/SQL/remoto foi executada.
- **Data:** 2026-10-13. **Autor:** OpenCode.
- **Escopo remoto:** não tocar em `lzejdgfvtybarpbgwsyp` (fora de escopo). Projeto autorizado para
  integração futura: `rsukwuqocgjmwwuwtqaf` (`connexy-mvp`) — **não** validado em runtime nesta fase.
- **Regra de segredos:** nenhum valor de chave/token/senha/URL completa é reproduzido. Apenas nomes
  de variáveis, identificadores de projeto (`project_ref`) e tamanhos são citados.

---

## 1. Resumo executivo

- O trabalho existente está **preservado**: HEAD e branch inalterados; nenhum commit/push/reset.
- A base Schema A (contratos, adaptadores, RPCs, migração `20260925030806_schema_a_core.sql`) está
  implementada e com boa cobertura de testes unitários/live-local. **Todas as flags Schema A estão
  OFF** no ambiente local — comportamento pretendido, não bloqueio.
- O projeto **não está conectado** a nenhum Supabase de forma validada. A configuração local tem
  **divergência real de namespace**: a variável server-side `SUPABASE_URL` aponta para o projeto
  **fora de escopo** (`lzejdgfvtybarpbgwsyp`), enquanto `VITE_APP_SUPABASE_URL`, `VITE_SUPABASE_URL`
  e `supabase/config.toml` apontam para o autorizado (`rsukwuqocgjmwwuwtqaf`).
- **Marco A é o gargalo de maior alavancagem**: enquanto o wiring de ambiente não for reconciliado e
  a autenticação real não for validada, qualquer integração de fluxo falhará de forma fechada.
- **Bloqueio de segurança separado:** C2 permanece aberto (buckets públicos + SELECT bucket-wide). O
  endpoint de URL assinada de mídia (`getPostMediaUrl`) existe, mas tem **0 importadores na UI** e a
  flag `VITE_APP_SCHEMA_A_MEDIA_URL` está OFF. A lacuna HTTP ponte-a-ponta (G4.2) segue aberta.
- Fluxos com **maior prontidão de domínio** (prontos para fiação, uma vez destravado o Marco A):
  conexões/solicitações (RPCs reais), perfil (adaptador + repositório remoto) e conversas
  (Schema A + realtime). Fluxos **sem implementação remota**: notificações e catálogo
  (eventos/locais/negócios são local/demo).

---

## 2. Baseline Git inicial e final

Idênticos (nenhuma alteração feita nesta fase).

| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` (`fix: padroniza rolagem horizontal da Home`) |
| Remote | `origin` → `github.com/rotamaisconnecta/ConnexyApp.git` |
| Arquivos rastreados modificados (não staged) | 115 |
| Arquivos staged | 8 |
| Arquivos não rastreados | 116 |
| Diff tracked (não staged) | ~3457 inserções / ~1148 deleções |
| Arquivos de teste | 121 (`tests/*.test.ts`) |

Observações de estado:
- A árvore está **muito suja** (snapshot de trabalho em andamento). O delta é amplo: novos módulos
  `src/lib/media/*`, `src/lib/gemini/*`, `src/lib/admin/*`, `src/lib/carona/*`, `src/lib/catalog/*`,
  `src/components/catalog/*`, `src/components/carona/*`, rotas `_app.carona.*`, `admin.tsx`,
  `_app.gerenciar.splash.tsx`, e dezenas de testes.
- `.env` está **staged como deletado** (remoção do tracking) e presente no disco; é ignorado pelo
  Git (`.gitignore`). `.env.example` e `.gitignore` foram modificados.
- Ignorados relevantes: `.env`, `.env.local`, `.output/`, `.tanstack/`, `.wrangler/`,
  `node_modules/`, `supabase/.branches/`, `supabase/.temp/`.
- **Risco Git:** não fazer rebase/amend/force-push publicado (regra Lovable do `AGENTS.md`).

---

## 3. Estado da configuração Supabase (sem segredos)

### 3.1 Quem lê o quê

| Consumidor | Arquivo | Variáveis lidas |
| --- | --- | --- |
| Cliente browser (proxy preguiçoso) | `src/lib/supabase/client.ts:48-49` | `VITE_APP_SUPABASE_URL`, `VITE_APP_SUPABASE_PUBLISHABLE_KEY` |
| Cliente gerado (sem importadores live) | `src/integrations/supabase/client.ts:34-35` | `VITE_APP_SUPABASE_URL`, `VITE_APP_SUPABASE_PUBLISHABLE_KEY` |
| SSR por cookie | `src/lib/supabase/server.server.ts:32-36` | `APP_SUPABASE_URL \|\| VITE_APP_SUPABASE_URL`; idem `..._PUBLISHABLE_KEY` |
| Middleware de auth (serverFn) | `src/integrations/supabase/auth-middleware.ts:36-37` | **somente** `VITE_APP_SUPABASE_URL` / `VITE_APP_SUPABASE_PUBLISHABLE_KEY` |
| ServerFn de mídia | `src/lib/media/media-url.functions.ts:38-40` | `APP_SUPABASE_URL \|\| VITE_APP_SUPABASE_URL`; idem key |
| Cliente admin (service role) | `src/integrations/supabase/client.server.ts:33-34` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Detecção de config | `src/lib/supabase/config.ts:11-22` | `import.meta.env.VITE_APP_*` (browser); `process.env.APP_*` (server) |
| RPC/MCP | `src/lib/mcp/supabase.ts` | `APP_SUPABASE_URL`/`VITE_APP_SUPABASE_URL` + keyset/legado |

### 3.2 Precedência e diferenças dev × server

- O bundle do browser usa **apenas** `VITE_APP_*` (nunca `APP_*`, nunca `VITE_SUPABASE_*`/`SUPABASE_*`).
- No servidor, `server.server.ts` e o handler de mídia usam `APP_*` com **fallback** para `VITE_APP_*`.
- **`APP_SUPABASE_URL` / `APP_SUPABASE_PUBLISHABLE_KEY` NÃO estão definidas** em `.env`/`.env.local`.
  Logo o SSR usa o fallback `VITE_APP_*` — funciona, mas sem namespace server-side próprio.
- **Divergência M2 (do G4.1) confirmada:** `auth-middleware.ts` lê só `VITE_APP_*`, enquanto o handler
  lê `APP_* || VITE_APP_*`. Se `APP_*` divergir de `VITE_APP_*`, o token é validado em um projeto e o
  RLS rodaria em outro ⇒ falha **fechada** (`forbidden`), porém endpoint inoperante.

### 3.3 Corresponde ao projeto autorizado?

| Origem | `project_ref` observado | Situação |
| --- | --- | --- |
| `supabase/config.toml` (`project_id`) | `rsukwuqocgjmwwuwtqaf` | autorizado |
| `.env` → `VITE_APP_SUPABASE_URL` | `rsukwuqocgjmwwuwtqaf` | autorizado |
| `.env` → `VITE_SUPABASE_URL` | `rsukwuqocgjmwwuwtqaf` | autorizado (namespace legado **não lido** pelo código) |
| `.env` → `SUPABASE_URL` | `lzejdgfvtybarpbgwsyp` | **FORA DE ESCOPO** |
| `.env` → `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | `rsukwuqocgjmwwuwtqaf` | autorizado (não lido) |

- **Achado de configuração (bloqueante para Marco A):** `SUPABASE_URL` (usada por
  `client.server.ts`, o cliente service-role) aponta para `lzejdgfvtybarpbgwsyp`, que está **fora de
  escopo**. Hoje o impacto é contido porque `SUPABASE_SERVICE_ROLE_KEY` **não está definida** — o
  cliente admin lança "Missing environment variable(s)" (falha fechada). Mas se a service role for
  configurada sem corrigir `SUPABASE_URL`, assinaturas de mídia passariam a mirar o projeto errado.
- `.env` ainda contém as variáveis legado `VITE_SUPABASE_*`, `SUPABASE_PROJECT_ID`,
  `SUPABASE_PUBLISHABLE_KEY` que o código **intencionalmente nunca lê** (sem fallback Lovable);
  são ruído/risco de confusão.

### 3.4 Variáveis ausentes / duplicadas / não usadas

- **Ausentes:** `APP_SUPABASE_URL`, `APP_SUPABASE_PUBLISHABLE_KEY`, `APP_SUPABASE_SERVICE_ROLE_KEY`,
  todas as `VITE_APP_SCHEMA_A_*`, `VITE_APP_DEMO_MODE`.
- **Duplicadas/inconsistentes:** `SUPABASE_URL` (fora de escopo) vs `VITE_APP_SUPABASE_URL`
  (autorizado); coexistência de namespaces legado (`VITE_SUPABASE_*`/`SUPABASE_*`) e do app
  (`VITE_APP_*`).
- **Não usadas pelo runtime:** `VITE_SUPABASE_*`, `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`.

### 3.5 Falha segura e vazamento de segredo server-side

- **Falha fechada confirmada:** `client.ts:51-59` lança quando falta config; `server.server.ts:38-42`
  lança; `route-guard.ts:24-33` lança em produção sem config e é no-op só em DEV sem Supabase.
- **Risco de service role no bundle:** `client.server.ts` é importado **apenas dinamicamente** dentro
  de `*.server.ts` (`media-server-authorization.server.ts:69`). Nenhum import estático em rotas/
  funções. O teste `tests/admin-dashboard.test.ts` verifica que rotas/`admin-access` não contêm a
  string da service role. **Não** foi gerado build nesta fase para inspecionar `.output` (o artefato
  existente é stale/pré-G4).
- `isDemoMode()` é **estático-false** em produção (`import.meta.env.DEV` substituído), então o demo
  nunca desabilita o backend real em produção (fail-closed).

### 3.6 Verificações remotas pendentes (exigem autorização separada)

- Confirmar que `rsukwuqocgjmwwuwtqaf` é de fato o projeto que deve receber `APP_*`/`VITE_APP_*`.
- Confirmar se o projeto fora de escopo `lzejdgfvtybarpbgwsyp` ainda é referenciado em algum
  ambiente de deploy (Lovable/CI). **Nenhuma** requisição feita nesta fase.

---

## 4. Matriz de prontidão dos fluxos

Legenda: **PRONTO** (integrado + evidência), **INT. PENDENTE** (domínio/adaptador existe, falta
fiação), **CONFIG. BLOQ.** (depende de config/projeto correto), **SEG. BLOQ.** (depende de
autorização/proteção), **NÃO IMPL.** (sem evidência funcional).

| # | Fluxo | Classificação | Evidência-chave |
| --- | --- | --- | --- |
| 1a | Login / sessão (real) | **PRONTO** (código; sem teste de rota) | `src/routes/auth.tsx`, `src/routes/auth_.callback.tsx`, `src/lib/auth/route-guard.ts`, `src/lib/supabase/identity.ts` |
| 1b | Cadastro (tela `/cadastro`) | **NÃO IMPL.** | `src/routes/cadastro.tsx` é mock demo-only; não chama `signUp` |
| 1c | Cutover Schema A Auth | **INT. PENDENTE** | `src/lib/auth/schema-a-auth-flag.ts` (OFF); `tests/schema-a-auth-1h-14.test.ts` |
| 2a | Perfil próprio (demo) | **PRONTO** (localStorage) | `src/lib/profile/use-own-profile.ts`, `src/routes/_app.perfil.index.tsx` |
| 2b | Perfil próprio (remoto Schema A) | **CONFIG. BLOQ.** / INT. PENDENTE | `src/lib/profile/schema-a-profile.ts`, `src/lib/profile/schema-a-profile-flag.ts` (OFF); `tests/schema-a-profile-1h-17.test.ts` |
| 2c | Perfil de terceiro (leitura) | **PARCIAL** | `src/routes/_app.perfil.$id.tsx` lê `profiles`/`bio_posts` direto no SSR/loader; fallback mock |
| 3 | Solicitações e conexões | **CONFIG. BLOQ.** | `connections.repository.ts` (RPCs reais), `_app.solicitacao.$id.tsx` (3 ramos), `_app.discover.tsx`/`_app.connecta.tsx` (dados demo/mock + `useDiscovery` real) |
| 4 | Publicações e privacidade | **INT. PENDENTE** | `src/lib/content/schema-a-content*.ts` (flag OFF), `posts_privacy_check`/RLS na migração core |
| 5 | Notificações (remoto) | **NÃO IMPL.** | sem tabela/migração; `_app.notificacoes.tsx` só funciona em demo (`listLocalInboxItems`) |
| 6 | Conversas e mensagens | **INT. PENDENTE** | `src/lib/chat/schema-a-conversations*.ts` (flag OFF), `src/hooks/api/use-chat.ts` (realtime quando remoto), `local-chat-persistence.ts` |
| 7a | Reels — gravação/publicação | **INT. PENDENTE** | `src/lib/reels/reel-publish.ts` faz upload a `reels-media` quando configurado; UI/validação pendentes |
| 7b | Mídia — URL assinada (UI) | **SEG. BLOQ.** | `media-url.functions.ts` + `media-server-authorization.server.ts`; **0 importadores na UI**; flag `VITE_APP_SCHEMA_A_MEDIA_URL` OFF; C2 aberto |
| 8 | Eventos / locais / negócios | **PRONTO (local/demo)** + **NÃO IMPL. (remoto)** | `src/lib/catalog/local-catalog.ts` (localStorage `connexy:demo:catalog`); adaptadores em `src/lib/adapters/schema-a/catalog.ts` sem repo/flag |

Notas de classificação:
- Conexões têm **RPCs reais** compatíveis com o Schema A (`send_connection_request`,
  `respond_to_connection_request`, `cancel_connection_request`, `find_pending_request_for_receiver`,
  `get_direct_conversation`, `get_nearby_profiles`) — o bloqueio é de **configuração/projeto**, não de
  domínio. A UI de descoberta mistura demo/mock com `useDiscovery` real.
- Notificações: existe uma rota e uma inbox **local-demo**; não há evidência de domínio remoto.
- As flags `VITE_APP_SCHEMA_A_*` **não** devem ser ativadas antes da validação do fluxo correspondente.

---

## 5. Bloqueios reais versus pendências não bloqueantes

**Bloqueios reais**
1. **Configuração/namespace Supabase** (§3.3): `SUPABASE_URL` fora de escopo + `APP_SUPABASE_*`
   ausente + divergência M2 no middleware. Bloqueia a validação de conexão e pode tornar o endpoint
   de mídia inoperante ou mirar o projeto errado.
2. **C2 / Storage** (SEG.): buckets `avatars`, `bio-media`, `reels-media` públicos com SELECT
   bucket-wide; URL assinada é portadora. Bloqueia declarar a entrega de mídia segura.
3. **Lacuna HTTP G4.2**: o endpoint `getPostMediaUrl` + `requireSupabaseAuth` nunca foi exercitado
   ponta-a-ponta (runtime TanStack Start indisponível sob `bun test`). Bloqueia confiar no transporte.
4. **Ausência de validação remota** do projeto autorizado (exige autorização separada).

**Pendências não bloqueantes (podem andar em paralelo)**
- Flags Schema A OFF (por design; não é bloqueio).
- Cadastro real (tela mock) — independente de mídia.
- Notificações remotas e catálogo remoto — novos domínios, não bloqueiam perfil/social/mídia.
- Sem rate limiting/cache no endpoint de mídia (hardening).
- Sem testes de rota para `auth.tsx`, `auth_.callback.tsx`, `route-guard.ts`, `sign-out.ts`.

---

## 6. Sequência otimizada de implementação

Os marcos abaixo são objetivos. A ordem proposta prioriza destravar o **wiring** antes de fiações de
UI, reaproveitando o que já existe. Cada etapa indica dependências e critério de conclusão.

### Marco A — Conexão validada (bloqueia todo o resto)
1. Reconciliar o namespace de ambiente (**exige autorização** — toca `.env`):
   definir `APP_SUPABASE_URL`/`APP_SUPABASE_PUBLISHABLE_KEY` espelhando o projeto autorizado e
   **remover/redirecionar** `SUPABASE_URL` fora de escopo; alinhar `SUPABASE_SERVICE_ROLE_KEY` só no
   ambiente confiável.
2. Corrigir M2: fazer `auth-middleware.ts` ler `APP_SUPABASE_* || VITE_APP_*` (paridade com
   `server.server.ts`/`media-url.functions.ts`).
3. Confirmar `project_ref` autorizado em runtime local e validar login/sessão reais.
- **Dependência:** autorização para editar env e (se necessário) `supabase start` local.
- **Conclusão:** login real + `requireSupabaseAuth` validados; nenhuma referência ativa ao projeto
  fora de escopo; teste de config verde.

### Marco B — Usuários e perfis funcionais
1. Decidir cadastro real: implementar `signUp` na tela `/cadastro` ou redirecionar para o fluxo real.
2. Ativar o cutover `VITE_APP_SCHEMA_A_AUTH` + `VITE_APP_SCHEMA_A_PROFILE` **após** validar cada fluxo.
3. Fiação de perfil remoto (`loadOwn`/`saveOwn`), persistência real e tratamento de falhas/permissões.
- **Dependência:** Marco A; trigger/RLS criando `profiles`/`profile_private` por `auth.uid`.
- **Conclusão:** cadastro/login reais e leitura+atualização de perfil persistindo no Supabase.

### Marco C — Social funcional
1. Conexões/solicitações sobre as RPCs reais (`/solicitacao/$id`, `/discover`, `/connecta`).
2. Publicações + privacidade via Schema A content (RLS `posts_select_privacy` + `posts_privacy_check`).
3. Notificações remotas (novo domínio) **ou** manter inbox demo explicitamente fora do escopo remoto.
- **Dependência:** Marco B; flags `VITE_APP_SCHEMA_A_SOCIAL`/`_CONTENT`.
- **Conclusão:** solicitar/aceitar/recusar conexões, publicar com privacidade e notificar, tudo real.

### Marco D — Conversas e conteúdo
1. Conversas/mensagens remotas (`VITE_APP_SCHEMA_A_CONVERSATIONS`) + realtime
   (`20260826000000_add_messages_to_realtime.sql`).
2. Recuperação/persistência de conteúdo e integração gradual com a UI.
- **Dependência:** Marco C; migração realtime aplicada no ambiente alvo.
- **Conclusão:** threads e mensagens persistindo e atualizando em tempo real.

### Trilha separada — Mídia (não deve bloquear B/C/D)
1. **G4.2:** teste HTTP ponta-a-ponta de `getPostMediaUrl`/`requireSupabaseAuth` contra stack local.
2. **C2 (SEG., exige autorização):** buckets privados + revogar SELECT bucket-wide + manter assinatura;
   reexecutar G3/G4 e comprovar bloqueio de acesso direto.
3. Só então conectar o endpoint à UI **atrás da flag** `VITE_APP_SCHEMA_A_MEDIA_URL`, com invalidação.

Justificativa da ordem: conexões, perfil e conversas têm domínio+testes prontos e só dependem do
wiring (Marco A). Notificações e catálogo remoto são greenfield e ficam por último para não
bloquear. Mídia é a única trilha com implicação de segurança e pode correr em paralelo.

---

## 7. Testes necessários e critérios de aceite por marco

- **Runner:** `bun test` (não há script em `package.json`; 121/121 testes importam `bun:test`; não há
  `vitest`/`jest`). Suíte completa é o gate nos marcos de integração; testes direcionados durante a
  implementação.
- **Segredos:** testes live leem env local; nunca imprimir chaves (`[LOCAL_SECRET_REDACTED]`).

| Marco | Testes direcionados | Critério de aceite |
| --- | --- | --- |
| A | novo teste de config/namespace + rota de login real; `tests/schema-a-auth-1h-14.test.ts` | login real validado; `requireSupabaseAuth` recusa token ausente/inválido; config aponta só ao projeto autorizado |
| B | `tests/schema-a-profile-1h-17.test.ts`, `tests/profile-update-patch.test.ts`, `tests/update-my-profile-mcp.test.ts` (+ live local) | cadastro real cria `profiles`/`profile_private`; ler/atualizar persiste; data URL não vai para `photo_url` |
| C | `tests/connections-repository-connected-at.test.ts`, `tests/schema-a-content-1h-21.test.ts`, `tests/schema-a-content-live-1h-22.test.ts`, `tests/schema-a-content-posts-1h-20.test.ts` | conexão só após aceite; privacidade PUBLIC/CONNECTIONS/PRIVATE respeitada pelo RLS; notificação gerada (se no escopo) |
| D | `tests/phase-9-conversations.test.ts`, `tests/chat-conversation-evolution.test.ts` (+ realtime) | mensagens persistem e chegam em tempo real; RLS por participante |
| Mídia (G4.2) | `tests/media-*.test.ts` + novo E2E HTTP do `getPostMediaUrl` | endpoint exercitado ponta-a-ponta; flag OFF ⇒ `unavailable`, 0 assinaturas |
| Mídia (C2) | `tests/media-server-authorization-live-g4.test.ts` + G3 | bucket não-público bloqueia acesso direto; assinatura só após autorização |

---

## 8. Arquivos que provavelmente serão alterados em fases futuras

**Marco A (config/wiring)**
- `.env` / `.env.local` (autorização explícita), `.env.example`
- `src/integrations/supabase/auth-middleware.ts` (paridade `APP_*`)
- Possivelmente `src/lib/supabase/config.ts`, `src/integrations/supabase/client.server.ts`

**Marco B (usuários/perfis)**
- `src/routes/cadastro.tsx`, `src/routes/auth.tsx`
- `src/lib/profile/use-own-profile.ts`, `src/lib/profile/schema-a-profile.ts`,
  `src/lib/profile/schema-a-profile-flag.ts`, `src/lib/auth/schema-a-auth-flag.ts`
- `src/routes/completar-perfil.tsx`, `src/routes/interesses.tsx`

**Marco C (social)**
- `src/routes/_app.solicitacao.$id.tsx`, `src/routes/_app/discover.tsx`,
  `src/routes/_app.connecta.tsx`
- `src/lib/social/schema-a-social.ts`, `src/lib/social/schema-a-social-flag.ts`
- `src/lib/content/schema-a-content.ts`, `src/lib/content/schema-a-content-flag.ts`
- `src/integrations/supabase/remote/content.repository.ts`
- (Notificações) novos módulos + eventual migração

**Marco D (conversas/conteúdo)**
- `src/hooks/api/use-chat.ts`, `src/components/chat/*`,
  `src/lib/chat/schema-a-conversations.ts`, `src/lib/chat/schema-a-conversations-flag.ts`

**Trilha mídia**
- `src/lib/media/media-url-flag.ts`, `src/lib/media/media-url.functions.ts`
- `src/integrations/supabase/auth-middleware.ts` (G4.2)
- Nova migração de buckets/policies (C2)
- Consumidores de feed/reel para fiar o endpoint

---

## 9. Operações que exigirão autorização explícita

- Editar `.env`/`.env.local` (reconciliar `APP_SUPABASE_*`, remover `SUPABASE_URL` fora de escopo).
- `supabase start` / preflight de recursos locais (rede Docker dedicada, perfil reduzido).
- Aplicar migrações locais; `db reset` **proibido**.
- Ativar qualquer flag `VITE_APP_SCHEMA_A_*`.
- C2: tornar buckets privados, revogar SELECT bucket-wide, ajustar policies.
- Qualquer operação remota: `link`, `pull`, `push`, SQL, buckets, deploy.
- G5 (não iniciar nesta fase).

---

## 10. Recomendação da próxima tarefa concreta

**Marco A — reconciliar o wiring de ambiente Supabase** (depende de autorização para editar `.env`):

1. Definir `APP_SUPABASE_URL`/`APP_SUPABASE_PUBLISHABLE_KEY` espelhando `rsukwuqocgjmwwuwtqaf`.
2. Remover/redirecionar `SUPABASE_URL` que aponta para `lzejdgfvtybarpbgwsyp` (fora de escopo).
3. Corrigir `auth-middleware.ts` para `APP_SUPABASE_* || VITE_APP_*` (fecha M2).
4. Validar login real + `requireSupabaseAuth` e rodar a suíte.

Tarefa **sem** necessidade de autorização remota, executável em paralelo: escrever o teste HTTP
ponta-a-ponta do `getPostMediaUrl`/`requireSupabaseAuth` (lacuna G4.2), que não altera código de
produção.

**Não** iniciar G5. **Não** declarar C2/Storage seguros. **Não** declarar conexão validada sem prova.

---

## 11. Escolha da ferramenta para as próximas fases

- **OpenCode** — recomendado para auditorias, diagnóstico, ajustes pequenos e isolados (ex.: wiring
  de env, paridade de middleware, teste G4.2, fiação de um fluxo por vez atrás de flag).
- **Codex** — apenas para mudanças arquiteturais ou integração complexa entre vários módulos
  simultâneos, quando o benefício justificar o custo (ex.: cutover amplo Schema A com múltiplos
  fluxos e migrações coordenadas).

Pare aqui. Aguardar revisão antes de implementar qualquer etapa seguinte.
