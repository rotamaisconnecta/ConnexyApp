# RELATÓRIO — FASE 3A: Feed vertical de Reels com contexto Connexy

> ConnexyApp · Implementado sem migrations, sem RPCs, sem RLS, sem novo schema/Supabase e sem instalar novas dependências. Os dados continuam simulados (`src/lib/reels/reel-mocks.ts`, `src/lib/mock-data.ts`) e o estado do usuário (curtidas, comentários, preferência de som) persiste em `localStorage` (chaves `connexy:reels:*:v1`). Sem IA, sem edição, sem live/monetização, anúncios ou download.

## Resumo

1. **Playback inteligente** — o feed agora usa um único `IntersectionObserver` (threshold 0.6) para detectar qual Reel está em foco: somente **um vídeo toca por vez**, a reprodução é retomada ao voltar para a aba (`visibilitychange`) e nenhuma rejeição de `video.play()` vaza para o console/estado.
2. **Persistência real em `localStorage`** — curtidas, comentários (por reel) e preferência de som sobrevivem ao recarregar a página (antes: estado local volátil).
3. **Compartilhamento real** — sheet reescrito com WhatsApp (`wa.me/?text=`), copiar link (com fallback `execCommand`) e share nativo (`navigator.share`), reutilizando a infra da Fase 2 (`share-connexy.ts`) e a rota real `/reels/$reelId`.
4. **Contexto Connexy** — cada Reel ganha badge/distância/ação contextual (perfil, evento, local, negócio, oferta, corrida) com navegação tipada para as rotas reais (`/perfil/$id`, `/local/$id`, `/business/$businessId`, `/event/$eventId`, `/ride`).
5. **Multi-vídeo** — Reels com `videos: string[]` exibem indicadores (dots) e alternância de segmento; `reel-001` e `reel-005` são exemplos com 2 vídeos Pexels.
6. **Busca funcional** — o botão de busca (que era no-op) abre uma barra de busca que filtra por nome, hashtag, local, negócio e evento (`filterReels`), com estado vazio diferenciado.

## Arquivos novos

| Arquivo | Papel |
|---|---|
| `src/hooks/use-active-reel-playback.ts` | `useActiveReelPlayback()` — observer compartilhado no módulo (threshold `0.6`, exportado `reelPlaybackThreshold`), retorna `{ containerRef, isActive, paused, setPaused, shouldPlay }`; pausa/retoma em `visibilitychange`; limpeza correta no unmount. |
| `src/lib/reels/reel-local-storage.ts` | Persistência `localStorage` com chaves `connexy:reels:likes:v1`, `connexy:reels:comments:v1`, `connexy:reels:sound:v1`. Parse seguro com fallback `{}`, tolerante a `localStorage` indisponível/cheio; nunca armazena vídeo/base64. |
| `src/lib/reels/reel-context.ts` | `ReelContextTarget` (`perfil/evento/local/negocio/oferta/corrida` + id) e `getReelContext(reel)` → `{ badge, distance, actionLabel, actionTarget, authorTarget }`. |

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/reels/reel-types.ts` | Campo opcional `videos?: string[]` na interface `Reel` (fonte primária continua `videoUrl`). |
| `src/lib/reels/reel-mocks.ts` | Reescrito: 15 reels (`reel-001…reel-015`) ancorados em ids reais de pessoas/locais/negócios/eventos/motoristas; `reel-001` e `reel-005` com `videos` (2 cada); export `findReelById(id)`. |
| `src/lib/reels/reel-share.ts` | `buildReelShareMessage(caption?, reelId?)`, `getReelShareUrl` = `${getConnexyAppUrl()}/reels/${reelId}`, `getReelShareLink`, `getReelWhatsAppUrl`; `getShareMockUrl` passa a usar a rota real. |
| `src/components/reels/reel-share-sheet.tsx` | Share real: WHATSAPP → `window.open(wa.me)`; COPY_LINK/INSTAGRAM/CHAT → copiar texto com fallback; OTHER → `navigator.share` com tratamento de `AbortError`; toasts `sonner`. |
| `src/components/reels/reel-player.tsx` | Substitui o controle por `activeIdx`/`currentTime = 0` pelo `useActiveReelPlayback`; tap único alterna pause, double-tap curte; dots de multi-vídeo (acessíveis, com `aria-label`); `onOpenProfile` → `onOpenContext`. |
| `src/components/reels/reel-overlay.tsx` | Seção de contexto (badge + distância + idade), autor navegável, tags, local, e cartões clicáveis de negócio/evento/motorista/oferta + botão de ação contextual. |
| `src/components/reels/reel-actions.tsx` | Avatar do autor agora navega (`onOpenAuthor`), corrigindo o `onClick={() => {}}` apontado na auditoria. |
| `src/components/reels/reels-feed.tsx` | Remove `active`/`onOpenProfile`; repassa `onOpenContext` ao player (um vídeo por vez agora é garantido pelo observer). |
| `src/routes/_app.reels.tsx` | Integração: som inicial vem da preferência salva e é persistido; curtidas via `likeMap` do storage; comentários por reel (`commentMap` + seeds de `reel-001`); busca funcional com estado vazio diferenciado; `handleOpenContext` com navegação tipada; deep-link mantido via `/reels/$reelId`. |
| `src/routes/_app/reels/$reelId.tsx` | Like e som persistidos no storage; autor/entidades navegáveis (perfil, local, negócio, evento, corrida); "Reel não encontrado" mantido. |

## Playback (`useActiveReelPlayback`)

- Um `IntersectionObserver` (módulo) observa o `section` de cada Reel; `isActive` muda apenas quando `entry.target` é o elemento do hook.
- `shouldPlay = isActive && pageVisible && !paused` → o `video.play()` é chamado sem som (`muted` gerenciado pela página), com `.catch` que nunca propaga rejeição.
- `visibilitychange`: aba oculta pausa; ao voltar, retoma se o Reel continua em foco e não está pausado manualmente.
- Scroll não reinicia o vídeo (progresso preservado); multi-vídeo reinicia apenas o segmento trocado.
- Barras de progresso (`ReelProgress`/bottom bars) seguem usando `activeIdx` derivado do scroll.

## Persistência (`reel-local-storage`)

- **Curtidas**: `getReelLikes()`, `isReelLiked()`, `toggleReelLike(id)` → `{ reelId: boolean }`; contagem exibida = base do mock + 1 quando curtido (sem dupla contagem mesmo se o mock tiver `likedByMe: true`).
- **Comentários**: `getReelComments()`, `getCommentsForReel(id)`, `addReelComment(id, text)` (valida não-vazio, colapsa espaços, máx. 280 chars, autor = `currentUser`), `toggleCommentLike(reelId, commentId)`. Feed mostra seeds de `reel-001` + comentários salvos daquele reel.
- **Som**: `getStoredSoundPref()` (padrão: mudo) / `setStoredSoundPref(muted)` — `"on"`/`"off"` em `connexy:reels:sound:v1`.
- Tudo com `safeGet`/`safeSet` (try/catch) e validação de tipos no parse.

## Contexto Connexy (`reel-context`)

| Categoria | Badge | Distância | Ação | Destino |
|---|---|---|---|---|
| perfil / momento | "Perto de você" | "Bem próximo" | "Conhecer perfil" | `/perfil/$id` |
| evento | "Acontecendo agora" (hoje) / `Em DD/MM` | — | "Ver evento" | `/event/$eventId` |
| local | "Bem próximo" (< 1 km) | — | "Ver local" | `/local/$id` |
| negócio | "Bem próximo" (< 1 km) | — | "Ver negócio" | `/business/$businessId` |
| oferta | "Hoje" / `Até DD/MM` | — | "Ativar oferta" | `/business/$businessId` (negócio da oferta) |
| corrida | "Disponível agora"/"Indisponível" | — | "Pedir corrida" | `/ride` |

Pessoa < 2 km usa `PERSON_MAX_EXACT_DISTANCE = 2000`; negócio/local < 1 km (`CLOSE_DISTANCE = 1000`). A decisão de "oferta navega para o negócio" foi tomada porque não existe rota dedicada de oferta; documentado aqui.

## Compartilhamento

- **URL**: `${getConnexyAppUrl()}/reels/${reelId}` — alinhada à rota real `/_app/reels/$reelId`.
- **Mensagem**: "Veja este Reel no Connexy — seu ecossistema digital." ou "Veja este Reel sobre \"{título}\" no Connexy.".
- **WhatsApp**: `https://wa.me/?text=<encodeURIComponent>` com `target="_blank"`/`rel="noopener noreferrer"`.
- **Copiar**: `navigator.clipboard` → fallback `document.execCommand("copy")`; toasts de sucesso/falha.
- **Nativo**: `navigator.share` quando suportado; cancelamento (`AbortError`) silencioso.
- Acessibilidade: `aria-label` em todos os botões.

## Multi-vídeo

- `reel.videos.length > 1` → dots no topo do player (segmento atual em destaque), alternância com `key={currentUrl}` (remontagem limpa) e reset de `currentTime`. Exemplos reais: `reel-001` (`3571264-uhd` + `1721306-hd`) e `reel-005` (`1093662-hd` + `1721296-hd`).

## Validação

- `npx tsc --noEmit` → **sem erros**.
- `npm run build` → **sucesso** (client + nitro/SSR).
- `npm run lint` → **nenhum erro nos arquivos tocados** (os 473 erros restantes são `prettier/prettier` pré-existentes em arquivos não relacionados; os introduzidos foram auto-corrigidos).
- Checklist manual previsto: um vídeo por vez; pausa em aba oculta e retomada; som persiste em refresh; curtida/comentário persistem; WhatsApp codificado; copiar link; `/reels/$reelId` abre o Reel correto; contexto abre a entidade correta; feed funciona sem Supabase.

## Pendências / observações

- `ReelConnectButton`, `ReelFollowButton` e o `onConnect` do feed permanecem como no estado anterior (mock de conecta/seguir, fora do escopo 3A).
- As tabelas reais `reels`/`reel_likes`/`reel_comments` continuam fora do feed (mock), conforme escopo; `comments-sheet.tsx` (real, `reel_comments`) segue não usado — escolha entre os dois sheets é item transversal já mapeado na auditoria.
- O estado vazio do feed com filtros ativos mostra "Nenhum resultado" (distinto do vazio real) — o CTA "Criar reel" é exibido apenas no vazio real.
- Sem git ops realizados (nada commitado/pushado).
