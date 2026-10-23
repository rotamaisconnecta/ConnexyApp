# Connexy — Marco G4.6: Prontidão para validação HTTP real

## Veredito
PRONTO COM PRÉ-REQUISITOS — O registro da server function está comprovado por evidências de código e pelo acoplamento no grafo (consumidor real). Não existe caminho isolado imediato com ferramentas já instaladas para executar um runtime HTTP real sem infraestrutura externa autorizada; há pré-requisitos mínimos definidos.

## 1. Evidências atuais do registro da server function

- Arquivo: `src/lib/media/media-url.functions.ts` — define `getPostMediaUrl = createServerFn({ method: "POST" }).middleware(useAppSupabaseAuth).validator(...).handler(...)` retornando resultado via `service.getMediaUrl`.
- Middleware real: `src/lib/supabase/auth-middleware.ts` (`useAppSupabaseAuth`) injeta `Authorization: Bearer` (via `getRequestHeader`), extrai token, chama `supabase.auth.getUser(token)`, anexa `context.supabase`/claims; em DEV com Supabase não configurado devolve `null` user (comportamento documentado).
- Consumidor real conectado: `src/lib/media/post-media-signer.ts` importa `getPostMediaUrl` e o chama com `{ data: { postId, locator: {kind:"identity", bucket, path} } }`. Esse import é alcançado pelo código cliente do consumidor (`PostMediaFrame` → `useSecurePostMediaUrl` → `post-media-signer`).
- Build-graph: scan estático (`tests/media-post-consumer-g4-5.test.ts`) comprova que `post-media-signer.ts` é o único importador não-função em `src/` de `getPostMediaUrl`. Portanto, em qualquer build que inclua o consumidor, a função entra no grafo de módulos do TanStack Start.
- Grafo TanStack Start: server functions são coletadas/registradas pelo compilador/runtime do TanStack Start (Vinxi/TanStack) com base em `createServerFn`. Não há rota HTTP manual criada; registro é feito pelo framework. Não foi encontrado manifesto estático que liste `getPostMediaUrl` no repositório atual — o registro é derivado do grafo, não de arquivo gerado versionado.

## 2. Estado e atualidade dos artefatos de build

- Sem `.output/`, `.vinxi/`, `.tanstack/` versionados. Pastas ignoradas por `.gitignore`.
- Build disponível via `package.json.scripts.build`: `vinxi build` (conforme `package.json`).
- Testes: `bun test` (1180 testes, 1134 pass, 0 fail).
- TypeScript: `tsc --noEmit` sem erros.
- Código-fonte atual reflete G4.5 (consumidor conectado). Artefatos desatualizados não foram utilizados como prova.

## 3. Contrato de autenticação (sem executar requests)

- Método: POST (definido por `createServerFn({ method: "POST" })`).
- Entrada: `{ postId: z.string().uuid(), locator: { kind: "identity", bucket: path-bucket, path } }` (validador em `media-url.functions.ts`).
- Autenticação: `Authorization: Bearer <access_token>` enviado pelo cliente TanStack Start ao invocar a server fn (o middleware lê header). `auth-middleware` usa token para `supabase.auth.getUser(token)`.
- Sem token: `getUser(null/undefined)` → `user` null; comportamento depende do serviço (`createServerMediaUrlService`) e das regras (pode retornar `forbidden`/`unavailable` conforme autorização RLS/serviço). Não presumir 401/403 sem contrato definitivo.
- Token inválido/expirado: `getUser` falha/retorna inválido → contexto sem user válido; espera-se negação fechada (nunca fallback público).
- Claims/visão: serviço usa leitor RLS via `createSchemaARlsReader` (server-only) e resolve acesso por `postId` + locator. Autorização decide `ready|forbidden|missing|unavailable`.
- Diferenciação: autenticação (token/sessione válida?) vs autorização (visão da mídia). Falha de auth deve resultar em negação, não em vazamento. Contrato preciso exige runtime real.

## 4. Comandos propostos (não executados quando dependem de infraestrutura)

**Build (seguro):**
```bash
bun run build
```
- Verifica se grafo inclui consumidor e compila. Não inicia runtime/serviços.

**Inspeção de artefatos gerados (após build):**
```bash
find .output -name '*.mjs' -not -path '*/node_modules/*' | xargs grep -l 'getPostMediaUrl\|media-url.functions' 2>/dev/null | head -5
find .vinxi -name '*.mjs' 2>/dev/null | xargs grep -l 'post-media-signer' 2>/dev/null | head -5
```
- Só executável após `build`. Não executado nesta fase (não autorizado a alterar estado).

**Runtime isolado (hipotético):**
- Preset/runtime: Vinxi (via `vinxi build` + `vinxi start` ou script `vinxi preview` se presente). `package.json` tem `dev` via `vinxi dev`. Não identificado script `start`/`preview` explícito — requer confirmação em `package.json` antes de uso.
- Porta: não comprovada (padrão Vinxi varia). Só confirmar via config atual.
- Não iniciar `vinxi dev`/preview nesta auditoria.

**Observação:** Nenhum comando que inicie stack local existente, containers, Supabase local/remoto foi proposto para execução.

## 5. Infraestrutura mínima necessária para HTTP real

- Runtime TanStack Start funcional (build + servidor HTTP gerado).
- Configuração pública coerente (Supabase URL/anon publishable) válida para o ambiente de teste (sem segredos em client). Não editar `.env`.
- Backend Supabase autorizado para teste (projeto distinto). **Projeto remoto autorizado para eventual validação futura:** `rsukwuqocgjmwwuwtqaf`. **Não utilizar** `lzejdgfvtybarpbgwsyp`. Nenhuma operação remota autorizada neste marco.
- Usuários sintéticos A e B com credenciais de teste isoladas.
- Publicações e objetos de mídia em bucket autorizado, isolados (cleanup restrito).
- Mecanismo para obter access token válido (login/test) sem expor segredos.
- Storage acessível ao backend de teste (G4.2 permanece relevante).

## 6. Matriz mínima de testes HTTP (planejada, não executada)

| # | Cenário | Pré-condições | Request esperado | Resultado esperado | Evidência necessária |
|---|----------|---------------|-----------------|--------------------|-----------------------|
| 1 | Endpoint não registrado | build gerado, servidor iniciado | POST para endpoint de `getPostMediaUrl` (descobrir path real via manifesto/servidor) | 404/rota não mapeada OU framework responde que função não registrada | path real registrado + resposta HTTP |
| 2 | Sem Bearer token | servidor + endpoint registrado | POST com body válido, sem `Authorization` | Negação fechada (sem URL). Não 200 com dados. | status + corpo (sem URL) |
| 3 | Token inválido/expirado | servidor + endpoint registrado | POST com `Authorization: Bearer invalid` | Negação fechada | status + corpo |
| 4 | Usuário A acessa mídia própria (autorizado) | A logado, post próprio com mídia canônica | POST com token A, `postId` próprio + locator válido | `ready` + URL assinada (ou conforme regras) | status + corpo com `status:"ready"` + `url`/`expiresAt` |
| 5 | Usuário B acessa mídia privada de A | B logado, A tem mídia privada | POST com token B | `forbidden` (sem URL pública) | status + corpo `forbidden` |
| 6 | Publicação restrita a conexões sem conexão | usuários sem conexão, privacidade CONNECTIONS | POST com token B | `forbidden` | `forbidden` |
| 7 | Caminho adulterado | qualquer token válido | locator com `path` inválido/adulterado | `forbidden`/`missing` (fechado) | negação, sem URL |
| 8 | Backend indisponível/falha assinatura | simulado via estado (se possível) ou backend mockado? | qualquer válido | `unavailable` (mapeado por catch) | `unavailable` |
| 9 | URL assinada expirada (lógica) | resposta com `expiresAt` passado | validação cliente/servidor | re-assina (cache expira) — cobre mapeamento TTL | comportamento conforme G4.5 |

*Não inventados códigos HTTP: somente após obter contrato real.*

## 7. Critérios para autorizar fase seguinte (execução HTTP real)

1. Autorização explícita para executar build+runtime isolado (não usar stacks existentes).
2. Definir projeto Supabase de teste autorizado (preferencial `rsukwuqocgjmwwuwtqaf`). Não `lzejdgfvtybarpbgwsyp`.
3. Confirmar script de start/preview válido em `package.json` (ou comando exato Vinxi).
4. Disponibilizar mecanismo seguro para obter tokens de teste (sem segredos no relatório/chat).
5. Isolar dados de teste (cleanup restrito). Sem ativar `VITE_APP_SCHEMA_A_MEDIA_URL`.
6. Plano de abort se health check/migration falhar (conforme restrições G4).

## 8. Riscos pendentes

- Registro efetivo via build real: precisa de `bun run build` + inspeção de `.output`/`.vinxi`.
- Autenticação real: `getUser(token)` exige Supabase configurado e token válido.
- Storage/RLS: G4.2 bloqueia validação completa; G4.3 define plano.
- Infra não autorizada nesta fase: nenhuma operação remota/containers.
- Não existe rota artificial proposta (correto).

## 9. Inspeções realmente executadas

- Leitura: `media-url.functions.ts`, `auth-middleware.ts`, `post-media-signer.ts`, `post-media-resolver.ts`, `use-secure-post-media-url.ts`, `post-media-frame.tsx`, consumidores (G4.5).
- Leitura relatórios: G4.5, G4.4, G4.3, G4.2.
- Verificação estática: acoplamento via scan (test G4.5) — comprova import real.
- Typecheck: `tsc --noEmit` OK.
- Testes: 1134 pass/0 fail.
- Nenhum build executado, nenhum servidor iniciado, nenhum request HTTP enviado.

## 10. Estado Git

- Branch: `backup/connexy-snapshot-2026-10-02` (conforme ambiente).
- Alterações staged/unstaged/untracked preexistentes: preservadas integralmente.
- Novos arquivos neste marco: `docs/audits/connexy-database-g4-5-first-media-consumer.md` (criado agora) e `docs/audits/connexy-database-g4-6-http-readiness.md` (criado agora).
- Código-fonte modificado em G4.5: 4 novos + 2 editados (já existentes). Nenhum commit/push/reset/clean.

## Conclusão
**PRONTO COM PRÉ-REQUISITOS.** Próximo passo válido: após autorização explícita, executar `bun run build`, inspecionar artefatos para confirmar registro, definir projeto Supabase de teste autorizado (`rsukwuqocgjmwwuwtqaf`) e obter tokens isolados — sem ativar flags e sem tocar em infraestrutura existente. Nenhuma validação HTTP real foi realizada nesta fase.
