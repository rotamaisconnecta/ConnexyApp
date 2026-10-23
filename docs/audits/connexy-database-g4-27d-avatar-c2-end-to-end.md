# G4.27D — Validação integrada do Avatar C2

> Fase **G4.27D** — validação localizada de leitura autenticada em bucket privado. Nenhuma escrita remota, nenhuma criação de usuário/perfil/objeto/sessão no remoto. `VITE_APP_SCHEMA_A_MEDIA_URL` permanece OFF. Sem alteração de `.env`/segredos/dependências/migrations/buckets/policies. Preservadas alterações preexistentes; sem commit/push. Sem reintrodução de fallback público; C-06/C-08 não alterados.

Regra de evidência: **[F]** = verificado; **[I]** = inferência; **[H]** = hipótese não comprovada.

## 1. Estado inicial do Git
| Item | Valor |
| --- | --- |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` **[F]** |
| `git status --short` | **305** entradas (pré-existentes + relatório G4.27C) **[F]** |

Alterações preexistentes preservadas. Nenhum arquivo foi descartado/revertido nesta fase. **[F]**

## 2. Inspeção da implementação (somente leitura)

| Componente | Local | Observação |
| --- | --- | --- |
| `AuthenticatedAvatarImage` | `src/components/media/authenticated-avatar-image.tsx` | Aceita apenas `profileId` (UUID validado), usa `getAvatarMediaUrl` via server fn, ignora `blob:`/`data:` locais, mostra `fallback` em falha/sem src. Nunca constrói URL pública nem usa `getPublicUrl`. **[F]** |
| Server function | `src/lib/media/avatar-media.functions.ts` | `createServerFn({method:"POST"})`, middleware `requireAppSupabaseAuth`, valida `profileId` com `z.string().uuid()`, extrai `Authorization: Bearer ...` e exige token (lança "Unauthorized: No token provided"), chama serviço com `accessToken` do request. **Não** aceita URL/path/bucket do cliente. **[F]** |
| Serviço de autorização | `src/lib/media/avatar-media-authorization.server.ts` | Requer `viewerId` autenticado (`forbidden` se null). Lê perfil pelo `loadProfile` sob sessão do viewer. Valida path canônico via `classifyAvatarRef` + `validateMediaPath`, garante `ownerId === profile.id` e bucket `avatars`. Assina via `signAvatarWithServiceRole` com TTL `180s`. Retorna `{status:'missing'|'forbidden'|'unavailable'}` ou `{status:'ready',url,expiresAt}`. Nunca persiste URL no perfil. **[F]** |
| Assinatura | `src/lib/media/avatar-media-authorization.server.ts:94`, `src/lib/media/media-server-authorization.server.ts:72` | Usa `supabaseAdmin.storage.from(bucket).createSignedUrl(path, ttlSeconds)`. Exclusivamente no servidor. **[F]** |

Consumidores verificados: `chat/*`, `feed/cards/*`, `bio/*`, etc., todos via `AuthenticatedAvatarImage`. Sem `<img>` bruto com `profiles.photo_url` em caminhos ativos. **[F]**

## 3. Fluxos efetivamente testados (mocks/unitários/integrados)

| Caso | Tipo | Resultado |
| --- | --- | --- |
| Anônimo → rejeitado antes de ler perfil/assinar | unit (mocks) | **PASS** `status:'forbidden'` **[F]** |
| Autenticado consulta seu próprio avatar canônico | unit (mocks) | **PASS** URL assinada curta duração, `expiresAt = now + 180000` **[F]** |
| Autenticado consulta avatar de outro perfil (sem checagem social explícita) | unit (mocks) | **PASS** permitido conforme contrato atual; autorização por path+owner+bucket preservada **[F]** |
| Não autenticado → recusado (endpoint/service) | unit (mocks) | **PASS** **[F]** |
| UUID inválido / caminho inválido / bucket != `avatars` / URL externa em contexto não permitido / caminho com outro owner | unit (mocks) | **PASS** → `unavailable` (fail-closed) **[F]** |
| Perfil sem avatar (`photo_url` null) | unit (mocks) | **PASS** `missing` **[F]** |
| Perfil ausente / objeto inexistente (signer retorna null) | unit (mocks) | **PASS** `unavailable` **[F]** |
| URL assinada expirada / URL pública legado no DB | unit (mocks) | **PASS** tratado: legado re-signado via path canônico; não retornado como público **[F]** |
| Erro no Storage/signer | unit (mocks) | **PASS** fail-closed → `unavailable` **[F]** |
| Nenhum erro resulta em acesso público alternativo | unit (mocks) | **PASS** (sem `getPublicUrl`, sem fallback para URL pública) **[F]** |
| URL assinada não persistida no perfil nem exposta como URL permanente | unit (mocks/inspeção) | **PASS** serviço retorna URL efêmera; componente não grava em perfil; server fn não aceita URL do cliente **[F]** |
| Assinatura exclusivamente no servidor | unit (mocks/inspeção) | **PASS** via `signAvatarWithServiceRole` (service role) no server **[F]** |
| Sessão/identidade verificadas no endpoint | unit (mocks/inspeção) | **PASS** `requireAppSupabaseAuth` + `viewerId` + token Bearer exigido **[F]** |
| Bucket privado com autenticação esperada | unit (mocks) | **PASS** fluxo assinado em bucket `avatars` **[F]** |
| Fallback local (blob/data) via componente | unit (mocks) | **PASS** renderiza diretamente, sem chamada de resolução **[F]** |
| Fallback em falha (sem src/erro de carga) | unit (mocks) | **PASS** componente retorna `fallback` **[F]** |

## 4. Comandos, testes e resultados reais

| Comando | Resultado |
| --- | --- |
| `bun test tests/avatar-media-authorization-g4-23.test.ts tests/avatar-media-g4-21.test.ts tests/avatar-canonical-contract-g4-26b.test.ts tests/avatar-canonical-guard-sql-g4-26d.test.ts` | **40 pass / 0 fail** (113 expect()) **[F]** |
| `bun test tests/avatar-canonical-guard-sql-g4-26d.test.ts tests/avatar-canonical-contract-g4-26b.test.ts` | **14 pass / 0 fail** (40 expect()) **[F]** |
| `./node_modules/.bin/tsc --noEmit` | **exit 0** **[F]** |
| `git diff --check` | **exit 0** **[F]** |

## 5. Distinção entre tipos de teste
| Tipo | Utilizado | Observação |
| --- | --- | --- |
| Unitários com mocks (serviço/componente) | Sim | Cobrem todos os casos acima, inclusive fail-closed e fallback. **[F]** |
| Supabase local (SQL/guard) | Sim (em transação com ROLLBACK) | Guard efetivo G4.26B+G4.27B testado contra PostgreSQL local 17.6; nada persistido. **[F]** |
| Ponta a ponta com Storage real (upload/assinatura/download em bucket privado) | **Não executado** | Não há fixtures/ambiente configurado para criar objeto no bucket privado local nem para testar renderização real da imagem. Não substituído por mocks. Classificado como **ponta a ponta pendente**. **[F]** |

## 6. Riscos residuais
- **E2E real indisponível:** Sem Storage local com objeto válido e cliente autenticado em fluxo completo, não é possível demonstrar "carregamento da imagem" real — apenas resolução para URL assinada e lógica de fallback. **[F]**
- **CDN/cache/URLs antigas:** Fora do escopo local; não verificável. **[H]**
- **C-06/C-08:** Decisões pendentes, não alteradas nesta fase. **[F]**
- **Sem perfis/objetos remotos:** Remoto segue sem dados (conforme G4.27A); validação remota V1–V11 não executada. **[F]**

## 7. Confirmação
- Nenhuma escrita remota realizada. **[F]**
- Sem alteração de políticas/buckets/migrations remotas, sem habilitar `VITE_APP_SCHEMA_A_MEDIA_URL`. **[F]**
- Sem reintrodução de fallback público; assinatura exclusiva no servidor. **[F]**
- Alterações preexistentes intactas; sem commit/push. **[F]**

## 8. Conclusão
O percurso lógico (auth → validação → path canônico/owner/bucket → assinatura server-only com TTL curto → componente com fallback) está **implementado e coberto por testes com mocks + guard SQL local**. O **fluxo real de Storage com bucket privado e carregamento efetivo da imagem** não pôde ser demonstrado nesta fase por limitação de infraestrutura local/fixtures; este item permanece **pendente de validação ponta a ponta**. Os critérios de segurança (fail-closed, sem URL pública, sem URL persistida, sem aceite de path/URL do cliente) estão **satisfeitos** pelos testes e pela inspeção.
