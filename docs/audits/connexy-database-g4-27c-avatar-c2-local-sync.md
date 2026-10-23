# G4.27C — Sincronização local e auditoria pós-privatização do Avatar C2

> Fase **G4.27C** — sincronização local e auditoria. Nenhuma escrita remota
> (migration/bucket/policy/grant/dado/backfill/rotação). Nenhum `.env`/segredo/
> dependência/flag alterado (`VITE_APP_SCHEMA_A_MEDIA_URL` continua OFF). Nenhum
> commit/push. Nenhum comando Git destrutivo. `avatars.public=true` NÃO foi
> restaurado em lugar algum.

Regra de evidência: **[F]** = verificado; **[I]** = inferência; **[H]** = hipótese.

---

## 1. Estado inicial e final do Git

| Item | Início | Fim |
| --- | --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** | inalterado **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` **[F]** | inalterado **[F]** |
| `git status --short` | **304** entradas (160 `??`, 4 `AM`, 1 `D`, 138 `M`, 1 `MM`) **[F]** | **305** entradas **[F]** |

- As 304 alterações preexistentes foram **preservadas**; nenhuma foi descartada. **[F]**
- Delta desta fase: **+1** = a nova migration local `20261021042744_g4_27b_...` (untracked).
  A migration G4.26B foi **renomeada** (já era untracked; content-idêntica). **[F]**
- Relatórios lidos: G4.26D, G4.26E, G4.27A, G4.27B. **[F]**
  - Nota: o relatório G4.27B **registrou BLOCKED e “nenhuma alteração remota”**, o que
    divergia do estado remoto real. A verificação direta desta fase (read-only)
    confirmou que as migrations `20261021042457` e `20261021042744` **estão** aplicadas
    no remoto. O relatório G4.27B refletia uma tentativa que não executou as mudanças;
    o estado remoto autorizado é o descrito no pedido desta fase. **[F]**

---

## 2. Arquivos modificados por esta etapa

| Arquivo | Ação |
| --- | --- |
| `supabase/migrations/20261021042457_g4_26b_avatar_canonical_discovery_contract.sql` | **Renomeado** de `20261020120000_...` (SHA-256 inalterado `98dc24…`) **[F]** |
| `supabase/migrations/20261021042744_g4_27b_avatar_c2_private_bucket_and_guard_hardening.sql` | **Criado** (nova) **[F]** |
| `tests/avatar-canonical-contract-g4-26b.test.ts` | Caminho da migration atualizado (3x) **[F]** |
| `tests/avatar-canonical-guard-sql-g4-26d.test.ts` | Caminho atualizado + passa a carregar G4.26B **e** G4.27B (guard efetivo) **[F]** |
| `docs/audits/connexy-database-g4-27c-avatar-c2-local-sync.md` | **Criado** (este relatório) **[F]** |

Nenhum arquivo de aplicação (`src/**`) foi alterado. **[F]**

---

## 3. Reconciliação de timestamps e histórico de migrations

**Problema confirmado:** `supabase migration list --linked` (read-only) mostrava:
- Local `20261020120000` = **PENDENTE** (sem par remoto) → risco de reaplicação num futuro `db push`;
- Remoto `20261021042457` e `20261021042744` = **ausentes localmente** (remote-only).

**Causa:** a migration local foi aplicada no remoto sob a versão **`20261021042457`** (nome
`g4_26b_avatar_canonical_discovery_contract`), não sob o timestamp original `20261020120000`.
O endurecimento de bucket/guard foi aplicado como **`20261021042744`**
(`g4_27b_avatar_c2_private_bucket_and_guard_hardening`), sem arquivo local correspondente. **[F]**

**Verificação prévia à renomeação (read-only):** **[F]**
- `git ls-files` → o arquivo G4.26B **não era rastreado** (renomear não reescreve histórico git).
- Remoto aplicado: bucket `avatars.public=false`; policy `Avatars public read` **removida**;
  5 policies owner/authenticated preservadas; RPC `get_nearby_profiles` com projeção
  canônica-ou-`NULL`; guard **endurecido** (`position(chr(92) …)` e `E'[\x01-\x1F\x7F]'`).
- Nenhuma migration local **posterior** dependia de `20261020120000` (o arquivo era o último).

**Ação:** renomeado para `20261021042457` (conteúdo byte-idêntico; SHA-256 confere) e criada a
migration de acompanhamento `20261021042744` (substitui **somente** o guard; remove **somente**
`Avatars public read` se existir; define `avatars.public=false`; não toca outras policies/buckets).
Ordem cronológica preservada (`20261009120000 < 20261021042457 < 20261021042744`). **[F]**

**Resultado:** `supabase migration list --linked` agora mostra **local e remoto em 1:1**
(sem pendências e sem remote-only). **[F]**

---

## 4. Diferenças entre SQL remoto confirmado e SQL local

### 4.1 Guard `private.g4_26b_is_canonical_avatar_path` **[F]**

| Regra | G4.26B local (arquivo renomeado) | G4.27B local (novo) | Remoto efetivo |
| --- | --- | --- | --- |
| Barra invertida | `position('\' in v_value)` | `position(chr(92) in v_value)` | `position(chr(92) in v_value)` ✅ |
| Caracteres de controle | `~ '[\x00-\x1f\x7f]'` | `~ E'[\x01-\x1F\x7F]'` | `~ E'[\x01-\x1F\x7F]'` ✅ |
| Demais regras | idênticas | idênticas | idênticas |

- Os arquivos locais G4.26B + G4.27B, aplicados **em ordem**, reproduzem o guard remoto efetivo. **[F]**
- Diferença dos controles: G4.26B rejeita `0x00`; G4.27B/remoto começa em `0x01`. `0x00` (NUL)
  não é representável como texto no PostgreSQL (erro de encoding), então na prática não é um
  input alcançável — divergência sem impacto de segurança. **[F]**

### 4.2 Bucket e policy **[F]**

- Remoto: `avatars.public=false`; `Avatars public read` ausente; 5 policies preservadas. A
  migration local G4.27B produz exatamente esse efeito (verificado em runtime com `ROLLBACK`).

### 4.3 RPC `get_nearby_profiles` **[F]**

- Remoto e local (G4.26B): assinatura, `SECURITY DEFINER`, `SET search_path TO ''`, projeção
  `case when private.g4_26b_is_canonical_avatar_path(s.photo_url) then btrim(s.photo_url) else null end`,
  grants `authenticated` (sem `anon`). **Sem diferenças.** **[F]**

---

## 5. Testes executados e resultados

Ambiente: `bun` em `/home/ricardo/.local/node/node-v22.13.0-linux-x64/bin/bun`; PostgreSQL local
17.6 no container Docker `supabase_db_lzejdgfvtybarpbgwsyp`. Nenhuma conexão remota para testes. **[F]**

| Comando | Resultado |
| --- | --- |
| `bun test` (guard SQL runtime: G4.26B+G4.27B) | **2 pass / 0 fail**; matrix **38/38**; nada persistido **[F]** |
| `bun test` suíte avatar (6 arquivos) | **56 pass / 0 fail** (178 asserts) **[F]** |
| `bun test` consumidores perfil/descoberta (5 arquivos) | **81 pass / 0 fail** (365 asserts) **[F]** |
| `tsc --noEmit` | exit **0** **[F]** |
| `eslint` (arquivos de teste alterados) | exit **0** (após `prettier --write`) **[F]** |
| `prettier --check` (testes) | limpo após formatação; o `.sql` não é parseável pelo Prettier JS (esperado) **[F]** |
| `git diff --check` | exit **0** **[F]** |

- O runner do guard SQL foi atualizado para carregar **as duas migrations em ordem**, exercitando
  o **guard efetivo** (estado aplicado no remoto) dentro de `BEGIN…ROLLBACK`. **[F]**
- Nenhum teste foi ignorado silenciosamente: o runner usa `skipIf` quando não há PostgreSQL local;
  neste ambiente havia, e ele executou. **[F]**

### 5.1 Paridade SQL↔TypeScript (Fase C) **[F]**

Comparação dos 36 casos representáveis do matrix (SQL `private.g4_26b_is_canonical_avatar_path`
efetivo × `validateMediaPath` TS):

- **35/36 idênticos** (URL, barra inicial, `..`, barra invertida, octetos `%XX`, segmentos vazios,
  UUID inicial inválido, extensão inválida, controle `0x01`/`0x7f`, maiúsculas, espaço interno). **[F]**
- **1 divergência (#28): `b.tar.gz`** → **SQL = `false`** (conta os pontos: 2 → rejeita);
  **TS = `true`** (`lastIndexOf('.')` → extensão `gz` válida). O SQL é **mais restritivo** →
  não há brecha de segurança. É uma nuance de formato já coberta pela pendência **C-06**
  (política de extensões). **Documentada, não alterada.** **[F]**

---

## 6. Riscos e validações ponta a ponta ainda indisponíveis

- **V1–V11 remotos não executados nesta fase** (a fase é local; nenhuma escrita/rede remota). **[F]**
  - A fase **não** afirma que `anon` está bloqueado em runtime remoto, nem que URLs antigas foram
    revogadas/caches limpos. O bucket remoto está `public=false` e a policy pública foi removida
    (verificado por metadados), mas a **verificação funcional** de ponta a ponta continua pendente. **[F]/[H]**
- **Sem usuário/imagem real:** o remoto segue sem perfis/objetos (confirmado em G4.27A); não há
  avatar real para validar exibição assinada, TTL em uso, ou fallback sob latência. **[F]**
- **Divergência `b.tar.gz` (C-06):** SQL e TS discordam nesse formato; nenhuma brecha (SQL mais
  estrito), mas fere "rejeitar os mesmos formatos". **[F]**
- **`bio-media`/`reels-media`** permanecem públicos — fora do escopo C2, não tocados. **[F]**
- **CDN/cache e URLs assinadas antigas:** não verificáveis por metadados de banco. **[H]**

---

## 7. Status separado — C-06, C-08 e teste com usuário/imagem real

| Item | Status |
| --- | --- |
| **C-06** (restrições de formato/extensão) | **ABERTO.** Não alterado por decisão de produto. Evidência nova desta fase: divergência `b.tar.gz` entre SQL (rejeita) e TS (aceita); ambos aceitam `.php` por design. **[F]** |
| **C-08** (validação de escrita de `photo_url`) | **ABERTO.** Não alterado. Caminhos de escrita continuam sem `validateMediaPath`/validação de dono em adaptadores/`buildProfileUpdatePatch` (só remoção de `blob:`/`data:`). **[F]** |
| **Teste com usuário/imagem real** | **NÃO REALIZADO.** Requer ambiente remoto com fixtures e execução de V1–V11; fora do escopo local. **[F]** |

---

## 8. Critério de conclusão — veredito

**APROVADA.** O estado local agora **reflete o contrato remoto** sem migrations duplicadas:

1. `supabase migration list --linked` mostra **1:1** local↔remoto. **[F]**
2. Nenhuma migration duplicada; G4.26B renomeado para a versão remota (`20261021042457`);
   G4.27B criado como migração de acompanhamento (`20261021042744`), tocando **apenas** guard,
   policy pública e `avatars.public`. **[F]**
3. Testes pertinentes **passam** (guard 2/2 com matrix 38/38; avatar 56/56; consumidores 81/81;
   tsc/eslint/prettier/`git diff --check` limpos). **[F]**
4. Alterações preexistentes **intactas** (304 → 305; nada descartado; branch/HEAD inalterados). **[F]**
5. Nenhuma operação remota de escrita; `avatars.public=true` não restaurado; local DB não persistiu
   o guard (`count=0`) nem alterou o bucket local. **[F]**

**Não declarado:** sucesso de V1–V11 (não executados); ausência de risco de cache/URLs antigas.
**Pendências:** C-06, C-08 e teste com usuário/imagem real seguem **abertos**.
