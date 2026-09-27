# 1H-17 — Cutover Profile

- **Data:** 2026-09-25
- **Tipo:** cutover controlado **somente de Profile**, com rollback por flag.
- **Herdado:** 1H-8 contrato, 1H-12 adapters, 1H-13 plano, 1H-14 Auth, 1H-15 Storage, 1H-16 tipos.
- **STATUS:** **PASS**
- **DEMO MVP:** **INTACT** (padrão)
- **DUAL-WRITE / SYNC:** **não**
- **SCHEMA A / RLS / migrations:** **inalterados**

---

## 1. Flag

```text
VITE_APP_SCHEMA_A_PROFILE=true
```

Default: **off**.

```text
isRemoteProfileEnabled =
  isRemoteAuthEnabled()          // demo off + VITE_APP_SCHEMA_A_AUTH + supabase configurado
  && VITE_APP_SCHEMA_A_PROFILE === "true"
```

Desligar a flag (ou ligar `VITE_APP_DEMO_MODE`) restaura o caminho Demo. localStorage/IndexedDB **não** são apagados. Postgres **não** é limpo.

---

## 2. Fluxo Demo (padrão)

```text
getDemoIdentity() + connexy:demo:own-profile
```

`/perfil`, onboarding e o restante da app continuam no blob local. **networkCalls = 0**.

---

## 3. Fluxo Remote (só com as duas flags)

```text
Supabase Auth UUID
  → RemoteProfileRepository
  → adapter 1H-12 (toDomainProfile / toRemoteProfileUpdate / private split)
  → UI Profile (/perfil, /completar-perfil, /interesses)
```

- `profiles.id` = `auth.user.id`
- `profile_private.user_id` = `auth.user.id`
- O caminho remoto **não** chama `getDemoIdentity(`.
- Sem dual-write: Remote só escreve Schema A; Demo só escreve local.

---

## 4. Copy-once

Função explícita `copyMappedFieldsOnce`.

**Não** corre automaticamente no load (o blob Demo é `lucas`, não UUID).

Elegível só se `local.identityId === auth.uid()` (já UUID) **e** o handle remoto ainda é o placeholder do trigger `u` + 16 hex.

Onboarding remoto (`/completar-perfil`, `/interesses`) **escreve campos mapeados direto** no par trigger — isso é o fluxo seguro de criação/atualização, não cópia do JSON Demo.

---

## 5. Campos

| Classe | Campos |
| --- | --- |
| **Migráveis (REMOTE)** | `name`, `handle`, `bio`, `city`, `interests`, `visibility`, `birthDate` → `birth_date`, `privateAddresses` → `home_address`/`work_address`, `locale` (via adapter, não copiado do settings nesta fase) |
| **Derivados** | `age` (de `birthDate`; cache opcional em `profiles.age`) |
| **Não migráveis** | `DemoIdentity.id` (`lucas`), blob JSON inteiro, data URLs / blob URLs de `photo`/`cover`, posts/galeria mock da tela Perfil, `headline`/`mood`/`vibe_tags` da bio legado |
| **Futuros** | foto/capa via Storage cutover, `language` de settings → `locale`, gerenciar.bio |

Incompatibilidade mantida no Demo/legado: ecrãs `bio-*` / `ProfileRepository` (esqueleto `types.ts`). **Não remodelados.**

---

## 6. RLS

Policies 1H-9 inalteradas. Validação live local:

- owner lê/escreve `profiles` + `profile_private`
- peer `getPrivateByUserId(owner)` → `null`

Sem service role no frontend. Sem `USING (true)` novo.

---

## 7. Rollback

Flag off → `useOwnProfileController` usa `saveDemoOwnProfile` / `useDemoOwnProfile`. Dados locais intactos.

---

## 8. Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/lib/profile/schema-a-profile-flag.ts` | flag de domínio |
| `src/lib/profile/schema-a-profile.ts` | gateway Auth UUID → repo → adapter |
| `src/lib/profile/use-own-profile.ts` | hook Demo **ou** Remote |
| `src/routes/_app.perfil.index.tsx` | cutover da tela Perfil |
| `src/routes/completar-perfil.tsx` | onboarding remoto |
| `src/routes/interesses.tsx` | interesses remotos |
| `tests/schema-a-profile-1h-17.test.ts` | unit |
| `tests/schema-a-profile-live-1h-17.test.ts` | live local |

**Não alterados:** Schema A SQL, Auth 1H-14, Storage 1H-15, remote repositories, adapters de outros domínios, Social, Chat, Agora, Catalog, Reservations, Carona, Saves.

---

## 9. Validação

| Check | Resultado |
| --- | --- |
| Unit 1H-17 | **12 pass** (Demo, UUID, read/write/reload, logout, RLS peek, copy-once skip `lucas`, zero calls no Demo) |
| Live 1H-17 | **1 pass** (Postgres local: write/reload UUID + private isolado + logout) |
| `bun test` | **422 pass / 0 fail / 2525 expect / 60 files** (inclui live 1H-11) |
| `bunx tsc --noEmit` | **PASS** |
| `bun run build` | **PASS** |
| `bun run lint` | **FAIL 504** (484 errors, 20 warnings) — **igual ao baseline** |
| Demo `networkCalls` | **0** (flag off + demo vence) |

---

## 10. PASS / FAIL

| Critério | |
| --- | --- |
| Profile Remote funciona | **SIM** (gateway + live) |
| Demo funciona | **SIM** (padrão) |
| Identidade remota = Auth UUID | **SIM** |
| RLS efetivo | **SIM** |
| Rollback por flag | **SIM** |
| Outros domínios | **não cortados** |
| Dual-write / sync | **NÃO** |
| Schema A inalterado | **SIM** |

**STATUS: PASS**
