# 1H-19 — Cutover Conversations/Messages

- **Data:** 2026-09-25
- **Tipo:** cutover controlado **somente de Conversations / Participants / Messages**, com rollback por flag.
- **Herdado:** 1H-8 contrato, 1H-9 RLS, 1H-11 remote repositories, 1H-12 adapters, 1H-13 plano, 1H-14 Auth, 1H-18 Social.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT** (padrão)
- **DUAL-WRITE / SYNC:** **não**
- **SCHEMA A / RLS / migrations:** **inalterados**

---

## 1. Flag

```text
VITE_APP_SCHEMA_A_CONVERSATIONS=true
```

Default: **off**.

```text
isRemoteConversationsEnabled =
  isRemoteAuthEnabled()                 // demo off + VITE_APP_SCHEMA_A_AUTH + supabase configurado
  && VITE_APP_SCHEMA_A_CONVERSATIONS === "true"
```

Demo **vence**. Flag off restaura IndexedDB/`demo-db` imediatamente. IndexedDB **não** é apagado. Postgres **não** é apagado.

---

## 2. Fluxo Demo (padrão)

```text
getDemoIdentity() + IndexedDB (local-chat-persistence) + connexy:demo:db
```

Lista funcional, pin por `pinnedByUserIds`, unread local, gestos e grupos continuam. **networkCalls = 0**.

`ChatRepository` / `ChatService` **não** são o caminho Demo.

---

## 3. Fluxo Remote (Auth + Conversations)

```text
Auth UUID
  → RemoteConversationRepository (1H-11)
  → adapter 1H-12 (toDomainMessage / toDomainParticipant / derivedUnread)
  → UI Chat existente
```

| Papel | ID |
| --- | --- |
| `created_by` | Auth UUID |
| participantes | Auth UUID explícitos |
| `sender_id` | Auth UUID da sessão (nunca o UUID passado pela UI) |

O caminho remoto **não** chama `getDemoIdentity(`. **Não** converte `lucas` / `demo-direct-*`. **Não** reutiliza `ChatRepository`.

Conversation nasce só por `createDirect` (botão Conversar no perfil, quando a flag está on). **Não** nasce no accept de Connection.

---

## 4. Conversation / Participants / Messages

| Entidade | Persistência remota | UI |
| --- | --- | --- |
| Conversation | `conversations` | lista `/chat`, thread `/chat/$id` |
| Participants | `conversation_participants` | pin, `last_read_at`, peer |
| Messages | `messages.text` + `kind` | `useChat` Schema A |

- Participantes são inseridos explicitamente no `createDirect` (self + peer, `accepted`).
- `pinned` e `last_read_at` vivem no participante.
- Unread = `derivedUnread(last_message_at, last_read_at)`. **Nunca** `message.isUnread`.
- Sender do insert = `auth.uid()` no repository 1H-11.

---

## 5. Pin / unread / `last_read_at`

| Ação | Efeito |
| --- | --- |
| A fixa | só a linha de A |
| B recarrega | pin de B inalterado |
| A envia | A faz `markRead` no próprio cursor |
| B lê a thread | `markRead` de B; cursor de A intacto |

Preview `last_message_*` continua atualizável só pelo `created_by` (limitação 1H-11). SoT de unread/mensagens = tabela `messages`. Documentado, **não** corrigido com policy nova.

---

## 6. Relação Social → Chat

1H-18 permanece: accept de Connection **não** cria Conversation (`conversation_id` null).

Live 1H-19: A request → B accept → `listThreads()` de A é `[]` → só depois `createDirect` nasce o DM.

Social **não** foi alterado nesta fase.

---

## 7. RLS (policies 1H-9)

| Recurso | Regra |
| --- | --- |
| `conversations` | select membro; insert criador |
| `conversation_participants` | select membro; update self (pin / `last_read_at`) |
| `messages` | select accepted; insert sender = uid e membro accepted |

Live (3 Auth users): C não obtém a thread A–B nem as mensagens. Pin e `last_read_at` isolados.

---

## 8. Rollback

Flag off → `isRemoteConversationsEnabled() === false` → `useChat` / lista voltam ao IndexedDB.

Sem dual-write. Sem sync. Sem copiar IndexedDB → Postgres.

---

## 9. Incompatibilidades (não remodeladas)

| Superfície | Motivo | Decisão |
| --- | --- | --- |
| `ChatRepository` + `content` vs `text` | stubs `types.ts` | **não** reutilizado no Remote |
| Realtime `postgres_changes` | stack local sem Realtime | Remote carrega no mount; sem WebSocket |
| Mídia / share / data URL | Storage ainda não no Chat | `sendMedia` / `sendSharedContent` só Demo |
| `senderName`, `from`, `unreadCount` persistidos | derivados | calculados na UI |
| Preview `last_message_*` stale para o peer | só `created_by` UPDATE | documentado (1H-11/1H-13) |
| Nome/foto do peer | Profile de terceiros ainda Demo | placeholder `"Conversa"` |
| Grupos demo / convites / videocall | Demo / sem WebRTC | intactos no Demo; não remotos |
| Threads `demo-direct-*` | ids ilegais | **não** importados |

---

## 10. Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/lib/chat/schema-a-conversations-flag.ts` | flag de domínio |
| `src/lib/chat/schema-a-conversations.ts` | gateway Auth UUID → repo → adapter |
| `src/hooks/api/use-chat.ts` | Demo **ou** Schema A **ou** legado `ChatService` |
| `src/components/chat/conversations-screen.tsx` | lista + pin remotos |
| `src/components/chat/ConnexyChatScreen.tsx` | thread + pin remotos |
| `src/components/chat/conversation-invite-button.tsx` | `createDirect` / abrir DM |
| `tests/schema-a-conversations-1h-19.test.ts` | unit |
| `tests/schema-a-conversations-live-1h-19.test.ts` | live local |

**Não alterados:** Schema A SQL, Auth, Profile, Social, Agora, Catalog, Reservations, Carona, Saves, `ChatRepository`, adapters, remote repositories.

---

## 11. Validação

| Check | Resultado |
| --- | --- |
| Unit 1H-19 | **13 pass** |
| Live 1H-19 | **1 pass** |
| `bun test` | **452 pass / 0 fail / 2666 expect / 64 files** |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline** |
| Demo `networkCalls` | **0** |

---

## 12. PASS / FAIL

| Critério | |
| --- | --- |
| Chat Remote funciona | **SIM** |
| Demo Chat intacto | **SIM** |
| Participantes explícitos | **SIM** |
| Unread derivado | **SIM** |
| Pin por participante | **SIM** |
| RLS efetivo | **SIM** |
| Sender = Auth UUID | **SIM** |
| Connection não cria Conversation | **SIM** |
| Outros domínios cortados | **não** |
| Dual-write / sync | **NÃO** |
| Schema A inalterado | **SIM** |

**STATUS: PASS**
