# Relatório consolidado A–L — integração local ao Schema A

- **Data:** 2026-10-12
- **Ferramenta:** OpenCode + Big Pickle (auditoria, testes locais não destrutivos, documentação).
- **Escopo:** consolidar evidências dos lotes/fases A–L. **Nenhum teste remoto** foi reexecutado.
- **Regras respeitadas:** somente auditoria local, leitura de código, testes locais e documentação.
  Sem acesso/modificação do Supabase remoto; sem criar/remover buckets/objetos/usuários/tabelas/
  policies/migrations; sem ativar flags; sem wiring de UI; sem `git reset/clean`/checkout destrutivo;
  sem commits/push; sem expor chaves/tokens/senhas/URLs assinadas válidas.
- **Classificação:** **[P]** provado/concluído · **[L]** concluído localmente, não validado remoto ·
  **[D]** pendente · **[B]** bloqueado por decisão de arquitetura · **[F]** fora do escopo.

---

## A. Veredito
Os lotes **A–C** (perfil, social, conversas) estão **provados** com testes live locais. O **Lote D**
(publicações) tem a **foundation implementada localmente** (porta + flag + 16 testes), **sem wiring
de UI** e com **flag inativa**. O **Lote E** (autorização de mídia/RLS real) está **provado**. O
**Lote F** (Storage) foi **auditado** com plano de migração proposto, porém a migração está
**[B] bloqueada** por decisão de arquitetura (D2) e por lacunas comprovadas de resolução path→URL.

**Liberação de UI: NÃO.** Nenhuma alteração de produção, flag, bucket, RLS, migration ou recurso
remoto foi feita.

---

## B. Git inicial/final — [P]
- HEAD `16f8c6b`; branch `backup/connexy-snapshot-2026-10-02` — **inalterado**.
- Snapshot inicial: `/tmp/opencode/consol-git-before.txt` (206 linhas).
- Estado pré-existente (modificados + não rastreados + `.env` deletado no índice) **preservado**.
- Unico delta vs. snapshot: **4 arquivos novos do Lote D** (ver D). Sem commits, sem push, sem
  operações destrutivas.

---

## C. Resumo por lote — [P]/[L]
| Lote | Escopo | Estado | Evidência |
| --- | --- | --- | --- |
| A | Perfil (porta + flag + consumo) | **[P]** | live `schema-a-remote-live-1h-11` (perfil) |
| B | Social/conexões | **[P]** | live 1H-18 |
| C | Conversas | **[P]** | live 1H-19 |
| D | Publicações — foundation | **[L]** | `tests/schema-a-content-1h-21` (15) + live 1H-22 (1) |
| E | Autorização de mídia (RLS real) | **[P]** | Fase 10: 6 cenários + negativos + ciclo `200→400` |
| F | Storage (inventário/matriz/plano) | **[B]** | `docs/audits/lote-f-storage-inventory.md` |

---

## D. Arquivos alterados
**Novos — Lote D (código, [L]):**
- `src/lib/content/schema-a-content.ts` — porta (`publishOwnPost`, `editOwnPost`, `removeOwnPost`,
  `getOwnPost`, `peekPost`, `listOwnPosts`); reusa adapters/repo existentes; erros
  `SchemaAContentError{DISABLED|NO_SESSION|IDENTITY|AUTHOR}`.
- `src/lib/content/schema-a-content-flag.ts` — gate `VITE_APP_SCHEMA_A_CONTENT` (demo vence;
  `setRemoteContentGateForTests`).
- `tests/schema-a-content-1h-21.test.ts` — 15 testes.
- `tests/schema-a-content-live-1h-22.test.ts` — 1 teste RLS real.

**Novos — Lote F (documentação):**
- `docs/audits/lote-f-storage-inventory.md` (Partes 1–3).
- este `relatorio-consolidado-a-l.md`.

**Modificados:** nenhum arquivo de produção existente em D ou F.

---

## E. Testes reais executados (local) — [P]/[L]
- Lote D: `bun test` = **1001 pass / 20 skip / 0 fail** (baseline 986/17/0; +16 testes, 114 arquivos).
- `bunx tsc --noEmit` = exit 0.
- `bunx eslint` nos arquivos novos = limpo (baseline global 1245 erros/25 warnings pré-existentes).
- Live Lote D (`schema-a-content-live-1h-22`): **1 pass**, env local, limpeza FK-safe (0 resíduos `c22`).
- Fase 10 (herdado): RLS real — anônimo `42501`; owner/connection/sem conexão conforme policy;
  URL assinada `200` → após janela `400`.
- **Não reexecutados:** qualquer teste remoto/live contra o Supabase remoto.

---

## F. Contratos — [P]/[L]
- Portas de domínio + flags: `schema-a-{auth,profile,social,conversations,content}` com padrão
  `createSchemaA*` (deps injetáveis, lazy, singleton getter, reset p/ testes; gate = flag do domínio
  **e** `isRemoteAuthEnabled()`).
- `schema-a-content`: identidade = Auth UUID; rejeita ids demo; `FRIENDS`→`CONNECTIONS`; rejeita
  privacy inválida antes do repo; zero chamadas quando desabilitada.
- Repositórios/adapters remotos Schema A **inalterados**; `RemoteContentRepository.createPost`
  já exercitado em live 1H-11.

---

## G. Segurança — [P]/[B]
- **[P]** RLS de `posts` comprovada real (Fase 10). Distinções válidas: RLS-linha protege a linha;
  assinatura é o único ponto de autorização da mídia; URL pública de bucket público ignora RLS;
  URL assinada é portadora e expirar não revoga cópias.
- **[B]** Buckets `avatars`/`bio-media`/`reels-media` são `public=true` → qualquer objeto é
  recuperável por URL pública, inclusive de publicações `CONNECTIONS`/`PRIVATE`. Contradiz D2.
- **Limite local:** comportamento de cache/CDN/distribuição **não comprovável** aqui.

---

## H. Flags desligadas — [P]
`VITE_APP_SCHEMA_A_{AUTH,PROFILE,SOCIAL,CONVERSATIONS,CONTENT}` **não ativadas**. A flag de conteúdo
(`VITE_APP_SCHEMA_A_CONTENT`) está **inativa**. Fluxo demo sempre vence.

---

## I. Storage — [B]/[D]
Resumo (detalhe em `lote-f-storage-inventory.md`):
- 3 buckets públicos; escrita owner-folder (`foldername[1]=auth.uid()`).
- Referências em formatos divergentes: path relativo (F1/F6/F7), URL pública (F3/F4/F5/F8),
  URL assinada ~5 anos (F2).
- **Sem resolver path→URL**; **sem `createSignedUrl`** no `StorageHelper`; `posts.media.preview`
  vazio no fluxo persistido; builder `schema-a-storage` sem consumidor de UI.
- Migração proposta (buckets privados + path + URL assinada curta pós-autorização) **não implementada**.

---

## J. Pendências
1. **[B]** Migração de Storage (Lote F) — depende de decisão/entrega de arquitetura (D2) + autorização.
2. **[D]** Resolver server-side path→URL (assinada) + `createSignedUrl` após checagem de autorização.
3. **[D]** Normalizar formato de path (builder `{purpose}` vs. uploads reais).
4. **[B]** Wiring de UI do Lote D (`_app/create-post.tsx`) — depende de Storage + privacidade.
5. **[D]** D3 (localização), D4 (backfill/transição), D5 (lacunas) do ADR.
6. **[D]** Usuários de teste preexistentes prefixos `1h11`/`c19`/`p17`/`s18` — investigação pendente;
   **não** consultados/removidos (remoto proibido neste trabalho).

---

## K. Próxima etapa recomendada
**Codex (mudança arquitetural complexa):** implementar, **em ambiente local**, a camada server-side de
autorização/assinatura de mídia (path→URL assinada + `createSignedUrl`), com testes positivos/negativos
por nível, seguida da normalização de paths e da migração F1–F8 com rollback. Só depois avaliar o
release da UI (corte de `create-post` e leitura).

---

## L. Integridade — [P]
- Git preservado: HEAD `16f8c6b`, sem commits, sem operações destrutivas.
- Supabase remoto **não acessado/modificado**; buckets/objetos/policies/usuários/tabelas/migrations
  intactos. Buckets locais inalterados (`avatars`=1, `bio-media`=1, `reels-media`=0 objetos).
- Segredos: nenhuma chave/token/URL assinada reproduzida (`[LOCAL_SECRET_REDACTED]`).
- Resíduo de banco local: usuários de teste preexistentes (`1h11`/`c19`/`p17`/`s18`) permanecem,
  **não tocados**, registrados como pendência (J6).

---

## Encerramento
- **[P]** Lotes A–C e E; **[L]** Lote D (foundation); **[B]** Lote F/migração Storage.
- **UI: não liberada.** Nenhuma mudança de produção, flag, bucket, RLS, migration ou recurso remoto.
- Próximo passo: K (Codex), condicionado a autorização.
