# RELATÓRIO — FASE 10: PERFIL E IDENTIDADE DA CONEXÃO

## A. Resumo executivo

Auditoria concluída sobre **perfil avaliador**, **identidade da pessoa** e **estados de
conexão** no modo demo. A maior parte do fluxo está correta e compartilha uma única fonte para
perfil (`findPerson` → `listPeople()`, inclui elenco demo), navegação
(`getDiscoverItemNavigation` → `/perfil/$id`) e compatibilidade (`mock-data`), sem rotas
duplicadas. Foram encontrados **3 defeitos reais validados por repro**: identidade estática no
perfil, convite recebido não reconhecido no CTA e solicitação duplicada no sentido inverso.
Todos corrigidos de forma cirúrgica; **1 guarda de consistência** adicionada no roteador.

Baseline preservado e elevado:

- `bun test` → **845 pass / 0 fail / 4751 expect / 94 arquivos**
  (antes: 838 pass / 0 fail / 4724 expect / 93 arquivos; +7 testes da Fase 10)
- `bunx tsc --noEmit` → exit 0
- `git diff --check` → exit 0

## B. Problemas reais encontrados e correções aplicadas

### FIX 1 — Perfil usava identidade estática para decidir "próprio perfil"
- **Arquivo**: `src/routes/_app.perfil.$id.tsx`
- **Sintoma**: `isOwnProfile = person.id === currentUser.id` comparava com o usuário fixo
  `lucas`. Ao trocar a identidade demo para `beatriz` (seletor "Simulação demo"), o perfil
  `/perfil/beatriz` não era reconhecido como próprio e exibia o CTA "Connexy" → `sendRequest(id, id)`
  lançava *"Remetente e destinatário da solicitação são inválidos."* (bug reproduzido e validado no
  domínio). Inversamente, `/perfil/lucas` escondia o CTA mesmo com outra identidade ativa.
- **Correção**: `const isOwnProfile = person.id === (user?.id ?? getDemoIdentity().id)` —
  usa a sessão autenticada (emo demo reflete a identidade ativa; em prod, o UUID do usuário), com
  `getDemoIdentity()` como fallback.

### FIX 2 — CTA de conexão não reconhecia convite recebido pendente
- **Arquivo**: `src/components/chat/conversation-invite-button.tsx`
- **Sintoma**: com a solicitação pendente semeada `demo_user_rafael → viewer`, o botão (usado em
  perfil, pessoas, connecta e home) exibia "Connexy" → enviava solicitação no sentido inverso em vez
  de responder, criando 2 pendentes mútuas.
- **Correção**: novo estado `"incoming"` via `useDemoPendingRequests(user?.id)`, rótulo
  **"Responder convite"** e navegação `mode: "receive"` (mantido o padrão "Convite enviado" /
  conexão para "Conversar" → `getConnectionBetween` → `/chat/$conversationId`).

### FIX 3 — Solicitação duplicada ao entrar com `mode=send` quando já existe pendente recebida
- **Arquivo**: `src/routes/_app.solicitacao.$id.tsx`
- **Sintoma**: `status` só derivava `"receive"` quando `mode === "receive"`. Qualquer entrada via
  `mode=send` (PeopleListCard, Reels) com pendente já recebida mostrava "Enviar solicitação",
  criando uma segunda pendente no sentido inverso (estado inconsistente que aceitar quebrava).
- **Correção**: a pendente recebida agora vence o modo (`demo && incomingRequest ? "receive"`),
  e a mensagem exibida passa a ser a da pessoa (`demo && incomingRequest ? incomingRequest :
  outgoingRequest`), independentemente do `mode`.

### FIX 4 (guarda de consistência) — Identidade ativa resolve para o próprio perfil
- **Arquivo**: `src/routes/_app.perfil.$id.tsx` (loader)
- **Sintoma**: a identidade do usuário (`lucas`) não está em `listPeople()`. Publicações próprias
  (composer demo) geram card em "Acontecendo agora" que navega a `/perfil/lucas` →
  "Perfil não encontrado."
- **Correção**: `if (isDemoMode() && params.id === getDemoIdentity().id) throw redirect({ to: "/perfil" })`
  — não cria rota nova nem dados inventados: reaproveita o roteiro único de perfil próprio.

## C. Arquivos alterados e criados (Fase 10)

Alterados (em cima de modificações pré-existentes da branch; apenas os trechos da Fase 10):

- `src/routes/_app.perfil.$id.tsx` — FIX 1 (isOwnProfile) + FIX 4 (redirect identidade ativa)
- `src/components/chat/conversation-invite-button.tsx` — FIX 2 (estado "incoming" + guarda de auto)
- `src/routes/_app.solicitacao.$id.tsx` — FIX 3 (pendente recebida vence o mode)

Criado:

- `tests/phase-10-profile-identity.test.ts` — 7 testes (4 escaneamento de fonte + 3 de domínio)

Preservados (integralmente, conferidos antes e depois): correções da Fase 9
(`functional-conversation-list.ts`, `people`→`listPeople()`, `tests/phase-9-conversations.test.ts`)
e todas as 130 alterações pré-existentes do working tree.

## D. Validação e preservação do baseline

| Verificação | Antes (Fase 9) | Depois (Fase 10) |
| --- | --- | --- |
| `bun test` | 838 pass / 0 fail / 4724 expect / 93 | 845 pass / 0 fail / 4751 expect / 94 |
| `bunx tsc --noEmit` | exit 0 | exit 0 |
| `git diff --check` | exit 0 | exit 0 |
| Conjunto Fase 10 (7 testes) | — | 7 pass / 0 fail |

Testes da Fase 10 reproduziram as falhas **antes** das correções (4 falhas) e passam apenas
depois delas, validando comportamento no domínio (`sendRequest`, `isConnected`,
`getIncomingPendingRequest`, conversationId canônico `demo-direct-{a}--{b}`) e inspeção de fonte
(rotas únicas, ausência de `demo-direct-` e de `latitude/longitude` no perfil, preservação de
`getConnectionBetween` + `/chat/$conversationId`, `mode="invite"` na assistente IA e
`mode="conversations"` no chat de conversas).

## E. Observações de design confirmadas (sem correção necessária)

- **Fonte única do perfil avaliador**: `findPerson(params.id) ?? enginePersonById(params.id)` com
  fallback Supabase apenas para UUID + configurado; `findPerson` usa `listPeople()` (fixtures + elenco
  demo). Perfil e solicitação usam a mesma fonte.
- **Navegação Discovery→Perfil**: `getDiscoverItemNavigation` é a função consolidada usada por
  `PeopleListCard` e `discover.tsx`; `targetId` presente em todos os itens "pessoas".
- **Compatibilidade**: `commonGround`, `sharedInterestPercent` e `compatibilityScore` vêm todos de
  `mock-data` — mesma origem entre Discovery e Perfil; perfil não exibe score de compatibilidade,
  logo não há divergência de apresentação.
- **Distância**: `formatPersonDistance` é o helper único e o perfil não possui coordenadas.
- **Conversação**: `directConversationId` segue a fórmula canônica; chat usa o mesmo conversationId.
- **Estado do perfil próprio**: rota única `/perfil` (índice) mantida; nenhuma segunda rota criada.
- **CTA self**: `ConversationInviteButton` agora retorna `null` quando `user.id === personId`
  (mesmo padrão do `ProfileFollowButton`, que usa `useAuth().user.id` refletindo a identidade ativa).

## F. Pendências identificadas (fora do escopo / sugeridas para próxima fase)

1. **Autoria estática de publicações demo**: `create-post.tsx` grava `authorId: currentUser.id`
   mesmo com identidade ativa trocada; card em "Acontecendo agora" aponta para `/perfil/lucas`.
   O redirect do FIX 4 cobre o fluxo com identidade `lucas`; com outra identidade, ajustar `authorId`
   para `getDemoIdentity().id` (escopo de Feed/Criação de postagem).
2. **"Amigos em comum" / "Atividade compartilhada" / estatísticas e `displayPlaces`** no perfil
   avaliador são conteúdo fabricado no catálogo (12 amigos, 3 linhas de atividade) — não diverge
   entre telas (mesma fonte), mas não reflete grafo real.
3. **`sharedFriends` e `commonGround`** são calculados contra o `currentUser` estático; com
   identidade trocada os "interesses em comum" não refletem a identidade ativa (mesma fonte da
   Discovery, apenas coerente com o usuário fixo).
4. **Self-CTA em `/pessoas`, feed e Reels**: coberto pelo guarda único do botão compartilhado, mas
   não há teste end-to-end de UI para esses pontos de entrada.

## G. Conclusão

A **FASE 10 — Perfil e Identidade da Conexão** está **CONCLUÍDA**. Auditoria executada sem alterar o
que estava correto; 3 defeitos reais corrigidos de forma cirúrgica (identidade ativa, estado de
convite recebido e duplicação de solicitação) e 1 guarda de consistência adicionada; baseline
preservado (845 testes, tsc 0, diff --check 0). Nenhum commit foi criado.