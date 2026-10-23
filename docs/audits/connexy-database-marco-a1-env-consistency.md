# Connexy — Marco A1: Consistência da configuração Supabase

- **Tipo:** correção mínima de código + testes. Fase exclusivamente local.
- **Data:** 2026-10-13. **Autor:** OpenCode.
- **Escopo remoto:** nenhuma operação remota executada (sem `link`/`pull`/`push`/SQL/buckets). O
  projeto fora de escopo `lzejdgfvtybarpbgwsyp` não foi acessado. Projeto autorizado
  `rsukwuqocgjmwwuwtqaf` não foi consultado.
- **Segredos:** nenhum valor de URL/chave/token/senha é reproduzido. Apenas nomes de variáveis.

---

## 1. Estado inicial e final do Git

| | Inicial | Final |
| --- | --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` | idem |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` | idem |
| Rastreados modificados | 115 | 118 (+3 arquivos previamente limpos) |
| Staged | 8 | 8 (inalterado) |
| Não rastreados | 117 | 120 (+3: helper, teste e este relatório) |

Nenhum `reset`, `clean`, commit ou push. Nenhum arquivo preexistente revertido, movido ou formatado
em massa. `.env`, `.env.local`, `.env.example`, `supabase/config.toml` e migrações **não** foram
editados (`supabase/config.toml` já constava modificado no baseline, sem alteração desta fase).

Delta desta fase (exatamente):
- **Novos:** `src/lib/supabase/external-env.ts`, `tests/supabase-external-env.test.ts`,
  `docs/audits/connexy-database-marco-a1-env-consistency.md`.
- **Modificados (previamente limpos):** `src/integrations/supabase/auth-middleware.ts`,
  `src/lib/supabase/server.server.ts`, `src/lib/supabase/config.ts`.
- **Modificado (já não rastreado):** `src/lib/media/media-url.functions.ts`.

---

## 2. Causa exata da divergência

A leitura das variáveis **públicas** de Supabase (URL + publishable key) estava inconsistente entre
contextos:

| Consumidor | Antes | Consequência |
| --- | --- | --- |
| `auth-middleware.ts` (middleware serverFn) | apenas `import.meta.env.VITE_APP_*` | se `APP_*` diferisse de `VITE_APP_*`, o token era validado em um projeto e o RLS rodaria em outro |
| `server.server.ts` (SSR por cookie) | `process.env.APP_* \|\| import.meta.env.VITE_APP_*` | preferia `APP_*` silenciosamente, sem detectar conflito |
| `media-url.functions.ts` (serverFn) | `process.env.APP_* \|\| import.meta.env.VITE_APP_*` | idem |
| `config.ts` `isSupabaseConfigured()` (servidor) | apenas `process.env.APP_*` | discordava dos handlers, que aceitavam o fallback público |

Causa raiz: **cada consumidor implementava sua própria precedência**, duas delas sem fallback e
nenhuma detectando conflito. O achado M2 do lote G4.1 já havia sinalizado o caso do middleware.
Observação do diagnóstico: no `.env` local, `SUPABASE_URL` (namespace admin/service role) aponta para
o projeto fora de escopo, enquanto `VITE_APP_SUPABASE_URL` aponta para o autorizado — mas o código
de aplicação nunca deve ler `SUPABASE_URL`; ele é lido apenas por `client.server.ts` (service role),
que **permanece fora do escopo desta correção** (§7).

---

## 3. Arquivos alterados e justificativa

1. **`src/lib/supabase/external-env.ts` (novo)** — fonte única de resolução das variáveis públicas:
   - `resolveSupabasePublicConfig(serverEnv, publicEnv)` pura e testável.
   - Precedência explícita: `APP_*` (servidor) > `VITE_APP_*` (público).
   - **Conflito detectado:** se `APP_*` e `VITE_APP_*` estiverem ambos definidos e divergirem, lança
     `SupabaseEnvError` (nunca escolhe silenciosamente).
   - **Ausência segura:** lança nomeando as variáveis ausentes, sem expor valores.
   - `readPublicSupabaseEnv()` isola o acesso a `import.meta.env`; `resolveServerSupabasePublicConfig()`
     usa `process.env` com fallback público.
   - Não lê `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.

2. **`src/integrations/supabase/auth-middleware.ts`** — passa a resolver URL/key via
   `resolveServerSupabasePublicConfig()` (fecha M2). Único arquivo marcado como auto-gerado; ver §7.

3. **`src/lib/supabase/server.server.ts`** — substitui o bloco `APP_* || VITE_APP_*` + validação
   manual pelo resolver compartilhado (mesma precedência e detecção de conflito).

4. **`src/lib/media/media-url.functions.ts`** — `readExternalSupabaseConfig()` delega ao resolver
   compartilhado, garantindo o mesmo par URL/key do middleware.

5. **`src/lib/supabase/config.ts`** — `isSupabaseConfigured()` no servidor usa o resolver (com
   `try/catch` → `false`), alinhando a detecção de configuração aos handlers.

6. **`tests/supabase-external-env.test.ts` (novo)** — 12 testes direcionados (unit do resolver + fiação
   por varredura de fonte).

Compatibilidade preservada: nomes `APP_*`/`VITE_APP_*` mantidos; nenhuma variável nova; a service role
nunca é lida no cliente; contexto de navegador continua lendo somente `VITE_APP_*`.

---

## 4. Testes executados e resultados reais

Runner: `bun test` (não há script de teste em `package.json`; 122/122 arquivos importam `bun:test`).

| Comando | Resultado |
| --- | --- |
| `bun test tests/supabase-external-env.test.ts` | **12 pass / 0 fail** |
| `bun test tests/supabase-external-env.test.ts tests/schema-a-client-types-1h-16.test.ts tests/schema-a-auth-1h-14.test.ts` | **32 pass / 0 fail** |
| `bun test` (suíte completa) | **1083 pass / 46 skip / 0 fail** (1129 testes, 122 arquivos) |
| `bunx tsc --noEmit` | **exit 0** |
| `bunx eslint` (arquivos alterados/criados) | **exit 0** |

Cobertura do novo teste:
- resolve por `APP_*`; resolve por fallback `VITE_APP_*`; ambos iguais aceitos;
- conflito de URL e de chave → `SupabaseEnvError`;
- ausência nomeia variáveis; vazio/espaços contam como ausente;
- mensagem de erro não contém os valores configurados;
- fiação: middleware não lê `VITE_APP_*` direto e usa o resolver; handlers usam `external-env`;
- clientes de navegador não leem `process.env.APP_SUPABASE_*` nem `SERVICE_ROLE`.

Referências existentes mantidas verdes: `schema-a-client-types-1h-16` (conjunto de importadores de
types) e `schema-a-auth-1h-14`.

---

## 5. Variáveis esperadas em cada contexto (sem valores)

| Contexto | URL | Publishable key | Observação |
| --- | --- | --- | --- |
| Navegador (cliente) | `VITE_APP_SUPABASE_URL` | `VITE_APP_SUPABASE_PUBLISHABLE_KEY` | nunca `APP_*`, nunca service role |
| Servidor (SSR/middleware/handlers) | `APP_SUPABASE_URL` (preferida) ou `VITE_APP_SUPABASE_URL` | `APP_SUPABASE_PUBLISHABLE_KEY` ou `VITE_APP_SUPABASE_PUBLISHABLE_KEY` | ambas definidas e divergentes ⇒ erro |
| Admin/server-only (fora do escopo) | `SUPABASE_URL` | `SUPABASE_SERVICE_ROLE_KEY` | lido só por `client.server.ts`; nunca no cliente |
| Legado (não lido) | `VITE_SUPABASE_URL` / `SUPABASE_PROJECT_ID` / `SUPABASE_PUBLISHABLE_KEY` | — | intencionalmente ignorado |

Estado local observado (nomes apenas): `APP_SUPABASE_*` ausente; `VITE_APP_SUPABASE_URL` aponta para
`rsukwuqocgjmwwuwtqaf`; `SUPABASE_URL` aponta para `lzejdgfvtybarpbgwsyp`.

---

## 6. O que ainda exige configuração manual e autorização

- **`.env` (exige autorização; não editado nesta fase):** definir `APP_SUPABASE_URL` /
  `APP_SUPABASE_PUBLISHABLE_KEY` espelhando o projeto autorizado e remover/redirecionar o
  `SUPABASE_URL` que aponta para o projeto fora de escopo.
- **`client.server.ts` (service role):** continua lendo `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
  Corrigir a origem exige autorização e configuração manual no ambiente confiável; a service role
  nunca pode ir ao cliente. Não alterado aqui (fora do escopo de URL/key públicas).
- **Validação remota:** confirmar que o projeto autorizado é o destino correto — exige autorização
  separada. **Não** declarada conexão validada.
- **Flags Schema A:** não ativadas. **Perfil:** não iniciado. **G5:** não iniciado.
- **`src/lib/mcp/supabase.ts`:** mantém resolução própria (keyset/legado) — não tocado por não ser
  middleware/handler/cliente do caminho principal; registrar como possível padronização futura.

---

## 7. Decisão pendente / riscos registrados

- **`auth-middleware.ts` é marcado "automatically generated. Do not edit it directly."** A correção é
  a menor possível, mas pode ser sobrescrita por regeneração (Lovable). Recomenda-se manter o resolver
  como fonte única e, se o arquivo for regenerado, reaplicar a delegação (o teste de fiação do
  `tests/supabase-external-env.test.ts` detecta a regressão).
- A correção é de **leitura de configuração**, não arquitetural; não houve mudança de fluxo, banco,
  RLS ou UI.

---

## 8. Confirmação de ausência de operação remota

Não houve `supabase link/pull/push/db`, login, execução de SQL, acesso a buckets, build/deploy ou
qualquer requisição ao Supabase remoto. Nenhuma variável de ambiente foi editada. Fase estritamente
local.

Parar aqui e aguardar revisão antes de qualquer etapa seguinte.
