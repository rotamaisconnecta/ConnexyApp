# Connexy — G4.24: migração controlada dos consumidores de avatares

## A. Veredito

**Aprovada localmente com ressalva de lint preexistente.** Os consumidores de perfil reais encontrados nesta fase usam o resolvedor autenticado G4.23. Os testes direcionados, `tsc --noEmit`, Prettier e `git diff --check` passaram. O ESLint sem filtros ainda aponta um `no-explicit-any` já presente no conteúdo staged de `src/routes/_app/discover.tsx`. O problema C2 continua aberto e não foi tratado nesta fase.

## B. Baseline de Git

- Branch: `backup/connexy-snapshot-2026-10-02`
- HEAD: `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`
- O repositório já tinha amplo estado staged, unstaged e untracked antes do trabalho. Incluía, entre outros, remoção staged de `.env`, alterações em `package.json`, `bun.lock`, `supabase/config.toml` e diversas fases locais. Esses itens foram preservados e não fazem parte desta fase.
- `src/routes/_app/discover.tsx` já tinha mudanças staged; o `item={item as any}` que o ESLint reporta está no blob staged inicial. Não foi criado por G4.24.
- Não houve staging, commit, reset, checkout destrutivo ou stash.

## C. Inventário dos consumidores encontrados

### Consumidores de perfil / `profiles.photo_url`

Foram inspecionados leitores, escritores, adaptadores de dados e componentes. `profile.repository.ts`, `schema-a-profile.ts` e os adaptadores continuam sendo fontes/escritores de dados e não renderizadores. O fluxo de edição de perfil continua gravando o campo já existente. Os renderizadores de perfis reais precisam receber o identificador do perfil para que a consulta autenticada aplique RLS.

Encontrados consumidores de pessoas em home, lista de pessoas, Connecta, descoberta/mapa, solicitações, conversas, cabeçalhos e avatares de thread, feed/presença e autores de publicação/Reel/comentários. Esses casos agora usam `AuthenticatedAvatarImage`.

### Referências remanescentes não migradas

- Mini listas estáticas de amizades em `_app.perfil.index.tsx` e `_app.perfil.$id.tsx`, notificações via `resolveDemoCatalogPerson`, e dados de `findPerson`/`currentUser`: são demos com identificadores próprios, sem identidade de perfil autenticável correspondente.
- Candidatos demonstrativos do convite de grupo mantêm imagens locais/dados demo; IDs não UUID não iniciam resolução remota.
- `premium-card.tsx` e `home-premium.ts` usam cartões sintéticos com `card.photo`/`person-${id}`, sem identidade real de perfil para consultar sob RLS.
- `person-detail-sheet`, detalhes de publicação mockados, componentes de carona/mobilidade e motoristas usam modelos demo, veículos ou motoristas, não `profiles.photo_url` de pessoa autenticada.
- `event-checkin` e `Hero` genérico não têm consumidores no repositório.
- Imagens de negócios, eventos, veículos, capas, anexos de publicação e posters/vídeos de Reels são contratos distintos e permaneceram inalterados.

## D. Consumidores migrados e não migrados

Migrados, preservando identidade, layout, dimensões, interação e placeholder local existentes:

- Rotas: `_app.home.tsx`, `_app.pessoas.tsx`, `_app.connecta.tsx`, `_app.solicitacao.$id.tsx`, `_app/discover.tsx`, `_app.perfil.index.tsx`.
- Descoberta: `nearby-map-item-card.tsx`, `people-list.tsx`, `person-card.tsx`.
- Conversas: `chat-header.tsx`, `thread-avatar.tsx`, `conversation-card.tsx`, `conversations-screen.tsx`, `group-invite-sheet.tsx` para dados com identidade resolvível.
- Feed e presença: `networking-card.tsx`, `post-card.tsx`, `moment-card.tsx`, `presence-live-feed-real.tsx` (somente avatar do autor/pessoa).
- Reels: `reel-card.tsx`, `reel-user.tsx`, `comments-sheet.tsx` (somente avatar do autor/comentarista; mídia mantida).

Os itens demo e genéricos listados na seção C não foram convertidos porque não oferecem um ID de perfil real que preserve o contrato. Não foi criado fallback público para contornar essas limitações.

## E. Arquivos alterados nesta fase

- Rotas: `src/routes/_app.home.tsx`, `_app.pessoas.tsx`, `_app.connecta.tsx`, `_app.solicitacao.$id.tsx`, `_app/discover.tsx`, `_app.perfil.index.tsx`.
- Componentes: `src/components/discover/nearby-map-item-card.tsx`, `src/components/discovery/people-list.tsx`, `person-card.tsx`, `src/components/chat/chat-header.tsx`, `thread-avatar.tsx`, `conversation-card.tsx`, `conversations-screen.tsx`, `group-invite-sheet.tsx`, `src/components/feed/cards/networking-card.tsx`, `post-card.tsx`, `moment-card.tsx`, `src/components/presence/presence-live-feed-real.tsx`, `src/components/reels/reel-card.tsx`, `reel-user.tsx`, `comments-sheet.tsx`.
- Teste: `tests/avatar-consumer-migration-g4-24.test.ts`.
- Relatório: `docs/audits/connexy-database-g4-24-avatar-consumer-migration.md`.

Os demais arquivos alterados no estado final pertencem ao baseline pré-existente, inclusive alterações staged e untracked de outras fases.

## F. Testes e verificações

- `bun test tests/avatar-consumer-migration-g4-24.test.ts tests/avatar-media-g4-21.test.ts tests/avatar-media-authorization-g4-23.test.ts tests/chat-conversation-evolution.test.ts tests/phase-9-conversations.test.ts tests/schema-a-profile-1h-17.test.ts tests/phase-14-reel-authorship.test.ts tests/phase-16-reels-experience.test.ts tests/media-post-consumer-g4-5.test.ts` — **9 arquivos, 101 testes passaram, 0 falharam, 398 assertions**.
- `node_modules/.bin/tsc --noEmit` — **passou**.
- `node_modules/.bin/prettier --check` com todos os arquivos alterados nesta fase — **passou**.
- `git diff --check` — **passou**.
- ESLint sem filtros, nos arquivos da fase — **falhou com 1 erro preexistente**: `src/routes/_app/discover.tsx:509:76`, `@typescript-eslint/no-explicit-any`. A forma `item as any` consta no conteúdo staged anterior à fase.
- ESLint com `--rule '@typescript-eslint/no-explicit-any: off'` — **exit 0**, com dois avisos de diretivas `eslint-disable` não utilizadas já existentes em `comments-sheet.tsx` (linhas 52 e 85). Isso não é reportado como lint limpo; serve para separar o único erro bloqueante preexistente.
- Os testes rodaram localmente sem chamadas HTTP/rede.

## G. Compatibilidade legada e limitações

`AuthenticatedAvatarImage` é o resolvedor compartilhado G4.23. Ele consulta o avatar pelo ID do perfil autenticado, deixa a autorização a cargo da leitura sob RLS e valida bucket/caminho no servidor antes de assinar por 180 segundos. O consumidor passa o ID, sem montar URL pública nem assinar diretamente. Dados locais de demonstração e previews `blob:`/`data:` mantêm seu comportamento local. Ausência, falha de autenticação ou falha de resolução resultam no placeholder/estado sem avatar existente, sem fallback público silencioso.

O componente limpa o estado ao trocar o usuário autenticado e descarta respostas assíncronas obsoletas. Não mantém cache próprio. Compatibilidade de registros legados depende de `photo_url` conter a referência que o resolvedor existente aceita; valores públicos antigos incompatíveis aparecem como avatar ausente até serem tratados em uma fase autorizada. Nenhuma mudança de schema foi necessária.

## H. Comparação final com o baseline

Baseline: branch e HEAD da seção B, com ampla alteração preexistente staged/unstaged/untracked. Final: mesma branch e mesmo HEAD. As mudanças desta fase estão apenas no conjunto de consumidores e nos dois arquivos novos (teste e relatório) listados na seção E; o arquivo de descoberta já staged no baseline continua staged e recebeu somente sua modificação de trabalho adicional. Nenhum conteúdo anterior foi revertido ou substituído deliberadamente; `.env`, `supabase/config.toml`, dependências, lockfile e alterações alheias foram preservados sem edição nesta fase. `git diff --check` não encontrou whitespace inválido.

## I. Operações remotas

Não houve chamadas HTTP, conexão de rede, acesso/vínculo ao Supabase remoto, login, migration, SQL, operação de bucket, push ou commit. Nenhum arquivo de ambiente, configuração Supabase, flag, bucket ou policy foi alterado nesta fase.

## J. Próximos passos para C2

C2 permanece pendente e requer fase remota separada com autorização explícita: confirmar o estado realmente aplicado de buckets e policies; preparar a migração controlada dos buckets de avatar para acesso privado; remover acesso anônimo e referências públicas antigas quando a compatibilidade e os dados permitirem; validar acesso autenticado, expiração curta e revogação; e registrar o resultado remoto. Esta fase não declara C2 corrigida.
