# 1H-11 — Remote Repositories / Schema A

- **Data:** 2026-09-25
- **Tipo:** camada de acesso remoto Schema A. Sem cutover. Sem Commerce B.
- **Contrato de domínio:** `docs/audits/remote-schema-contract-1h-8.md` (não modificado)
- **Tipos técnicos:** `supabase/schema-a.generated.ts` (não modificado)
- **SQL / RLS / migrations:** **UNCHANGED**
- **Cutover:** **NOT STARTED**
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT**

Nenhuma tela, rota, store local, `ChatRepository`, `src/integrations/supabase/types.ts` ou `getDemoIdentity()` passou a usar o acesso remoto.

---

## 1. Objetivo

Expor as 20 tabelas do Schema A via **Remote Repositories** agrupados por domínio, tipados no dump gerado, invocáveis só quando chamados explicitamente. O MVP demo continua em localStorage + IndexedDB.

```text
             DOMAIN
                │
       ┌────────┴────────┐
       │                 │
     LOCAL             REMOTE
       │                 │
localStorage/IDB     Supabase (Schema A)
```

---

## 2. Auditoria (somente leitura)

| Item | Resultado |
| --- | --- |
| Repositories locais (IDB) | `src/repositories/{conversation,message,reel,reel-like,reel-comment}.repository.ts` — **não alterados** |
| Stubs legado | `chat.repository.ts`, `connections.repository.ts`, `feed.repository.ts` — **não reutilizados** |
| `src/integrations/supabase/types.ts` | esqueleto Lovable de 6 tabelas — **não substituído** |
| Client vivo da UI | `src/integrations/supabase/client.ts` (Proxy + `types.ts`) — **não alterado** |
| Demo identity | `getDemoIdentity()` — **não substituída** |
| Gate de rede do demo | `isPublicSupabaseConfigured()` continua `false` em `VITE_APP_DEMO_MODE` |
| Dump gerado | `supabase/schema-a.generated.ts` — fonte técnica |
| Adapters existentes | nenhum adapter Schema A; não havia camada `integrations/supabase/remote/` |

Reutilização neutra: `@supabase/supabase-js` `createClient` (injeção). Nada de ChatRepository, RPCs 13B1 (`send_connection_request`, `respond_to_connection_request`) ou `MOCK_*`.

---

## 3. Repositories criados

Diretório: `src/integrations/supabase/remote/`

| Repository | Arquivo | Tabelas Schema A |
| --- | --- | --- |
| `RemoteProfileRepository` | `profile.repository.ts` | `profiles`, `profile_private` |
| `RemoteSocialRepository` | `social.repository.ts` | `follows`, `connection_requests`, `connections` |
| `RemoteConversationRepository` | `conversation.repository.ts` | `conversations`, `conversation_participants`, `messages` |
| `RemoteContentRepository` | `content.repository.ts` | `posts`, `reels`, `reel_likes`, `reel_comments` |
| `RemoteCatalogRepository` | `catalog.repository.ts` | `businesses`, `places`, `events`, `offers` |
| `RemoteReservationRepository` | `reservation.repository.ts` | `reservations` |
| `RemoteCaronaRepository` | `carona.repository.ts` | `carona_offers`, `carona_requests` |
| `RemoteSaveRepository` | `save.repository.ts` | `saves` |

Infra compartilhada:

```text
client.ts       createSchemaAClient + requireAuthUserId (Supabase Auth ≠ demo identity)
errors.ts       RemoteRepositoryError (AUTH, RLS, NOT_FOUND, UNIQUE, CHECK, FOREIGN_KEY, VALIDATION, NETWORK)
result.ts       unwrap sem converter falha em []/null/success
canonical.ts    par user_a_id < user_b_id
types.ts        aliases Row/Update a partir do dump
index.ts        API pública da camada
```

**20/20 tabelas do Schema A.** Sem Product, Service, Order, Payment, Cart, Delivery, Inventory.

---

## 4. Generated types

Importados de `supabase/schema-a.generated.ts` (não editado).

`tsconfig.json` passou a incluir o dump para o typecheck resolver o import. O cliente vivo da UI continua em `src/integrations/supabase/types.ts`.

Unions de domínio (`pending|accepted|declined`, `PUBLIC|CONNECTIONS|PRIVATE`, target_type de saves, etc.) estão nos CHECK SQL; o gerador as expõe como `string`. Os repositories validam os valores do contrato 1H-8 / 1H-9, não o enum PG órfão (`rejected`/`canceled` em `connection_request_status`).

---

## 5. Identity

```text
Demo Identity (getDemoIdentity)  ≠  Supabase Auth (client.auth.getUser)
```

Repositories remotos exigem JWT via `requireAuthUserId`. Não há sistema novo de identidade. Testes live criam users no GoTrue **local** e fazem `signInWithPassword`. Segredos do `supabase status` não foram gravados em arquivos rastreados.

---

## 6. Regras de domínio respeitadas

| Regra | Como |
| --- | --- |
| Identity → Profile → Profile Private | tabelas distintas; private owner-only |
| Follow ≠ Request ≠ Connection | três tabelas; follow não cria conversation |
| Aceite de Request não cria Conversation | `acceptRequest` upserta Connection com `conversation_id` null |
| Participantes explícitos | insert em `conversation_participants` |
| pin / last_read_at no participante | colunas do participante; **sem** `message.isUnread` |
| Agora = produto / Reel = técnico | tabelas `reels` / likes / comments; sem upload de mídia |
| Business ≠ Place; Offer → Business | Offer recusa business inexistente (FK) |
| Event ≠ Ticket | Event sem ticketing |
| Reservation estados Schema A | insert sempre `pending`; sem auto-confirm demo |
| Carona sem GPS/Dispatcher/Trip/Payment | offers + requests; accept decrementa assentos |
| Saves polimórfico do A | `business\|place\|event\|offer\|reel\|post` |

Carona **não** orquestra Connection + Conversation no accept (efeito 1H-8 de aplicação). `linkConversation` existe para o passo explícito. Connection social também não cria conversa.

---

## 7. Error handling

Erros PostgREST/Auth **não** são engolidos. `RemoteRepositoryError` preserva a mensagem do Supabase. SELECT vazio por RLS (linha invisível) devolve `null` / `[]` — comportamento do Postgres, não mascaramento de 42501. INSERT/UPDATE que violam policy sobem como `RLS`.

---

## 8. Network / cutover

- Repositories só falam com o Supabase quando instanciados e chamados.
- UI, rotas, hooks, providers e `src/services` **não** importam `integrations/supabase/remote`.
- Sem `useEffect` → remote, sem sync automático, sem fallback remoto.
- `networkCalls` do fluxo demo permanece **0** (camada inacessível pelas telas).

---

## 9. Testes

| Arquivo | Papel |
| --- | --- |
| `tests/schema-a-remote-1h-11.test.ts` | mapeamento de erros, par canônico, isolamento da UI, dump ≠ `types.ts` |
| `tests/schema-a-remote-live-1h-11.test.ts` | RLS/ownership/constraints no Postgres local |
| `tests/helpers/schema-a-remote-local.ts` | carrega `supabase status -o env` em runtime (sem gravar JWT) |

Live (GoTrue + PostgREST `127.0.0.1:54321`), 3 users autenticados:

- Profile público visível; `profile_private` invisível ao outro
- Follow self recusado; Request invisível a terceiro; accept → Connection **sem** Conversation
- pin isolado por participante; `last_read_at`; outsider não lê mensagens; payload **sem** `is_unread`
- Post `PRIVATE` oculto; Reel like/comment
- Business ≠ Place; Offer exige Business (FK); Event sem `business_id` obrigatório
- Reservation nasce `pending`; outsider não vê
- Owner não pede a própria carona (CHECK 23514); accept → `full` com 0 assentos
- Save owner-only; `ticket` recusado na validação

Suite completa: **360 pass / 0 fail / 2217 expect()** (54 arquivos). Baseline 1H-10: 346 / 2087. Delta: +14 testes / +2 arquivos 1H-11.

---

## 10. Qualidade

| Check | Resultado |
| --- | --- |
| `bun test` | **360 pass / 0 fail** |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline 1H-10** |
| Lint desta fase | prettier aplicado só aos arquivos novos; sem limpeza global |
| `networkCalls` no demo | **0** |

---

## 11. Impacto no MVP

| Superfície | Estado |
| --- | --- |
| UI / rotas / stores | intactas |
| localStorage `connexy:demo:*` | intacto |
| IndexedDB | intacto |
| `getDemoIdentity()` | intacto |
| `ChatRepository` / `types.ts` | intactos |
| Migrations / RLS | intactos |
| Schema B / Payment / Order / Delivery / WebRTC / GPS | não criados |

Arquivo de produto tocado além da pasta remote: `tsconfig.json` (`include` do dump gerado).

---

## 12. Código legado **não** reutilizado

```text
src/integrations/supabase/types.ts
src/integrations/supabase/client.ts          (client da UI; remote cria o seu)
src/repositories/chat.repository.ts
src/repositories/connections.repository.ts
RPCs send_connection_request / respond_to_connection_request / get_direct_conversation
MOCK_* / demo-db blobs
getDemoIdentity()
```

`respond_to_connection_request` (1H-9) já não cria Conversation, mas a camada nova escreve nas tabelas diretamente para não acoplar aos stubs.

---

## 13. Limitações (não blockers)

1. **INSERT + RETURNING em `conversations`.** SELECT exige membership; a linha nova não é visível até existir participante. `createDirect` gera UUID no cliente, insere sem `select()`, depois participantes, depois lê. Não foi alteração de RLS.
2. **`conversations.last_message_*`.** Só o `created_by` pode UPDATE a conversa. Preview pode ficar stale se o peer envia. Sem trigger novo (fora de escopo).
3. **Aceite de Carona** não cria Connection/Conversation — passos explícitos, alinhado a “Connection não cria Conversation”.
4. Dump ainda lista tabelas legado (`bio_posts`, `blocked_users`, …) e enums órfãos. Repositories do A as ignoram.
5. `connection_requests.message` (opcional no 1H-8) **não existe** no SQL 1H-9; não foi inventado.
6. Sem upload de Storage / buckets novos.

---

## 14. Blockers

Nenhum. O contrato 1H-8 coube nas tabelas e policies 1H-9.

---

## 15. Deferred

- Cutover da UI
- Adapters domínio local ↔ rows remotas
- Orquestração Carona accept → Connection + DM
- Trigger/RPC para `last_message_*` visível a qualquer participante
- Schema B (Product/Service/Order/Payment/Delivery)
- Substituir `types.ts` / reescrever stubs da UI

---

## Próxima fase recomendada

**1H-12 — Adapters domínio local ↔ Schema A (ainda sem cutover da UI)**

Mapear entidades do MVP (chat IDB, catálogo local, saves, reservas, carona) para as rows remotas, sem ligar telas e sem remover localStorage/IndexedDB.

Não iniciar 1H-12 nesta entrega.
