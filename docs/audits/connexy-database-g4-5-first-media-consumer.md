# Connexy — Marco G4.5: Primeiro consumidor real de mídia assinada

## Objetivo
Integrar o fluxo real de exibição de anexos de posts ao serviço `getPostMediaUrl` (G1/G4), atrás da flag `VITE_APP_SCHEMA_A_MEDIA_URL` (desligada por padrão), com consumidor real conectado, reversível, testado e sem ativação da flag.

## Veredito
APROVADO — consumidor real conectado ao build; encaminhamento condicionado à flag + dados reais (UUID + mídia canônica). Nenhuma ativação de flag, nenhuma operação remota Supabase.

## Contexto e base
- G4.4: CONSUMIDOR REAL AUSENTE (recomendado Opção A). 
- G4.2/BLOQUEADO, G4.3/PLANO PRONTO (execução bloqueada). HTTP/Storage não validados em runtime.
- `getPostMediaUrl` é server fn (`createServerFn({method:"POST"})`) com locator `identity` `{bucket,path}` e exige `postId` UUID. Retorna `MediaUrlResult` com estados `ready|forbidden|missing|unavailable`.

## Arquivos criados
- `src/lib/media/post-media-resolver.ts` — puro (sem demo/UI/Supabase). Classifica (`isCanonicalPostMedia`, `classifyPostMediaItem`, `listPostMediaRefs`), política `shouldUseSecurePostMedia` (flag ON + viewerId + postId UUID + item canônico), mapeamento `mediaUrlResultToSignResult` (TTL derivado de `expiresAt`, clamp 0..300s, fail-closed), wrapper `createPostMediaResolver` amarrando `sign` a `postId`.
- `src/lib/media/post-media-signer.ts` — **único consumidor de runtime** de `getPostMediaUrl`. Converte `CanonicalMediaObject` em locator `{kind:"identity", bucket, path}` e chama `getPostMediaUrl({ data })`. Garante acoplamento no grafo de build.
- `src/hooks/use-secure-post-media-url.ts` — hook com cache compartilhado por `Map`, escopo = `viewerId` (isolamento entre usuários), `active` indica desvio para rota segura mesmo com `url` null, fail-closed.
- `src/components/media/post-media-frame.tsx` — fronteira escopada apenas a anexos de posts. Se `secure.active` → renderiza apenas URL segura (sem fallback público). Senão → delega exatamente a `LocalMediaFrame` (legado intacto).

## Arquivos editados
- `src/components/post/demo-post-detail.tsx` — troca `LocalMediaFrame` por `PostMediaFrame`, injeta `viewerId` via `useAuth()`, passa `postId={post.id}`.
- `src/routes/_app.perfil.index.tsx` (`DemoPostTile`) — idem, adiciona `useAuth()` no tile.

## Consumidor escolhido
`DemoPostDetail` + `DemoPostTile` (anexos de posts no perfil). Únicos pontos que renderizam `DemoPost.media[]`. Chat não tocado para evitar ampliar escopo.

## Comportamento por flag
- OFF (padrão): `shouldUseSecurePostMedia` falso → legado inalterado. Nenhuma chamada ao servidor.
- ON (+ auth remoto + Supabase público): itens canônicos com `postId` UUID + espectador autenticado → encaminham a `getPostMediaUrl`. Dados demo atuais (`demo-post-...`) nunca ativam o caminho seguro (pré-requisito de dados).

## Testes
Criado `tests/media-post-consumer-g4-5.test.ts` (21 testes, verdes):
- Elegibilidade/canonização, gating, binding de identidade (`postId` + locator), não encaminha legado/local, fail-closed (forbidden/missing/unavailable/throw), defesa em profundidade (path adulterado → forbidden), isolamento por escopo/usuário, expiração com re-sign, mapeamento TTL (clamp 0..300, default), scan estático comprovando `post-media-signer.ts` importa `getPostMediaUrl` (importador não-função em src), verificação de módulo cliente (não `.server.ts`).

Suite completa: 1134 pass / 0 fail / 46 skip.

## Qualidade
- `tsc --noEmit`: sem erros.
- Lint nos arquivos novos/alterados: limpo (apenas 2 erros de formatação pré-existente em arquivos não tocados).
- Não ativação de flags, não operações remotas, não alteração de contratos.

## Estado Git (antes/depois)
- Antes: branch `backup/connexy-snapshot-2026-10-02`, muitas mudanças preexistentes (staged/unstaged/untracked). Preservadas.
- Depois: 4 novos arquivos + 2 editados. Nenhum commit/push/reset/clean executados.

## Riscos e observações
- Ativação só ocorre com dados reais (UUID + `(bucket,path)` canônico). Isso é esperado (R-1 de G4.4).
- `LocalMediaFrame` permanece compartilhado com chat (não alterado) — escopo correto.
- HTTP/Storage real ainda não validados (bloqueios G4.2/G4.3) — não afirmado neste marco.

## Conformidade com restrições
Respeitadas todas as 13 restrições: sem alteração de env/.env.example/supabase/config.toml/migrações, sem operações remotas, sem ativação de flags, sem novos endpoints artificiais, preservação de alterações preexistentes, sem commit/push/reset destrutivo.
