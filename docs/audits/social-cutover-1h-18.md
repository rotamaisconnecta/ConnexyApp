# 1H-18 — Cutover Social

- **Data:** 2026-09-25
- **Tipo:** cutover controlado **somente de Social**, com rollback por flag.
- **Herdado:** 1H-8 contrato, 1H-9 RLS, 1H-11 remote repositories, 1H-12 adapters, 1H-13 plano, 1H-14 Auth, 1H-17 Profile.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT** (padrão)
- **DUAL-WRITE / SYNC:** **não**
- **SCHEMA A / RLS / migrations:** **inalterados**

---

## 1. Flag

```text
VITE_APP_SCHEMA_A_SOCIAL=true
```

Default: **off**.

```text
isRemoteSocialEnabled =
  isRemoteAuthEnabled()          // demo off + VITE_APP_SCHEMA_A_AUTH + supabase configurado
  && VITE_APP_SCHEMA_A_SOCIAL === "true"
```

Demo **vence**. Desligar a flag (ou ligar `VITE_APP_DEMO_MODE`) restaura o Social Demo imediatamente. localStorage/IndexedDB **não** são apagados. Relações remotas **não** são apagadas.

---

## 2. Fluxo Demo (padrão)

```text
getDemoIdentity() + connexy:demo:db
  → toggleFollow / sendRequest(message) / acceptRequest / declineRequest
```

`acceptRequest` Demo **continua** a chamar `ensureLocalConversation` (comportamento local intacto). **networkCalls = 0**.

---

## 3. Fluxo Remote (só com Auth + Social)

```text
Auth UUID
  → RemoteSocialRepository (1H-11)
  → adapter 1H-12 (toDomainFollow / toDomainConnectionRequest / toDomainConnection)
  → UI Social existente
```

| Papel | ID |
| --- | --- |
| requester / from_user_id | Auth UUID |
| target / to_user_id | Auth UUID |
| follower / followee | Auth UUID |
| connection participants | Auth UUID (`canonicalUserPair`) |

O caminho remoto **não** chama `getDemoIdentity(`. **Não** converte `lucas` (ou outro id demo) para UUID.

---

## 4. Follow ≠ Request ≠ Connection

| Conceito | Tabela | UI ligada |
| --- | --- | --- |
| Follow | `follows` | `/perfil/$id` Seguir/Seguindo (alvo UUID) |
| ConnectionRequest | `connection_requests` | `/solicitacao/$id` enviar / aceitar / recusar |
| Connection | `connections` | estado `connected` após accept |

Não transformações:

- Follow **não** vira Connection
- Request **não** vira Conversation
- Connection **não** vira Conversation

`RemoteSocialRepository.acceptRequest` faz upsert de Connection e **não** cria Conversation. `conversation_id` permanece `null`.

---

## 5. `request.message`

Schema A 1H-9 **não tem** coluna de mensagem em `connection_requests`.

| Caminho | Comportamento |
| --- | --- |
| Demo | mensagem obrigatória; persistida em `connexy:demo:db` |
| Remote | campo **ignorado**; adapter devolve `message: null`; textarea oculto |

Nenhuma coluna nova. Nenhuma migration.

---

## 6. Grafo Demo **não migrado**

Não há import automático de follows, requests, connections ou IDs demo.

O utilizador remoto começa **sem relações**, salvo ações no caminho remoto ou o par Profile criado pelo trigger de Auth.

Alvos `lucas` / `beatriz` / outros ids não-UUID **são recusados** (`requireSchemaAUuid`).

---

## 7. Superfícies ligadas

| Superfície | Remote |
| --- | --- |
| `/perfil/$id` follow/unfollow | sim, se o alvo for UUID |
| `/solicitacao/$id` send / accept / decline / connected | sim, se o alvo for UUID |
| Aceitar | navega para `/perfil/$id`, **não** para Chat |
| Chat / Conversations | **não** ligado |
| Reels / Agora follow-connect | **não** ligado |
| Carona `connectUser` | **não** ligado |
| Inbox de notificações | **não** ligado |

---

## 8. RLS (policies 1H-9, sem bypass)

| Recurso | Regra usada |
| --- | --- |
| `follows` | insert/delete só `follower_id = auth.uid()`; select autenticado |
| `connection_requests` | insert só `from_user_id`; select/update só as partes |
| `connections` | select/insert só participantes; update limitado a `conversation_id` |

Validação live local (3 Auth users):

- A segue/deixa de seguir B
- A envia request a B; C **não** lê o request (RLS → `null`)
- C **não** aceita o request de A→B (`NOT_FOUND` por isolamento)
- B aceita; Connection persistida com `conversation_id = null`
- `listMine()` de Conversations de A e B permanece `[]`
- C **não** lista a Connection A–B
- C recusa request de A; Connection A–C **não** é criada

Sem service role no frontend. Sem `USING (true)` novo.

---

## 9. Rollback

Flag off → `isRemoteSocialEnabled() === false` → UI usa `demo-db`.

Não apaga localStorage/IndexedDB. Não apaga relações remotas. Sem dual-write. Sem sync.

---

## 10. Incompatibilidades (não remodeladas)

| Superfície | Motivo | Decisão |
| --- | --- | --- |
| Peer name/foto em `/solicitacao/$id` remoto | Profile de terceiros ainda é Demo/mock | placeholder `"Pessoa"` se não houver mock; **não** cortar Profile alheio |
| Alvos demo (`lucas`, …) | ids não são UUID | recusados no Remote; permanecem no Demo |
| Reels follow/connect, Chat `isConnected`, Carona, inbox | outros domínios | **não** ligados nesta fase |
| Copy Demo “Aceitar e conversar” | Demo ainda cria conversa local | texto Remote: “Aceitar conexão”; Demo intacto |
| `ConnectionsService` legado | stubs `types.ts` | só corre se Remote **e** Demo estão off e supabase público está configurado (caminho pré-cutover) |

---

## 11. Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/lib/social/schema-a-social-flag.ts` | flag de domínio |
| `src/lib/social/schema-a-social.ts` | gateway Auth UUID → repo → adapter |
| `src/lib/social/use-remote-follow.ts` | follow remoto na ficha |
| `src/routes/_app.perfil.$id.tsx` | follow Demo **ou** Remote |
| `src/routes/_app.solicitacao.$id.tsx` | request/accept/decline Demo **ou** Remote |
| `tests/schema-a-social-1h-18.test.ts` | unit |
| `tests/schema-a-social-live-1h-18.test.ts` | live local |

**Não alterados:** Schema A SQL, Auth 1H-14, Storage 1H-15, Profile 1H-17 (gateway), remote repositories, adapters, Conversations/Messages, Agora, Catalog, Reservations, Carona, Saves, `demo-db`.

---

## 12. Validação

| Check | Resultado |
| --- | --- |
| Unit 1H-18 | **15 pass** (Demo, UUID, follow/unfollow, request, accept sem conversa, decline, outsider, rollback/zero calls, isolamento de outros domínios) |
| Live 1H-18 | **1 pass** (Postgres local: follow/unfollow, request, accept, decline, RLS, `conversation_id` null, Conversations `[]`) |
| `bun test` | **438 pass / 0 fail / 2606 expect / 62 files** |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline** |
| Demo `networkCalls` | **0** (flag off + demo vence) |

Primeira passagem da suíte completa falhou em `1H-12 adapters — isolation` porque `/solicitacao/$id` importava `lib/adapters/schema-a/ids`. Corrigido para `canRemoteSocialTarget` no gateway Social. A rota **não** importa adapters.

---

## 13. PASS / FAIL

| Critério | |
| --- | --- |
| Social Remote funciona | **SIM** (gateway + live) |
| Demo Social intacto | **SIM** (padrão) |
| Follow ≠ Request ≠ Connection | **SIM** |
| Connection não cria Conversation | **SIM** |
| Identidade remota = Auth UUID | **SIM** |
| RLS efetivo | **SIM** |
| Rollback por flag | **SIM** |
| Grafo demo migrado | **NÃO** |
| Outros domínios cortados | **não** |
| Dual-write / sync | **NÃO** |
| Schema A inalterado | **SIM** |

**STATUS: PASS**
