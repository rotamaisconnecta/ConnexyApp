# 1H-14 — Supabase Auth com Flag

- **Data:** 2026-09-25
- **Tipo:** fundação de Auth real atrás de flag. Sem cutover de UI, dual-write ou sync.
- **Herdado (não reaberto):** 1H-8 contrato, 1H-9 SQL/RLS, 1H-10 dump, 1H-11 remote repositories, 1H-12 adapters, 1H-13 plano.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT**
- **CUTOVER:** **NOT STARTED**
- **DUAL-WRITE / SYNC / STORAGE:** **não**

`getDemoIdentity()` não foi substituído. Nenhuma tela de domínio, repository remoto, adapter, Schema A ou `types.ts` foi alterada.

---

## 1. Auditoria (somente leitura)

| Peça | Resultado |
| --- | --- |
| Client vivo da UI | `src/lib/supabase/client.ts` — `createBrowserClient`, `VITE_APP_SUPABASE_*`, Proxy lazy, `persistSession: true`, tipado em `integrations/supabase/types.ts` |
| Client gerado / locked | `src/integrations/supabase/client.ts` — sem importadores vivos |
| Client Schema A | `src/integrations/supabase/remote/client.ts` — `createSchemaAClient`, dump gerado, `persistSession: false` (repos 1H-11) |
| Config | `isPublicSupabaseConfigured()` já é `false` em demo |
| Identidade demo | `getDemoIdentity()` → `lucas` / switcher localStorage |
| Stubs Auth | `AuthRepository` / `AuthService` — sem gate demo, `signUp` escreve `UserRepository`. **Não reutilizados** |
| Hook UI | `useAuth()` já short-circuita em demo. **Não ligado** a esta camada |
| Adapter | `SchemaAAuthIdentity` / `toSchemaAAuthIdentity` / `isSchemaAUuid` — reutilizados sem alteração |

### Limitação do client (mínima, documentada)

Há **dois** clients no projeto (UI legado vs factory Schema A). Auth de produto precisa de sessão persistida no browser; o factory 1H-11 desliga `persistSession`. A camada nova **reutiliza** `src/lib/supabase/client.ts` (mesmo URL/key, mesma instância Proxy). Não cria uma terceira instância, não duplica env, não move o client vivo para o dump gerado, não altera o contrato de `types.ts`.

Os métodos `auth.*` não dependem das tabelas de `types.ts`. A menor alteração estrutural necessária foi **zero** no client existente.

---

## 2. Camada de Auth

| Arquivo | Papel |
| --- | --- |
| `src/lib/auth/schema-a-auth-flag.ts` | Gate: demo **vence** a flag |
| `src/lib/auth/schema-a-auth.ts` | Sessão, UUID, login/logout, identidade remota tipada |

API:

```text
isRemoteAuthEnabled()
createSchemaAAuth({ isEnabled, auth })
getSchemaAAuth()          // production: lazy @/lib/supabase/client
getIdentity()             // null se ausente ou desligado
signIn(email, password)
signOut()
profileIdFromRemoteAuth() // Auth User → profiles.id (mesmo UUID)
```

- Sem utilizador/senha hardcoded.
- Sem service role.
- Sem `USING (true)`.
- Sem copy-once de perfil.
- Sem store local novo.
- Import dinâmico do client **só** quando a porta Auth é realmente chamada.

---

## 3. Flag

```text
VITE_APP_SCHEMA_A_AUTH=true
```

Independente de `VITE_APP_DEMO_MODE`.

```text
isRemoteAuthEnabled =
  !isDemoMode()
  && VITE_APP_SCHEMA_A_AUTH === "true"
  && isPublicSupabaseConfigured()
```

Default: **off** (env ausente). Demo continua o caminho da UI.

---

## 4. Identidade

```text
Demo   → getDemoIdentity()          // intacto, ids tipo "lucas"
Remote → auth.user.id UUID          // SchemaAAuthIdentity.userId
         → profiles.id
         → profile_private.id
```

Não há conversão `lucas` → UUID. A identidade remota **não** chama `getDemoIdentity(`.

Fundação perfil: `profileIdFromRemoteAuth(identity) === identity.userId`. Copy-once fica para fase posterior, só com campos explicitamente mapeáveis do adapter 1H-12.

---

## 5. Isolamento

- Rotas / componentes / hooks / providers **não** importam `schema-a-auth`.
- Repositories 1H-11 **não** alterados.
- Adapters 1H-12 **não** alterados (só consumo de `toSchemaAAuthIdentity`).
- Schema A / migrations / Storage: **não**.
- UI de domínio: **não**.
- Cutover: **não iniciado**.

---

## 6. Validação

| Check | Resultado |
| --- | --- |
| `bun test tests/schema-a-auth-1h-14.test.ts` | **14 pass / 0 fail** |
| `bun test` | **385 pass / 8 skip / 0 fail / 2326 expect / 56 files**. Skip = live 1H-11 (Postgres local não usado nesta corrida). Suite anterior 1H-12: 379 pass / 55 files |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline 1H-11/1H-12** após correção prettier no import |
| Demo `networkCalls` | **0** (gate desliga getUser/signIn/signOut; fetch do client não dispara) |

Testes cobrem: sessão ausente, sessão presente, UUID válido, logout, Demo vs Remote, flag demo preservada, zero Auth quando Demo ativo, identidade remota sem `getDemoIdentity(`.

---

## 7. PASS / FAIL

| Critério | |
| --- | --- |
| Auth isolado atrás de flag | **SIM** |
| Demo intacto | **SIM** |
| `getDemoIdentity()` intacto | **SIM** |
| Auth remoto = `auth.user.id` UUID | **SIM** |
| Nenhuma entidade de domínio migrada | **SIM** |
| Dual-write / sync | **NÃO** |
| Schema A inalterado | **SIM** |
| Testes / typecheck / build | **PASS** |

**STATUS: PASS**
