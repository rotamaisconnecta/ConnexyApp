# Connexy — G4.23: resolução autenticada de avatares

Data: 2026-10-15 · Tipo: **IMPLEMENTAÇÃO LOCAL + TESTES OFFLINE** · Branch `backup/connexy-snapshot-2026-10-02` · HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` (inalterado).

## A. Veredito

**APROVADA COM RESSALVAS.**

A resolução autenticada curta foi implementada server-side, com leitura da linha do perfil sob RLS e validação do caminho/bucket/dono antes da assinatura. A autenticação basta; nenhuma relação social é consultada. Foram conectados os contextos de perfil visualizado, descoberta/lista de pessoas, feed de pessoas próximas e edição do avatar próprio.

A integração ainda não cobre todos os consumidores existentes de `profiles.photo_url`, e não foi possível validar a configuração aplicada no Storage nem a execução contra Supabase. C2 continua **ABERTA**; este incremento local não remove a leitura anônima de objetos.

## B. Estado inicial e baseline Git

- Branch inicial: `backup/connexy-snapshot-2026-10-02`.
- HEAD inicial: `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`.
- `git status --short` inicial continha um conjunto amplo de alterações staged, unstaged e untracked, incluindo `.env` staged como removido, `supabase/config.toml`, `bun.lock`, `package.json`, migrations e os arquivos G4.20–G4.22. Nenhuma dessas alterações anteriores foi descartada ou substituída. O relatório G4.22 registrava 266 entradas no baseline anterior.
- Os arquivos `avatar-media.ts`, contratos/caminhos/resolvedores de mídia, serviço de mídia de posts, teste G4.21 e relatórios G4.20–G4.22 já existiam como alterações untracked antes desta retomada; seus diffs staged/unstaged eram vazios. G4.21 era apenas um classificador offline, sem endpoint nem wiring.
- A flag `VITE_APP_SCHEMA_A_MEDIA_URL` não foi alterada nem habilitada.

## C. Inventário do trabalho parcial

- **Concluído anteriormente:** `avatar-media.ts` classifica ausente, local, externo, Storage público/assinado, caminho canônico e referências inválidas; reaproveita `parseStorageUrl` e `validateMediaPath`. Testes G4.21 cobrem esse contrato offline.
- **Já disponível e reaproveitado:** middleware `requireAppSupabaseAuth` valida Bearer JWT no servidor; `createSchemaAClient` aceita token da sessão; o Storage signer privilegiado existe apenas em módulo `.server.ts` e usa import dinâmico.
- **Ausente antes desta retomada:** serviço de autorização específico para avatar, endpoint autenticado, resolução de URL curta e integração nos consumidores selecionados.
- **Não reutilizado:** `getPostMediaUrl`, `authorizeMediaAccess` e regras de privacidade/conexão de posts.
- **Consumidores ainda fora do wiring:** home, conexões/solicitações, chat, reels/comentários, presença, miniaturas secundárias de amigos e outros pontos que ainda renderizam URLs diretamente. Exigem integração incremental própria.

## D. Arquivos alterados nesta retomada

- `src/lib/media/avatar-media-authorization.server.ts` — leitura por cliente RLS, verificação de identidade do perfil, bucket `avatars`, validação do caminho/dono e assinatura de 180 segundos no servidor.
- `src/lib/media/avatar-media.functions.ts` — server function com middleware autenticado; a entrada aceita somente `profileId` UUID.
- `src/components/media/authenticated-avatar-image.tsx` — componente de resolução, fallback fechado, preservação de demo e previews locais, limpeza ao trocar sessão e descarte de respostas assíncronas obsoletas.
- `src/components/bio/bio-avatar.tsx`, `src/components/discovery/people-list-card.tsx`, `src/components/feed/FeedNearbyPeople.tsx` e `src/routes/_app.perfil.$id.tsx` — wiring nos contextos compatíveis listados em F.
- `tests/avatar-media-authorization-g4-23.test.ts` — testes offline do serviço e inspeção do contrato de entrada do endpoint.
- Este relatório — registro da implementação e das limitações.

Os arquivos preexistentes foram editados em hunks localizados; conteúdo preexistente staged/unstaged e alterações alheias foram mantidos.

## E. Fluxo efetivamente implementado

1. O middleware valida a sessão no servidor. Sem Bearer válido, a função não executa.
2. O cliente envia apenas o UUID de `profileId`; não pode escolher bucket, path ou URL.
3. O servidor cria um cliente Schema A com o token validado e busca `profiles(id, photo_url)` sob RLS. A regra é disponibilidade para qualquer usuário autenticado; nenhuma consulta de conexões é feita.
4. O valor retornado pelo banco é classificado. URLs públicas/assinadas do Storage são convertidas em identidade de caminho; caminhos canônicos também são aceitos. O bucket fica fixo em `avatars`; o primeiro segmento do caminho deve ser o UUID do próprio perfil.
5. O assinador server-only gera URL assinada por 180 segundos. Nenhuma URL nova é persistida no banco.
6. Ausência, falha de autorização, referência inválida ou erro de assinatura não produzem fallback para URL pública. A UI mostra fallback local.
7. Referências `blob:`/`data:` da edição e referências externas legadas lidas da linha do perfil permanecem compatíveis. O componente não usa URL persistida como fallback quando o perfil é UUID e a resolução autenticada falha.

O cache não foi introduzido. A troca/logout de usuário limpa o estado do componente; o cleanup do effect ignora resposta atrasada. URLs assinadas já entregues continuam sendo credenciais temporárias até seu prazo máximo de 180 segundos.

## F. Consumidores integrados e pendentes

**Integrados:**

- Perfil de terceiro aberto em `/perfil/$id`.
- Cartão de pessoa na descoberta (`PeopleListCard`).
- Cartão de pessoa no feed de proximidade (`FeedNearbyPeople`).
- Avatar próprio no editor de biografia (`BioAvatarSection`); preview local continua local.

**Pendentes:** home, lista geral de pessoas, conexões e solicitações, chat, reels e comentários, presença, avatares em sublistas do perfil e demais renderizadores identificados no G4.22. A migração desses contextos deve continuar gradual. Dados demo com IDs não UUID preservam seu caminho de exibição legado.

## G. Testes e validação

- `bun test tests/avatar-media-g4-21.test.ts tests/avatar-media-authorization-g4-23.test.ts` — **25 pass, 0 fail, 71 expect() calls**. Cobriu rejeição anônima, aceite autenticado sem conexão social, ausência, leitura de legado público/assinado expirado seguida de nova assinatura curta, bucket/path/dono inválidos, erro de assinatura, compatibilidade externa/local e ausência de URL/path fornecidos pelo cliente.
- `node_modules/.bin/eslint src/lib/media/avatar-media-authorization.server.ts src/lib/media/avatar-media.functions.ts src/components/media/authenticated-avatar-image.tsx src/routes/_app.perfil.\$id.tsx src/components/discovery/people-list-card.tsx src/components/feed/FeedNearbyPeople.tsx src/components/bio/bio-avatar.tsx tests/avatar-media-authorization-g4-23.test.ts` — **falhou** com 14 ocorrências de `@typescript-eslint/no-explicit-any` em `people-list-card.tsx`; essas ocorrências estavam no conteúdo preexistente do arquivo (o diff desta fase só adiciona o componente de imagem/import).
- Mesmo comando ESLint com `--rule '@typescript-eslint/no-explicit-any: off'` — **exit 0**; as alterações desta fase passaram as demais regras.
- `node_modules/.bin/prettier --check src/lib/media/avatar-media-authorization.server.ts src/lib/media/avatar-media.functions.ts src/components/media/authenticated-avatar-image.tsx src/routes/_app.perfil.\$id.tsx src/components/discovery/people-list-card.tsx src/components/feed/FeedNearbyPeople.tsx src/components/bio/bio-avatar.tsx tests/avatar-media-authorization-g4-23.test.ts` — **All matched files use Prettier code style!**
- `node_modules/.bin/tsc --noEmit` — **exit 0**.
- `git diff --check` — **exit 0**.

Nenhum teste de navegador ou integração com Storage foi executado. Não há evidência local para afirmar como policies/buckets estão aplicados no projeto remoto.

## H. Compatibilidade e limitações

- URLs legadas públicas e assinadas válidas são lidas do perfil no servidor e resultam em URL assinada curta; URL assinada expirada não é convertida em URL pública.
- Caminho canônico é validado antes de assinar. Caminho malformado, dono divergente ou bucket diferente é rejeitado.
- URLs locais e externas mantêm o uso compatível já existente. URLs externas continuam sendo referências de exibição, não autorização para assinar objetos do Storage.
- A política de produto implementada é “qualquer sessão autenticada pode ver qualquer avatar”, inclusive descoberta, sem exigência de conexão social.
- Como consumidores permanecem por migrar e o bucket pode continuar público, não há alegação de fechamento da exposição C2.

## I. Pendências que exigem autorização remota

Após autorização explícita para a etapa remota, ainda será necessário:

1. Confirmar o projeto de destino e inspecionar o estado aplicado de buckets e policies.
2. Planejar retirada de leitura anônima e adoção de acesso autenticado no bucket `avatars`.
3. Avaliar efeitos sobre URLs públicas legadas e realizar migração gradual de dados/consumidores.
4. Testar autenticação, assinatura curta, expiração e acesso real com usuário autenticado e anônimo.
5. Definir critérios de sucesso, monitoramento e rollback.

Nenhuma dessas operações foi iniciada nesta fase.

## J. Confirmação de limites

Não houve chamadas HTTP, acesso a serviços externos, conexão ao Supabase, execução de migration, alteração de bucket/policy/tabela/RPC/dados, edição de `.env`, `supabase/config.toml`, migration ou lockfile, ativação/alteração de flag, commit ou push. Não foi executado `reset`, `clean`, checkout destrutivo ou stash.

## K. Comparação do estado Git

- **Baseline preservado:** todas as entradas staged, unstaged e untracked observadas no início, inclusive `.env` staged como removido e os arquivos preexistentes de mídia e relatórios. HEAD e branch permaneceram iguais.
- **Novos arquivos desta fase:** `src/lib/media/avatar-media-authorization.server.ts`, `src/lib/media/avatar-media.functions.ts`, `src/components/media/authenticated-avatar-image.tsx`, `tests/avatar-media-authorization-g4-23.test.ts` e este relatório.
- **Arquivos preexistentes com novos hunks unstaged:** `src/components/bio/bio-avatar.tsx`, `src/components/discovery/people-list-card.tsx`, `src/components/feed/FeedNearbyPeople.tsx` e `src/routes/_app.perfil.$id.tsx`. No caso de `people-list-card.tsx`, a entrada staged `A` já existia no baseline; a mudança desta fase permanece adicional, sem substituir o conteúdo staged anterior.
- **Verificação final:** `git status --short` mantém as alterações anteriores e mostra os arquivos/hunks desta fase acima; nenhuma outra entrada foi removida deliberadamente. Nenhuma alteração foi staged por esta fase.
