# Auditoria de Persistência Local — Connexy (Fase 1C-2)

- **Data:** 2026-09-11
- **Repositório:** `/home/ricardo/Documentos/Connexy/ConnexyApp`
- **Fases anteriores:** `docs/audits/persistence-baseline.md` (1C-0), `docs/audits/persistence-architecture.md` (1C-1)
- **Escopo:** migração-piloto controlada de **Conversas** e **Mensagens** do armazenamento atual para a camada Repository → IndexedDB. Nenhuma outra entidade foi migrada.

---

## 1. Estado anterior

Antes desta fase:

- **Conversas:** não existiam como entidade persistida. A lista de `/chat` era **derivada em React**: `MOCK_CONVERSATIONS` (estático, em código) + pessoas conectadas via `connexy:demo:db.connections` + grupos demo (`connexy:demo:db.groups`), com `lastMessage` calculada a partir das mensagens.
- **Mensagens:** persistidas como JSON dentro do blobo único `localStorage["connexy:demo:db"]` (`messages[]`), escrito por `demo-db.ts`. Em modo Supabase configurado, os fluxos reais via `ChatService`/`ChatRepository` (tabelas `conversations`, `conversation_participants`, `messages`) **não foram tocados** — continuam como estavam.
- Infraestrutura 1C-1 presente mas sem nenhuma entidade real consumindo (`LocalRepository`, `IndexedDbAdapter`, contrato `StorageAdapter`, serializer, erros).

---

## 2. Mapa das fontes de verdade

### Conversa (conversation thread)

- **React state:** `mockConversations` em `conversations-screen.tsx`; `participant`/`group` em `ConnexyChatScreen.tsx`.
- **localStorage:** não havia agregação de conversa; apenas conexões/grupos no blob demo (usados para derivar a lista).
- **mock:** `src/lib/chat/mock-conversations.ts` (`MOCK_CONVERSATIONS`), `people` (`mock-data.ts`).
- **Supabase:** `ChatRepository.getConversations` (modo real) — **inalterado**.
- **Nova fonte (após 1C-2):** store `conversations` (IndexedDB) via `ConversationRepository`, registrada em `connectUser` e atualizada a cada mensagem.

### Mensagem

- **React state:** `remoteMessages` (uso-chat, Supabase) / query `local-chat-messages` (modo demo).
- **localStorage:** `connexy:demo:db.messages` — **era** a fonte real de persistência demo.
- **mock:** mensagens estáticas em `MOCK_CONVERSATIONS` (apenas preview da lista); nenhum conteúdo de mensagem em mock exceto os textos de seed.
- **Supabase:** `ChatRepository.getMessages`/`sendMessage` (modo real) — **inalterado**.
- **Nova fonte (após 1C-2):** store `messages` (IndexedDB) via `MessageRepository`.

---

## 3. Alterações realizadas

| Arquivo | Mudança |
|---|---|
| `src/lib/persistence/types.ts` | `StoreDefinition.indexes[]`; `StorageAdapter.getAllByIndex()`; comentário de `RESERVED_COLLECTIONS` (conversas/mensagens agora ativas). |
| `src/lib/persistence/local/indexed-db.ts` | `applyUpgrade()` cria índices; implementa `getAllByIndex`. |
| `src/lib/persistence/local/local-repository.ts` | `adapter`/`serializer` passam de `private` para `protected` (para os repositories de domínio). |
| `src/lib/persistence/domain/chat-entities.ts` | **novo** — `StoredMessage`, `StoredConversation`, `StoredMessageKind`, `lastMessageKind`. |
| `src/lib/persistence/domain/chat-schema.ts` | **novo** — `chatPersistenceSchema` (v1, stores `conversations` + `messages`). |
| `src/repositories/message.repository.ts` | **novo** — `MessageRepository`. |
| `src/repositories/conversation.repository.ts` | **novo** — `ConversationRepository`. |
| `src/lib/chat/local-chat-persistence.ts` | **novo** — adapter/repositories singleton, cache síncrono, migração one-time, écritas, clear. |
| `src/lib/demo/demo-config.ts` | constante `DEMO_DB_EVENT`. |
| `src/lib/demo/demo-db.ts` | `DemoMessage` = alias de `StoredMessage`; funções de mensagem delegam ao `local-chat-persistence`; `connectUser` registra conversa; `resetDemoData` limpa stores locais. |
| `tests/persist-phase-1c-1.test.ts` | adapter fake passa a implementar `getAllByIndex` (contrato). |
| `tests/persist-phase-1c-2.test.ts` | **novo** — suíte 1C-2. |
| `docs/audits/persistence-architecture.md`, `docs/audits/persistence-phase-1c-2.md` | documentação. |

Nenhuma rota, componente, layout, texto, ícone, navegação, animação ou CSS foi alterado.

---

## 4. Modelo das entidades

`StoredMessage`:
- `id`, `conversationId` (relacionamento), `from` ("me"/"them"), `senderId?`, `senderName?`, `text`, `at` (epoch ms), `kind?` (text/event/location/image/video), `payload?`.

`StoredConversation`:
- `id`, `createdAt`, `updatedAt`, `lastMessageText`, `lastMessageType`.

Nenhum campo especulativo. Tipos compatíveis com os usados pela UI (o antigo `DemoMessage` virou alias de `StoredMessage`).

---

## 5. Stores

Banco **novo** `connexy-app-local-db` v1, independente de `connexy-reels-local-db`. Criadas apenas:

- `conversations` (keyPath `id`)
- `messages` (keyPath `id`)

A store `media` (Reels) não foi migrada.

## 6. Índices

- `messages.by_conversation` → `conversationId`. Ordenação por `at` na camada de domínio (`MessageRepository.listByConversation`).
- `conversations`: nenhum índice extra (ordenação em memória; volume local pequeno).

---

## 7. Repositories

- `MessageRepository extends LocalRepository<StoredMessage>` — `listByConversation`, `lastInConversation`.
- `ConversationRepository extends LocalRepository<StoredConversation>` — `ensureExists`, `applyLastMessage`, `listOrderedByUpdatedAt`.
- Domínio desacoplado: `LocalRepository`/`IndexedDbAdapter` não conhecem Conversa/Mensagem/UI.

---

## 8. Migração

- Existe fonte legada real (`connexy:demo:db.messages`).
- Migração **one-time idempotente** em `ensureLocalChatLoaded()`:
  1. lê `connexy:demo:db.messages`;
  2. se a store `messages` está vazia, grava apenas ids ainda inexistentes;
  3. preserva o blob original.
- Cache síncrono faz bootstrap do legado e é reconciliado com o IndexedDB ao concluir o load (evento de refresh dispara nova leitura).
- **Nenhuma chave de localStorage foi removida.** `connexy:demo:db` continua gravando conexões/solicitações/grupos; `messages[]` legado fica vestigial (preservado, sem novos escritos).

---

## 9. Testes

`tests/persist-phase-1c-2.test.ts` cobre:

- **ConversationRepository:** criar (`ensureExists`), obter, listar, atualizar, excluir, inexistente (null/NOT_FOUND), `applyLastMessage`, `listOrderedByUpdatedAt`, idempotência de `ensureExists`.
- **MessageRepository:** criar, obter, listar por conversa (ordem cronológica), `lastInConversation`, atualizar, excluir, inexistente.
- **Relacionamento:** mensagens da conversa correta; não vazam para outra; índice correto.
- **Persistência / reload conceitual:** dados sobrevivem a nova instância de adapter/repository; ciclo salvar → destruir → recriar → recuperar.
- **Integridade:** ids/conversationId preservados.
- **Erros:** falhas de `put`/`getAllByIndex` do adapter propagam `PersistenceError` identificável; `update` inexistente → `NOT_FOUND`.
- **Isolamento:** schema só tem `conversations`/`messages`; banco não é o de Reels; conversas não gravam em `messages`.

Resultado: **55 testes** (26 anteriores + 29 novos) — **0 falhas**.

---

## 10. Validações

- `bunx tsc --noEmit` — **0 erros** (baseline já era 0).
- `bun run build` — **ok**.
- `bun lint` — **503 problemas (483 erros, 20 avisos)** — idêntico ao baseline (1C-1: 483). **Nenhum problema novo**; os arquivos novos estão limpos.
- `bun test` — 55 pass / 0 fail.

---

## 11. Problemas encontrados

- Fonte de verdade de conversas era **derivada**, não persistida — não havia registro de conversa para "migrar"; foi criado o agregado e começamos a registrá-lo nos pontos reais (conexão + envio).
- Fonte única de mensagens demo convivia num blobo único (`connexy:demo:db`) com conexões/solicitações/grupos — a separação preservou o blobo (outros usos) e desviou apenas mensagens para IndexedDB.
- Blob único impedia remover a chave inteira com segurança (mantida).

## 12. Limitações

- Lista de conversas continua sendo derivada para apresentação; o `ConversationRepository` é a persistência do agregado (não a fonte de renderização da lista).
- `muted`/`pinned`/`unreadCount` permanecem como estado de UI/derivação (não persistidos nesta fase).
- Cache síncrono (janela curta entre bootstrap do legado e reconciliação com IDB).
- Sem sincronização entre abas / offline queue / Realtime (fora de escopo).
- Erros de escrita em IndexedDB são logados no console e não quebram a UI (paridade com o comportamento tolerante anterior do localStorage), enquanto os repositories/adapter continuam propagando `PersistenceError`.
- Isolamento por usuário: como o modo demo local é single-store e o fluxo real usa RLS/Supabase, não foi introduzida segmentação por usuário; a segmentação por usuário permanece no fluxo Supabase (inalterado).

## 13. Riscos restantes

- Compatibilidade do cache com o fluxo real: apenas modo demo usa o cache; modo Supabase segue via `ChatService` (intocado) — risco nulo nesta fase.
- Migração one-time depende da store vazia; se o banco for limpo pelo usuário com legado ainda presente, a migração re-executa (idempotente).
- A store `conversations` e a store `messages` não têm particionamento por usuário — seguro apenas enquanto o cliente local é single-user (demo) ou o fluxo real continua em Supabase.

## 14. Próxima etapa

Ver `docs/audits/persistence-architecture.md` → seção Fase 1C-2 e recomendação no relatório final. Sugestão: **Posts de perfil / feed demo** ou **curtidas e comentários de Reels** — entidades com persistência local própria e baixo acoplamento visual, aptas a validar o mesmo contrato em outro domínio.