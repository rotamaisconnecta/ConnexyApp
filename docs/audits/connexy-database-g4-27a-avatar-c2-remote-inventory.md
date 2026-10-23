# G4.27A — Inventário remoto somente leitura de avatares (C2)

> Fase **G4.27A** — diagnóstico remoto **exclusivamente de leitura**. Nenhuma
> operação de escrita, migration, alteração de bucket/policy/grant/dado,
> backfill, rotação de URL, deploy, commit ou push. Nenhum `.env`/segredo/flag/
> dependência alterado. Nenhum comando Git destrutivo. Nenhuma fase seguinte
> iniciada. Nenhum segredo, token, cookie ou URL assinada exibido.

Regra de evidência: **[F]** = verificado por consulta/metadado remoto; **[I]** = inferência; **[H]** = hipótese não comprovada.

---

## A. Estado inicial do Git e alterações preexistentes

| Item | Valor |
| --- | --- |
| Diretório | `/home/ricardo/Documentos/Connexy/ConnexyApp` **[F]** |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` (`16f8c6b`) **[F]** |
| `git status --porcelain` (entrada) | **302** entradas (158 `??`, 4 `AM`, 1 `D`, 138 `M`, 1 `MM`) **[F]** |
| `git status --porcelain` (saída) | **302** entradas — inalterado **[F]** |

- Todas as alterações preexistentes foram preservadas; nenhuma modificada. **[F]**
- Relatórios lidos: G4.25, G4.26A, G4.26B, G4.26C, G4.26D e o plano G4.26E
  (`docs/audits/connexy-database-g4-26e-avatar-c2-migration-plan.md`). **[F]**

---

## B. Project ID esperado e confirmação segura do projeto conectado

- **Project ID esperado:** `rsukwuqocgjmwwuwtqaf`. **[F]**
- **Evidência de vínculo local** (sem segredos): `supabase/.temp/project-ref` = `rsukwuqocgjmwwuwtqaf`;
  `supabase/.temp/linked-project.json` = `{"ref":"rsukwuqocgjmwwuwtqaf","name":"connexy-mvp",...}`;
  `supabase/config.toml` `project_id = "rsukwuqocgjmwwuwtqaf"`. **[F]**
- **Confirmação da conexão** (read-only): a consulta `select 1` via `--linked` retornou
  `application_name = mgmt-api`, que indica roteamento pela **Management API do projeto vinculado**. **[F]**
- **Cross-check de configuração local** (`.env`, sem imprimir valores): `SUPABASE_PROJECT_ID`,
  `VITE_SUPABASE_PROJECT_ID` e a host de `VITE_APP_SUPABASE_URL`/`VITE_SUPABASE_URL` apontam para
  `rsukwuqocgjmwwuwtqaf`. Observação: `SUPABASE_URL` (não-`VITE`) aponta para
  `lzejdgfvtybarpbgwsyp` — a **stack local** Docker. **[F]**
- **DNS/endpoint:** `rsukwuqocgjmwwuwtqaf.supabase.co` resolve (Cloudflare) e responde; `/rest/v1/`
  sem chave retorna **401** (esperado). **[F]**
- **Conclusão:** o destino das consultas é o projeto vinculado `rsukwuqocgjmwwuwtqaf`. As consultas
  vieram **sem** a chave publishable rejeitada (401): usaram o canal autenticado da Management API
  do projeto vinculado, não a chave do `.env`. Nenhuma credencial rejeitada foi reutilizada como
  validada. **[F]**

---

## C. Método de conexão utilizado (sem segredos)

- **Ferramenta:** Supabase CLI **v2.114.0** (`node_modules/.bin/supabase`). **[F]**
- **Comando:** `supabase db query --linked "<SQL SELECT>"`. `--linked` executa SQL via
  **Management API** do projeto vinculado (`application_name = mgmt-api`), autenticado pelo login
  da CLI já existente no ambiente. **[F]**
- **Sem segredos no canal:** nenhum access token, DB password, publishable key, cookie ou URL
  assinada foi lido, exportado, colocado em variáveis de ambiente ou impresso. O `~/.supabase/`
  contém apenas `telemetry.json` e `traces` (sem access-token). **[F]**
- **Segurança de leitura:** usadas apenas consultas `SELECT` sobre catálogos (`pg_proc`,
  `pg_policies`, `information_schema`, `pg_settings`, `storage.*`, `supabase_migrations.*`) e
  agregações (`count`). Nenhum `INSERT/UPDATE/DELETE/MERGE/TRUNCATE`, DDL, migration, `db reset`,
  `db push`/`pull`, ou transação usada como justificativa de escrita. **[F]**
- **Alvo confirmado antes de consultar** (§B). **[F]**

---

## D. Estado do bucket `avatars`

Consulta: `select id,name,public,created_at,updated_at,file_size_limit,allowed_mime_types from storage.buckets`. **[F]**

| Campo | Valor |
| --- | --- |
| Existe | **Sim** **[F]** |
| `id` / `name` | `avatars` / `avatars` **[F]** |
| `public` | **`true`** **[F]** |
| `created_at` | `2026-10-09 05:36:17.445711+00` **[F]** |
| `updated_at` | `2026-10-09 05:36:17.445711+00` **[F]** |
| `file_size_limit` | `5.24288e+06` bytes (**5 MiB**) **[F]** |
| `allowed_mime_types` | `image/jpeg, image/png, image/webp` **[F]** |

Buckets vizinhos (contexto, não-alvo): `bio-media` (public=true, 10 MiB), `reels-media`
(public=true, 50 MiB). **Não tocados.** **[F]**

---

## E. Policies e grants relevantes

### E.1 Policies em `storage.objects` (para `avatars`) **[F]**

| Policyname | Roles | Cmd | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| `Avatars public read` | **`{public}`** | SELECT | `bucket_id='avatars'` | — |
| `Avatars authenticated read` | `{authenticated}` | SELECT | `bucket_id='avatars'` | — |
| `Avatars authenticated insert` | `{authenticated}` | INSERT | — | `bucket_id='avatars' AND foldername[1]=auth.uid()` |
| `Avatars owner upload` | `{authenticated}` | INSERT | — | `bucket_id='avatars' AND foldername[1]=auth.uid()` |
| `Avatars owner update` | `{authenticated}` | UPDATE | `bucket_id='avatars' AND foldername[1]=auth.uid()` | idem |
| `Avatars owner delete` | `{authenticated}` | DELETE | `bucket_id='avatars' AND foldername[1]=auth.uid()` | — |

**Leitura efetiva (avaliada por expressão, não por nome):**
- `Avatars public read` (`roles={public}`, `USING bucket_id='avatars'`) → **qualquer um, inclusive `anon`, lê qualquer objeto do bucket `avatars`**. **Este é o ponto que expõe o bucket.** **[F]**
- `Avatars authenticated read` → autenticado lê **qualquer** objeto de `avatars` (sem escopo de pasta). **[F]**
- Escrita (insert/update/delete) é **escopada ao owner** (`foldername[1]=auth.uid()`). **[F]**
- Observação: `<img>` deslogado hoje **só** funciona por causa de `Avatars public read`; ao removê-la, cai no fallback do componente. **[I]**

### E.2 Grants em `storage.objects` / `storage.buckets` **[F]**

- `anon` e `authenticated`: `SELECT, INSERT, UPDATE, DELETE` em ambas as tabelas (padrão Supabase; RLS gate). **[F]**
- `service_role`: grants administrativos (padrão). **[F]**
- Nenhum grant incomum ou elevado indevido identificado. **[F]**

### E.3 Funções relevantes **[F]**

- `public.get_nearby_profiles` ACL: `postgres`, `authenticated`, `service_role` com EXECUTE; **sem `anon`**. **[F]**
- `has_function_privilege('anon',...)` = **false** para `get_nearby_profiles`, `is_blocked_between`, `are_connected`. **[F]**
- **Não existe** `private.g4_26b_is_canonical_avatar_path` no remoto (`count = 0`). **[F]**

---

## F. Definição e permissões da RPC remota

Consulta: `pg_get_functiondef` + `pg_proc.prosecdef`/`proconfig`. **[F]**

| Aspecto | Valor remoto |
| --- | --- |
| Schema | `public` **[F]** |
| Argumentos | `p_radius_km double precision DEFAULT 25, p_limit integer DEFAULT 50` **[F]** |
| Retorno | `TABLE(id uuid, name text, handle text, photo_url text, headline text, age integer, common_interests text[], common_vibe_tags text[], common_looks_for text[], compatibility_score integer, proximity_tier text, distance_km numeric)` **[F]** |
| `SECURITY DEFINER` | **true** **[F]** |
| `search_path` | **`SET search_path TO ''`** **[F]** |
| Linguagem | `sql`, `STABLE` **[F]** |
| EXECUTE | `authenticated`, `service_role` (sem `anon`) **[F]** |

**Projeção de `photo_url`:** o corpo remoto projeta **`s.photo_url` cru** (linha
`select s.id, s.name, s.handle, s.photo_url, s.headline, ...`). **NÃO** é a versão endurecida da
G4.26B (`case when private.g4_26b_is_canonical_avatar_path(s.photo_url) then btrim(s.photo_url) else null end`). **[F]**

**Comparação com a migration local G4.26B:** todo o resto (filtros, scoring, ordenação, limites,
`search_path`, definer) coincide com o core; a **diferença** é exatamente a projeção de `photo_url`.
Como a função de guard auxiliar **não existe** remotamente, a versão da G4.26B **não** foi aplicada. **[F]**

---

## G. Estado da migration G4.26B

- `supabase_migrations.schema_migrations` remoto tem **14** entradas (últimas):
  `20260925030806 schema_a_core`, `20261009120000 ensure_bio_reels_storage_buckets`. **[F]**
- **`20261020120000_g4_26b_avatar_canonical_discovery_contract` NÃO consta** e a função
  `private.g4_26b_is_canonical_avatar_path` **não existe** (`count=0`). **[F]**
- **Conclusão: a migration G4.26B NÃO está aplicada** no remoto. **[F]**

---

## H. Contagens agregadas de referências e método de classificação

Consultas de agregação apenas (nenhum nome, id, URL completa ou valor individual retornado). **[F]**

| Métrica | Valor |
| --- | --- |
| `public.profiles` (total) | **0** **[F]** |
| `photo_url` não-nulo | **0** **[F]** |
| `photo_url` nulo | **0** **[F]** |
| `photo_url` vazio | **0** **[F]** |
| `auth.users` | **0** **[F]** |
| `public.user_locations` | **0** **[F]** |
| `storage.objects` (total) | **0** **[F]** |
| Objetos no bucket `avatars` | **0** **[F]** |

**Distribuição por categoria de referência de avatar:** todas as categorias = **0** — pois a tabela
`profiles` está vazia. Não há referências de avatar a classificar (ausente/canônica/URL pública/URL
assinada/URL externa/inválida). **[F]**

**Método que seria usado (caso houvesse linhas):** classificação via regex SQL espelhando o
`validateMediaPath` local — canônica `^[0-9a-f]{8}-…/{…}\.[a-z0-9]{1,8}$`; URL pública
`/storage/v1/object/public/avatars/…`; URL assinada `/storage/v1/object/sign/avatars/…?token=…`;
externa `^https?://` fora do domínio do projeto; inválida = resto. Para este inventário, a
classificação foi **trivial (0/0/0/0/0/0)** e não exigiu regex. **[F]/[I]**

**Não se pode afirmar** que uma referência é canônica só por regex — mas, dado **0 linhas**, não há
ambiguidade residual neste ambiente. **[F]**

---

## I. Riscos de URLs antigas, caches e compatibilidade

- **Referências a migrar:** **nenhuma** (0 perfis, 0 objetos em `avatars`). Sem exposição de dados
  pessoais via imagens. **[F]**
- **URLs públicas existentes:** o endpoint público (`/object/public/avatars/`) está habilitado por
  `Avatars public read`, mas **não há objetos** no bucket → nenhuma URL pública aponta para conteúdo. **[F]**
- **URLs assinadas antigas (5 anos):** **não verificável** por leitura de metadados; porém, sem
  objetos e sem usuários, não há referências assinadas persistidas em `profiles`. **[I]**
- **Caches/CDN:** não é possível confirmar/limpar caches de borda por metadados de banco. Como não há
  conteúdo no bucket, o risco de cópia cacheada é nulo/não-material neste estado. **Não se alega**
  que caches foram limpos. **[H]**
- **Leitores externos:** a aplicação (25 consumidores via componente autenticado) é a única leitura
  conhecida; sem dados, não há URL pública compartilhada. **[F]/[I]**
- **Bios/reels:** buckets `bio-media`/`reels-media` também estão vazios; fora do escopo. **[F]**

---

## J. Consultas não executadas, falhas e limitações

| Item | Estado |
| --- | --- |
| Health check com a publishable key do `.env` | **Não executado** — instrução explícita de não reutilizar chave rejeitada (401). Consultas feitas por canal autenticado da CLI/Management API. **[F]** |
| `auth.config` (URL do projeto) | **Falhou** `42P01 relation "auth.config" does not exist` — tabela inexistente nesta versão. Categoria: objeto ausente. Não contornado. **[F]** |
| Grants de funções de Storage (`storage.fn_*`) relacionadas a avatar | **Não há** função de Storage específica de avatar para inspecionar; inspecionada a RPC de app. **[F]** |
| Revogação de URLs assinadas / limpeza de cache / expiração | **Não verificável** por metadados de banco. Marcado como não verificado. **[H]** |
| Contagem de leitores externos fora da aplicação | **Não verificável**. **[H]** |
| Acesso direto a dados pessoais/objetos individuais | **Não executado** (desnecessário; `profiles`=0 e `storage.objects`=0). **[F]** |

- **O inventário foi declarado completo**: o projeto correto foi confirmado (§B) e todos os itens
  essenciais (bucket, policies, grants, RPC, migration, contagens agregadas) foram efetivamente
  consultados. **[F]**

---

## K. Comparação entre o estado remoto e o plano G4.26E

| Item do plano G4.26E | Estado remoto G4.27A | Convergência |
| --- | --- | --- |
| Bucket `avatars` público, MIME `jpeg/png/webp`, 5 MiB | Confirmado: `public=true`, MIME 3 tipos, 5 MiB **[F]** | **Igual** |
| `Avatars public read` (roles public) a remover | Presente **[F]** | **Igual** |
| Policies de escrita escopadas ao owner | Presentes (owner/foldername) **[F]** | **Igual** |
| Migration G4.26B não aplicada | Confirmado (função ausente; RPC core) **[F]** | **Igual** |
| RPC `photo_url` canônica-ou-`NULL` | **NÃO** — RPC ainda projeta `photo_url` cru **[F]** | **Divergente do alvo (esperado)** |
| Backfill de referências legadas | **Nada a migrar** (profiles=0) **[F]** | **Plano superestimou o volume** |
| Risco de URLs antigas/caches | **Nulo/não-material** (0 objetos) **[F]/[H]** | **Risco menor que o planejado** |
| Cobertura de leitores (25 consumidores) | Inalterada; sem dados a exibir **[F]** | **Igual** |

**Síntese:** o ambiente remoto corresponde a um **projeto vazio recém-provisionado** (sem usuários,
perfis ou mídia). O plano de migração de **dados** (backfill/URLs/caches) torna-se **desnecessário
neste estado**; o que resta é a **mudança de configuração de acesso** (aplicar G4.26B + privatizar
o bucket), que segue sendo uma operação de escrita e exige autorização própria. **[F]/[I]**

---

## L. Recomendação da próxima etapa, com pré-condições e critérios de parada

**Recomendação:** como não há dados nem objetos, o risco de perda/exposição é mínimo. A próxima fase
(G4.27B, **somente com autorização explícita**) pode combinar, numa única janela controlada:
(1) aplicar a migration G4.26B; (2) restringir o bucket (`public=false` + remover `Avatars public read`
+ SELECT mínimo autenticado); e (3) executar a validação V1–V11 do G4.26E. **[I]**

**Pré-condições:**
1. Autorização explícita e por escrito para **escrita** remota (aplicar migration + alterar bucket/policy). **[F]**
2. Confirmar novamente o ref `rsukwuqocgjmwwuwtqaf` na janela e que `profiles`/`storage.objects`
   ainda estão vazios (ou reclassificar se houver carga). **[I]**
3. Snapshot lógico (contagem/estado) antes de alterar; plano de rollback revisado (jamais `public=true`). **[F]**
4. Pendências de produto C-06/C-08 resolvidas ou explicitamente aceitas como não bloqueantes. **[F]**

**Critérios de parada (abortar e reportar):**
- Migration G4.26B falha ou health-check falha (**sem** `--ignore-health-check`). **[F]**
- Qualquer `photo_url`/objeto aparecer entre a pré-checagem e a execução (mudança de estado não prevista). **[I]**
- `anon` ainda lê objeto de `avatars` após `public=false`; ou `ready` fora da janela [60,300] s. **[F]**
- Necessidade de elevar privilégios/service_role para concluir (proibido). **[F]**

---

## M. Confirmação explícita de ausência de escrita

**Confirmo que NENHUMA operação de escrita ou alteração remota foi executada.** Foram utilizadas
exclusivamente consultas `SELECT` de metadados e agregações via `supabase db query --linked`. Não
houve: `INSERT/UPDATE/DELETE/MERGE/TRUNCATE`; DDL; criação/alteração/remoção de tabelas, funções,
policies, grants ou buckets; alteração de propriedade `public`; backfill; rotação/revogação de URLs;
deploy/commit/push; alteração de `.env`/segredos/flags/dependências; uso de `service_role` ou
privilégio elevado; nem comando Git destrutivo. **[F]**

**Delta Git desta fase:** 302 → 302 (nenhum arquivo de repositório alterado; apenas este relatório
novo, ainda não contado no baseline de 302). HEAD/branch inalterados. **[F]**

---

### Apêndice — Consultas read-only utilizadas (SQL, sem dados pessoais)

1. `select 1` (probe de conexão). **[F]**
2. `select current_database(), current_user, inet_server_addr(), version()`. **[F]**
3. `select name,setting from pg_settings where ...` (application_name=`mgmt-api`). **[F]**
4. `select ... from storage.buckets order by name`. **[F]**
5. `select policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='storage' and tablename='objects'`. **[F]**
6. `select ... from information_schema.role_table_grants ... storage.objects/buckets`. **[F]**
7. `select p.proname, n.nspname, proacl ... where proname like '%avatar%' or 'get_nearby_profiles'`. **[F]**
8. `select count(*) ... private.g4_26b_is_canonical_avatar_path`. **[F]**
9. `pg_get_function_identity_arguments` / `prosecdef` / `proconfig`; `pg_get_functiondef`. **[F]**
10. `select version,name from supabase_migrations.schema_migrations`. **[F]**
11. Agregações `count(*)` em `public.profiles`, `auth.users`, `public.user_locations`,
    dado detalhado `photo_url`, `storage.objects` (geral e por bucket), e `has_function_privilege`. **[F]**
