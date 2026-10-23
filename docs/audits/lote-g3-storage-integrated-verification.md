# Lote G3 — Verificação integrada de mídia e inventário remoto (somente leitura)

Data: 2026-10-12 · Tipo: auditoria integrada **local** + tentativa de inventário remoto somente-leitura.
HEAD `16f8c6b` inalterado. **C2 e C6 permanecem abertos.**

> **Resumo:** os testes integrados locais de C6 foram executados e passaram (10/10), incluindo a
> **comprovação de uma lacuna de confidencialidade**: um usuário autenticado consegue baixar o objeto
> de uma publicação `PRIVATE` de outro usuário porque a policy de SELECT de `storage.objects` é
> **bucket-wide**. O **inventário remoto do projeto autorizado não pôde ser executado**: a única
> conexão configurada aponta para um projeto **fora do escopo** e não há credencial utilizável para
> `rsukwuqocgjmwwuwtqaf`. Nada remoto foi alterado.

## 1. Veredito geral

- **Núcleo de autorização (G1–G1.4):** funciona conforme desenhado em nível de aplicação — valida
  dono, bucket×tipo, identidade registrada na linha, TTL e flag. Comprovado por testes integrados
  locais reais.
- **Storage:** **NÃO protegido**. As leituras continuam amplas por bucket (autenticado) e os buckets
  seguem públicos. A camada de aplicação não protege o **objeto** — apenas a decisão de assinar.
- **Inventário remoto:** **BLOQUEADO** (conexão apontando para projeto fora do escopo).
- **C6:** **parcialmente verificado** — os cenários de autorização/assinatura passaram contra a stack
  local, mas as hipóteses sobre `/object/public/` ignorar RLS e sobre bloqueio de auto-assinatura
  pós-revogação só podem ser fechadas com controle de bucket real (C2).
- **C2:** **aberto**.

## 2. Estado Git antes/depois

| | Antes | Depois |
| --- | --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` | idem |
| HEAD | `16f8c6b` | `16f8c6b` |
| `git status --porcelain` | 212 linhas (118 rastreadas) | +2 não rastreados |

Rastreados/alterados preexistentes: **inalterados**. Nenhum `reset`/`clean`/checkout destrutivo,
nenhum commit/push. Únicos arquivos novos desta fase:
`tests/media-authorization-live-g3.test.ts` e este relatório.

## 3. Testes executados, comandos e resultados reais

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Unitários de mídia (G1/G1.2/G1.4) | `bun test tests/media-*.test.ts` | **60 pass / 0 fail** |
| Integrados locais C6 | env local + `bun test tests/media-authorization-live-g3.test.ts` | **10 pass / 0 fail** |
| Suíte completa | `bun test` | **1061 pass / 32 skip / 0 fail** (o skip inclui os integrados sem env) |
| Tipos | `bunx tsc --noEmit` | exit 0 |
| Lint (arquivo novo) | `bunx eslint tests/media-authorization-live-g3.test.ts` | 0 erros |

Limpeza dos recursos sintéticos verificada por consulta somente-leitura (via `psql` no container
local): `auth.users like 'g3%' = 0`, `posts text='g3 synthetic' = 0`, objetos recentes em
`bio-media` sob `%/media/%` = 0. Nenhum dado preexistente foi removido.

> Os testes integrados usam a stack Supabase **local** (`127.0.0.1:54321`) via chaves locais já
> existentes. Não tocam nenhum projeto remoto. O prefixo de containers local é citado apenas como
> infraestrutura de desenvolvimento.

## 4. Matriz dos 16 cenários de C6

Classificação: **Comprovado** (teste real), **Parcial** (evidência sem condição relevante),
**Não verificado** (infra/acesso), **Reprovado** (inseguro demonstrado).

| # | Cenário | Classe | Evidência |
| --- | --- | --- | --- |
| 1 | Sem sessão não recebe URL assinada | Comprovado | `C6-1` integrado (viewerId null → `forbidden`) |
| 2 | Proprietário assina PUBLIC/CONNECTIONS/PRIVATE próprios | Comprovado | `C6-2` integrado (`ready` nos três) |
| 3 | Desconectado não obtém CONNECTIONS/PRIVATE | Comprovado | `C6-3` integrado (`forbidden`) |
| 4 | Conectado obtém CONNECTIONS | Comprovado | `C6-4` integrado (`ready`) |
| 5 | Mudança de privacidade/desconexão bloqueia novas assinaturas | Parcial | Desconexão comprovada (`C6-5`); mudança de privacidade não executada |
| 6 | Bucket/path arbitrário não é assinado sem validar contra o registro | Comprovado | `C6-6` integrado (`missing`) |
| 7 | Path de outro usuário é rejeitado | Comprovado | `C6-7` integrado (`forbidden`, owner ≠ autor) |
| 8 | Bucket incompatível com o tipo é rejeitado | Comprovado | `C6-8` integrado (`forbidden`, avatars×video) |
| 9 | Ausência de objeto não concede acesso | Comprovado | `C6-9` integrado (não-`ready`) |
| 10 | TTL efetivo ≤ 300s | Comprovado | `C6-10` integrado (TTL observado ∈ [60,300]) |
| 11 | URL expirada deixa de funcionar | Comprovado | `C6-11` integrado (TTL 1s → fetch falha) |
| 12 | Cache não mistura autorizações entre usuários/sessões | Parcial | Unitário G1.4 (escopo obrigatório/isolamento); **sem endpoint real** |
| 13 | Flag desligada impede novas assinaturas | Comprovado | `C6-13` integrado (`unavailable`, 0 chamadas a `sign`) |
| 14 | Nenhum token nos logs | Comprovado | `C6-14` integrado (captura de console + scan do fonte) |
| 15 | Invalidação impede reaproveitar resolução obsoleta | Parcial | Unitário G1.4 (geração/anti-repopulação); sem integração |
| 16 | Acesso direto a objeto separado do acesso à linha | **Reprovado (organização)** | `C6-16` integrado: linha `PRIVATE` invisível a B, mas **B baixa o objeto** |

### Lacuna comprovada (C6-16) — risco de confidencialidade

Com a policy atual `Reels/Bio/Avatars … authenticated read USING (bucket_id='…')`, **qualquer**
usuário autenticado assina/baixa **qualquer** objeto do bucket, independentemente da privacidade da
publicação. O teste comprova: B não vê a linha `PRIVATE` de A (`select … = null`) mas
`storage.from('bio-media').download(pathA)` retorna **sem erro**. Isso é **mais amplo** que a RLS de
`posts` (`posts_select_privacy`) e é a lacuna central que C2/D-M3 deve fechar.

## 5. Inventário remoto agregado por bucket

**NÃO EXECUTADO — bloqueado.** A identidade do projeto autorizado foi confirmada, mas a conexão de
leitura não está disponível.

- Identidade `rsukwuqocgjmwwuwtqaf` / `connexy-mvp` confirmada por **duas** fontes de metadados do
  CLI Supabase: `supabase/.temp/project-ref` (`rsukwuqocgjmwwuwtqaf`) e
  `supabase/.temp/linked-project.json` (`{"ref":"rsukwuqocgjmwwuwtqaf","name":"connexy-mvp"}`).
- `supabase/.temp/pooler-url` aponta para `aws-0-sa-east-1.pooler.supabase.com`,
  `postgres.rsukwuqocgjmwwuwtqaf`, **sem senha** — não é utilizável.
- `.env` contém `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`, mas o host resolve para
  **`lzejdgfvtybarpbgwsyp.supabase.co`** — projeto **fora do escopo** desta fase. Requisições
  somente-leitura de verificação (`/auth/v1/health`, `/auth/v1/settings`, `/storage/v1/bucket`,
  `/rest/v1/posts`) retornaram **401/400** (credencial não aplicável ao projeto autorizado). Nenhuma
  escrita foi realizada; as tentativas foram GETs sem efeito.
- Como não há conexão de leitura para `rsukwuqocgjmwwuwtqaf` e **não** devo instalar/solicitar/criar
  credenciais, a Parte B foi encerrada sem alterar nada. **Buckets, `public`, contagens, prefixos,
  MIME/tamanhos e extensões remotos permanecem NÃO VERIFICADOS.**

## 6. Políticas observadas (estáticas, locais) e limites do verificado

Observado em migrations locais (não é prova do estado remoto):

- SELECT `storage.objects` por bucket + papel `authenticated`, **sem** filtro de dono/publicação —
  `avatars`, `bio-media`, `reels-media` (`20260825025843`, `20260825025605`).
- INSERT/UPDATE/DELETE por pasta do dono (`foldername(name)[1] = auth.uid()`).
- Buckets `public = true` (`supabase/config.toml` + INSERTs em migrations) → URL pública ignora RLS.

Limites: configuração lida ≠ comportamento comprovado em produção; policies de produção não foram
consultadas; existência/quantidade de objetos e referências legadas não medidas.

## 7. Divergências referência × objeto

**NÃO MENSURADO** (depende da Parte B bloqueada). Não é possível afirmar quantas referências de banco
não têm objeto nem quantos objetos não têm referência. Permanecem as expectativas do Lote G2:
`profiles.photo_url` (URL pública/assinada), `bio_posts.media_url` (URL pública/externa),
`reels.video_url/poster_url` (path relativo), `posts.media` (sem identidade de Storage).

## 8. Bloqueios, limitações e riscos remanescentes

- **B1 (bloqueio):** inventário remoto impedido — conexão configurada aponta para projeto fora do
  escopo; sem credencial para o projeto autorizado.
- **R2/C2:** sem bucket privado e sem revogação de SELECT bucket-wide, a assinatura server-side
  permanece insegura/indisponível.
- **Lacuna bucket-wide (C6-16):** risco de confidencialidade comprovado.
- **Sem ponto de integração:** nenhum consumidor de produção de `createMediaResolver` /
  `createMediaUrlService` / `authorizeMediaAccess` (apenas testes). Nada foi conectado à UI; flags
  permanecem OFF.
- **URL assinada = credencial portadora:** URL já emitida continua válida até expirar/indisponibilizar
  no Storage. Mudar privacidade ou invalidar cache **não** revoga URLs já emitidas.
- **`posts.media`:** itens sem `(bucket,path)` não são resolvíveis (contrato D-M1 ainda não aplicado
  ao adapter).
- **Referências legadas fora da origem confiável** (R6) são rejeitadas (fail-closed) — exige inventário
  e backfill.

## 9. Separação explícita entre C2 e C6

- **C6** (comportamento integrado de autorização/assinatura): **parcialmente verificado** em ambiente
  **local**. Comprovados: 1–4, 6–11, 13, 14, 16. Parciais: 5, 12, 15. **Não** pode ser encerrado por
  mocks/unitários nem sem o controle de bucket real.
- **C2** (mudança de Storage): **aberto**. Requer autorização explícita para `public=false`,
  revogação da SELECT bucket-wide e serverFn de assinatura. Só após isso as hipóteses não verificadas
  (acesso por `/object/public/` e bloqueio de auto-assinatura) podem ser comprovadas.

## 10. Recomendação da próxima fase

1. **Destravar o inventário remoto:** definir uma conexão de leitura autorizada para
   `rsukwuqocgjmwwuwtqaf` (sem criar credencial por conta própria) — ou autorizar explicitamente o
   uso de credencial já existente. Até então, a Parte B permanece bloqueada.
2. **Autorizar C2** para aplicar D-M3 (buckets privados + revogar SELECT bucket-wide) em ambiente
   controlado, então reexecutar C6 (1–16) para fechar os parciais e comprovar as hipóteses.
3. Antes de qualquer corte, aplicar o contrato D-M1 ao adapter de `posts.media` e o backfill de
   `photo_url`/`media_url` (G2 §8).

**Nada remoto foi alterado; C2 e C6 seguem abertos; o Storage não é declarado seguro.**
