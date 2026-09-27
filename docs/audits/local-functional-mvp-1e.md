# Fase 1E — Auditoria completa do Local Functional MVP

- **Data:** 2026-09-17
- **Status:** PASS
- **Modo:** somente auditoria. Nenhum código funcional foi alterado.
- **Supabase:** não acessado, não vinculado e não alterado.
- **Commit/push:** não realizados.

## 1. STATUS GERAL

O Local Functional MVP **existe e é executável**. Os P0 das fases
1D-1 a 1D-5 continuam válidos: identidade, social/conversas, Reels,
mobilidade, inbox de convites, histórico de viagens e preferências de
presença/modo sobrevivem a reload nas fontes canônicas locais.

O que ainda não está 100% funcional é a **camada de descoberta e
criação visual**: Explorar/Locais, o hub `/create`, Meu Connexy e
vários CTAs que parecem ação de produto mas só mutam React ou
mostram toast. Isso não derruba o MVP local; classifica Explore e
parte de Create como PARTIAL.

Nenhum P0 novo de núcleo foi encontrado. Os problemas abaixo têm
evidência de código e/ou de UI real em `http://localhost:8080` com
`VITE_APP_DEMO_MODE=true`.

## 2. ESCOPO AUDITADO

Rotas e superfícies exercitadas nesta fase (UI ao vivo e/ou código +
testes 1D):

| Área | Rotas / superfícies |
| --- | --- |
| Identity | `/`, `/welcome`, `/localizacao`, `/auth`, `/cadastro`, `/completar-perfil`, `/interesses`, `/perfil`, `/privacidade` |
| Social | `/pessoas`, `/connecta`, `/perfil/$id`, `/solicitacao/$id` |
| Conversas | `/chat`, `/chat/$conversationId` |
| Reels / Feed | `/reels`, `/reels/$reelId`, `/gerenciar/novo-reel`, `/feed` |
| Mobility | `/ride`, `/ride/request`, `/ride/matching`, `/ride/active`, `/driver`, `/driver/history` |
| Notifications | `/notificacoes`, `/notifications` (redirect) |
| History | `/ride/history`, `/ride/history/$tripId` |
| Settings | `/profile`, `/privacidade`, logout demo, `ModeSwitcher` |
| Explore | `/discover`, `/locais`, `/local/$id`, `/marketplace`, `/business/$id`, `/event/$id` |
| Home | `/home`, `HomeActionHub`, `ConnexyPulse` |
| Create | `/create`, `/create/photo`, `/create/reel`, `/create-post`, `/my-connexy` |

Ambiente ao vivo: Vite em `:8080` com `VITE_APP_DEMO_MODE=true`.
Sessão demo autenticada. Home: **Boa noite, Lucas**. Presença
**Invisível** persistida após navegar para histórico/chat e voltar a
`/privacidade`. Mensagem **Mensagem 1E de auditoria** em
`/chat/beatriz` sobreviveu a reload. Histórico: **0 viagens /
Nenhuma viagem ainda**.

## 3. TABELA DE FLUXOS

Critério A–L: iniciar, concluir, estado muda, persiste reload, tela
seguinte recebe estado, CTA morto, mock aceitável, fonte paralela,
volátil que deveria persistir, perda/duplicação, Supabase acidental,
rota morta.

| Fluxo | Classe | A | B | C | D | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| Splash → auth/home demo | PASS | S | S | S | S | `index.tsx` usa `isDemoAuthenticated()`; Supabase session só se configurado |
| Cadastro passo 1 (nome/email/senha) | PARTIAL | S | S* | N | N | Campos não entram em `own-profile`; `enterDemoSession()` + `startDemoSignup()` |
| Completar perfil + interesses | PASS | S | S | S | S | UI: Home/Perfil mostram Lucas Auditoria; testes 1D-1 |
| Continuar sem entrar | BROKEN | S | N | N | N | `auth.tsx` Link `/home` sem sessão; guarda devolve `/auth` |
| Localização | MOCK ACCEPTABLE | S | S | N | N | Sempre navega `/home`; GPS opcional; sem sessão cai no guarda |
| Perfil próprio + edição | PASS | S | S | S | S | `/perfil` ao vivo; 1D-1 reload |
| Privacidade / presença | PASS | S | S | S | S | UI: radio **Invisível** persistiu após `/ride/history` e `/chat`; chave `connexy.presence.preference` |
| Modo passageiro/motorista | PASS | S | S | S | S | `connexy_roles`; `/driver` abre o painel |
| Pessoas próximas → perfil B | PASS | S | S | S | n/a | `/pessoas` → Beatriz |
| Enviar convite | PASS | S | S | S | S | UI chegou em `/solicitacao/beatriz?mode=send`; persistência 1D-2/1D-5 |
| Aceitar / recusar / conversa | PASS | S | S | S | S | Chrome 1D-2; inbox 1D-5 |
| Lista de conversas | PARTIAL | S | S | S | parcial | Abre; mistura `MOCK_CONVERSATIONS` + conexões reais |
| Enviar mensagem + reload | PASS | S | S | S | S | UI: enviou “Mensagem 1E de auditoria”; reload em `/chat/beatriz` manteve o texto. 1D-2 IndexedDB |
| BottomNav no chat | PASS | S | S | — | — | Visível na thread; `isAppBottomNavVisible` sempre true |
| Connecta aba Solicitações | BROKEN | S | N | N | N | Tab vazia; só `tab === "pessoas"` renderiza lista |
| Connecta filtro | BROKEN | S | N | N | N | Botão sem `onClick` |
| Publicar Reel (gerenciar) | PASS | S | S | S | S | `/gerenciar/novo-reel` chama `publishReel`; 1D-3 |
| Publicar via `/create/*` | MOCK BLOCKER | S | N* | toast | N | UI: `/create/reel` mostrou **Publicando...** e redirecionou para `/home` sem Reel persistido. `usePublisherForm` |
| Feed Reels + like/comment/reply | PASS | S | S | S | S | 1D-3; catálogo `MOCK_REELS` aceitável |
| Seguir / Guardar Reel | VOLÁTIL | S | S | React | N | `handleToggleFollow` / `handleToggleSave` só `setReels` |
| Conectar no Reel | BROKEN | S | N | N | N | `onConnect={() => {}}` |
| Detalhe Reel | PASS | S | S | S | S | 1D-3 ligou comments/replies |
| Solicitar corrida | PASS | S | S | S | S | `/ride/request` destinos reais; 1D-4 |
| Motorista / avanço / pagamento / histórico | PASS | S | S | S | S | 1D-4 Chrome |
| Ir juntos (social → corrida) | PARTIAL | S | N | convite | parcial | UI: convite para Beatriz → “Beatriz Pendente”; CTA **Aguardando aceites** `disabled`; `companions: []` no código |
| Inbox convite | PASS | S | S | S | S | 1D-5; catálogo fixture permanece |
| `/notifications` | PASS | S | S | — | — | Redirect para `/notificacoes` |
| Histórico vazio / detalhe | PASS | S | S | S | S | UI: “Nenhuma viagem ainda”; fonte `connexy_demo_trip` |
| Settings núcleo | PASS | S | S | S | S | Privacidade/Notificações/Histórico ligados |
| Settings segurança/idioma/ajuda/senha | MOCK ACCEPTABLE | S | N | toast | N | Toasts sem persistência, fora do núcleo |
| Locais filtros | PASS | S | S | S | n/a | Cafés altera a lista |
| Locais busca | BROKEN | S | N | N | N | `<input>` sem state/handler |
| Detalhe local + Pedir corrida | PASS | S | S | S | n/a | Café Central → `/ride/request` |
| Marketplace busca/filtros | PASS | S | S | S | n/a | “Aroma” → 1 empresa |
| Favorito local | PASS | S | S | S | S | `connexy:demo:saved-details` |
| Favorito/seguir negócio | VOLÁTIL | S | S | React | N | `setBusiness` em `business.$businessId.tsx` |
| Discover pessoas/locais | PASS | S | S | S | n/a | Clique em pessoa/local navega |
| Discover eventos | BROKEN | S | N | N | N | Clique em “Sunset no Parque” permanece em `/discover` |
| Evento a partir do Feed | PASS | S | S | — | — | `/feed` → `/event/ev1` |
| Participar de evento | VOLÁTIL | S | S | React | N | `useState(false)` |
| Home ações rápidas | PASS | S | S | — | — | Links `/ride/request`, `/locais`, `/recommendations` |
| Meu Connexy wizards | MOCK BLOCKER | S | N | fecha | N | `handleWizardComplete` só fecha o wizard |
| Logout demo | PASS | S | S | S | S | `exitDemoSession()` |

\* “Concluir” no cadastro passo 1 significa avançar de tela, não gravar
os campos daquele formulário.

## 4. TABELA DE PERSISTÊNCIA

| Domínio | Estado | Fonte canônica | Persistência | Reload | Observação |
| --- | --- | --- | --- | --- | --- |
| Identidade demo | PERSISTENTE | `demo-identity.ts` | `connexy:demo:identity` | Sim | Sessão `authenticated` |
| Perfil próprio | PERSISTENTE | `demo-own-profile.ts` | `connexy:demo:own-profile` | Sim | Nome/bio/idade/interesses |
| Interesses | PERSISTENTE | mesmo perfil | mesma chave | Sim | ≥3 únicos |
| Presença (online/invisível) | PERSISTENTE | `presence-preference.ts` | `connexy.presence.preference` | Sim | Distinta de check-in |
| Check-in / visibilidade mapa | PERSISTENTE | `presence-privacy.ts` | `connexy.presence.visibility` + `checkins` | Sim | Não é o toggle de Settings |
| Roles / modo | PERSISTENTE | `roles-storage.ts` | `connexy_roles` | Sim | |
| Conexões | PERSISTENTE | `demo-db.ts` | `connexy:demo:db` | Sim | Par de identidades |
| Convites sociais | PERSISTENTE | `demo-db.ts` `requests` | mesma chave | Sim | `fromUserId`/`toUserId` |
| Convites de grupo | PERSISTENTE | `demo-db.ts` | mesma chave | Sim | Projetados no inbox |
| Conversas | PERSISTENTE | `ConversationRepository` | IndexedDB `connexy-app-local-db` | Sim | |
| Mensagens | PERSISTENTE | `MessageRepository` | mesmo IDB | Sim | |
| Lista de chat (catálogo) | MOCK | `MOCK_CONVERSATIONS` | — | Visual | Mistura com reais |
| Reels publicados | PERSISTENTE | `ReelRepository` | IDB `connexy-reels-data-local-db` | Sim | |
| Likes / comments / replies | PERSISTENTE | like/comment repos | mesmo IDB | Sim | |
| Catálogo Reels | MOCK | `MOCK_REELS` | — | Visual | Aceitável |
| Follow/save Reel | VOLÁTIL | estado React | — | Não | |
| Chaves legadas reels | DORMANT | `reel-local-storage.ts` | `connexy:reels:*:v1` | — | Não escritas no fluxo 1D-3 |
| Trip / ride / payment | PERSISTENTE | `trip-store.ts` | `connexy_demo_trip` | Sim | |
| Ride history | PERSISTENTE | `history[]` da Trip | mesma chave | Sim | |
| Dispatcher frota/oferta | VOLÁTIL | `dispatcher-store.ts` | memória | Recupera via Trip | Política em `connexy_demo_dispatcher` |
| Bloqueio inadimplência | PERSISTENTE | `ride-blocks.ts` | `connexy_demo_ride_blocks` | Sim | Sem UI de regularização |
| Notificações convite | PERSISTENTE | projeção `listLocalInboxItems` | `demo-db` | Sim | Sem store própria |
| Catálogo notificações | MOCK | `mock-data.notifications` | — | Visual | Sem onClick |
| Read/unread | VOLÁTIL | — | — | Não | Fora do escopo 1D-5 |
| Favoritos de detalhe | PERSISTENTE | `local-engagement` | `connexy:demo:saved-details` | Sim | Locais/eventos via ActionBar |
| Favorito negócio (♥ header) | VOLÁTIL | React | — | Não | Paralelo ao Salvar persistido |
| Avaliações locais | PERSISTENTE | `local-engagement` | `connexy:demo:recent-reviews:{id}` | Sim | |
| Cupons resgatados | PERSISTENTE | `local-engagement` | `connexy:demo:redeemed-promotions` | Sim | |
| Outing invites | PERSISTENTE | `local-engagement` | `connexy:demo:outing-invites` | Sim | Sem aceite nem corrida |
| Posts da bio | PERSISTENTE | `demo-posts.ts` | `connexy:demo:posts` | Sim | `authorId` ainda usa `currentUser.id` |
| Som Reels | PERSISTENTE | `reel-local-storage` | `connexy:reels:sound:v1` | Sim | Fora de Settings |
| Driver application | PERSISTENTE | `driver-application-storage` | `connexy_driver_application_v1` | Sim | |
| Bloqueio/ocultar pessoa | VOLÁTIL | chaves lidas, sem writer | `connexy.mock.blocked-person-ids` | Não | Chat “Bloquear” é toast |
| Mute chat | VOLÁTIL | React | — | Não | |
| Mock conversation invites | DORMANT | `mock-conversation-invites.ts` | chave unused | — | Testes esperam null |
| NotificationRepository | DORMANT | Supabase | remoto | — | `useNotifications` sem consumidores |

## 5. TABELA DE NAVEGAÇÃO

| Item | Destino | Estado |
| --- | --- | --- |
| BottomNav Home | `/home` | PASS; sempre visível no `_app` |
| BottomNav Mapa | `/discover` | PASS |
| BottomNav Criar | `/create` | PASS navega; publicação do hub é mock |
| BottomNav Conversas | `/chat` | PASS; oculto em modo motorista |
| BottomNav Configurações | `/profile` | PASS (não é `/perfil`) |
| `/people` | `/pessoas` | Redirect PASS |
| `/notifications` | `/notificacoes` | Redirect PASS |
| Chat “Meu perfil” | `/profile` | P2: atalho de settings, não do perfil próprio |
| FAB Reels | `/gerenciar/novo-reel` | PASS (1D-3) |
| Hub `/create/reel` | toast | MOCK BLOCKER paralelo |
| `/ride` e `/ride/request` | RideFlow | PASS; matching/active retomam Trip ou voltam ao request |
| `/corrida`, `/destino`, `/matching`, `/rota` | telas mock isoladas | P2: sem links atuais; `/matching` ainda aponta para `/corrida` |
| Discover eventos | nenhum | BROKEN |
| Evento no `/feed` | `/event/$id` | PASS |
| Pedir corrida no detalhe | `/ride/request` | PASS |
| Settings Privacidade/Notificações/Histórico | rotas reais | PASS |
| Deep links `_app` | BottomNav presente | PASS |

## 6. TABELA DE MOCKS

| Mock | Classe | Motivo |
| --- | --- | --- |
| `MOCK_REELS` | MOCK ACCEPTABLE | Catálogo demo; persistidos têm precedência |
| Pessoas / motoristas / places | MOCK ACCEPTABLE | Descoberta local sem backend |
| `MOCK_BUSINESSES` / cupons | MOCK ACCEPTABLE | Marketplace filtra o catálogo de verdade |
| `MOCK_CONVERSATIONS` | MOCK BLOCKER (parcial) | Máscara estado vazio e mistura com conversas reais |
| `notifications` fixture | MOCK BLOCKER (parcial) | Parece inbox; itens sem ação; esconde inbox vazia |
| `usePublisherForm` | MOCK BLOCKER | “Publicado com sucesso!” sem persistir |
| Meu Connexy STATS/ACTIVITIES | MOCK BLOCKER | “Corrida finalizada — R$ 24,50” sem Trip |
| Meu Connexy wizards | MOCK BLOCKER | Fecha sem criar entidade |
| Driver zonas / “Rota iniciada” | MOCK ACCEPTABLE | Painel demo; núcleo da corrida é a Trip |
| Chat Ligar / Videocall / Bloquear | MOCK ACCEPTABLE | Feedback honesto “em breve” |
| Settings senha/suporte/idioma | MOCK ACCEPTABLE | Fora do núcleo do MVP local |
| `/corrida` cluster | MOCK BLOCKER se aberto | Tela de corrida fake, isolada do trip-store |
| SmartFeed / Pulse / recomendações | MOCK ACCEPTABLE | Conteúdo editorial; CTAs de pessoas/eventos em geral navegam |

## 7. DEPENDÊNCIAS SUPABASE

Em demo, `isPublicSupabaseConfigured()` retorna **false**. Repositórios
remotos e `use-auth` não assinam sessão remota.

| Ocorrência | Classe |
| --- | --- |
| `isPublicSupabaseConfigured` forçado false no demo | INFRAESTRUTURA FUTURA / guarda local |
| Repositories `connections`, `chat`, `feed`, `profile`, `user`, `marketplace`, `presence`, `notification`, `auth` | DORMANT / NÃO EXECUTADA no demo |
| `reel-publish.publishToSupabase` | DORMANT: `willPublishReelRemotely()` exige `!isDemoMode()` |
| `use-chat` channel realtime | DORMANT: early-return local |
| `useNotifications` / `NotificationRepository` | DORMANT: hook sem consumidores de rota |
| Splash `supabase.auth.getSession` | DORMANT no demo (`isDemoAuthenticated`) |
| `auth.tsx` signUp/signIn/OAuth | DORMANT no demo (qualquer submit entra na sessão local) |
| `completar-perfil` storage avatars | DORMANT no demo (`applyDemoOnboardingProfile`) |
| `bio-posts` / `bio-avatar` storage | DORMANT no demo se as telas não forem o caminho canônico |
| `RealtimeProvider` / `presence-context` remoto | DORMANT |
| Cliente, RPC helpers, `database.ts` | INFRAESTRUTURA FUTURA |
| Auth middleware / Lovable OAuth / MCP | INFRAESTRUTURA FUTURA; fora do MVP local |
| Nenhuma chamada ativa nos fluxos 1D-1…1D-5 | Confirmado pelos testes Chrome (zero rede) |

**Dependências ativas nos fluxos principais:** nenhuma.

**Problemas:** nenhum uso acidental de Supabase no caminho demo
auditado. Dual path existe, mas está atrás da guarda.

## 8. BOTÕES / ROTAS MORTAS

| Item | Evidência | Impacto |
| --- | --- | --- |
| `/locais` busca | input sem `value`/`onChange` | Busca aparenta existir |
| Connecta Solicitações | sem ramo de render | Aba vazia |
| Connecta sliders | `<button>` sem onClick | Filtro morto |
| Discover tipo `eventos` | `onClick` só trata pessoas/locais/negócios | Clique live ficou em `/discover` |
| `/create/*` (exceto gerenciar reel) | `usePublisherForm` | Publicação falsa |
| Reels `onConnect={() => {}}` | `_app.reels.tsx` | CTA morto |
| Reels Seguir/Guardar | só `setReels` | Some no reload |
| Destino bússola | `onClick={() => {}}` | `/destino` legado |
| Ir juntos → corrida | botão `disabled` permanente | Fluxo incompleto |
| Evento Participar | `useState` | Some no reload |
| Negócio ♥ / Seguir | `setBusiness` | Paralelo ao Salvar persistido |
| Catálogo `/notificacoes` | `<li>` sem click | “Juliana aceitou…” não abre nada |
| Meu Connexy criar * | wizard complete só fecha | Não cria negócio/evento/local |
| Driver “Rota para zona” | toast | Não cria Trip |
| Chat Ligar/Videocall/Bloquear | toast | Esperado / P2 |
| Auth Continuar sem entrar | sem `enterDemoSession` | Loop `/auth` |
| Cluster `/corrida` `/matching` `/destino` `/rota` | sem Link atual | Rotas órfãs |

Não há TODO/FIXME nos fluxos principais.

## 9. P0 — BLOQUEADOR DO LOCAL MVP

Nenhum bloqueador novo do núcleo.

Os P0 de 1D-0 (identidade, social, reels, mobilidade) foram
encerrados em 1D-1…1D-4 e **não devem ser reabertos** nesta auditoria.

## 10. P1 — IMPORTANTE

1. **Explorar / Locais incompleto:** busca de `/locais` morta; filtro
   Discover de eventos sem navegação; Ir juntos sem aceite nem corrida;
   favorito de negócio React-only.
2. **Hub Criar enganoso:** `/create` e Meu Connexy wizards anunciam
   publicação/cadastro e não persistem (exceto Reel em
   `/gerenciar/novo-reel` e posts da bio em `/create-post`).
3. **Lista de conversas híbrida:** `MOCK_CONVERSATIONS` convive com
   agregados IndexedDB.
4. **Inbox visual vs inbox real:** fixtures de `/notificacoes` sem
   ação; aba Connecta Solicitações vazia apesar do fluxo 1D-2 existir
   em `/chat` e `/notificacoes`.
5. **CTAs sociais de Reel** (Conectar/Seguir/Guardar) voláteis ou
   vazios.

## 11. P2 — POST-MVP

- Chamadas de voz/vídeo, bloqueio persistido, mute persistido.
- GPS, matching remoto, Pix/QR reais, dispatcher persistido.
- Read/unread de notificações; histórico consolidado de conexões.
- Campos de `/cadastro` (email/senha) não copiados ao perfil — o
  perfil canônico é `/completar-perfil`.
- Continuar sem entrar / `/localizacao` sem sessão.
- Telas órfãs `/corrida` `/destino` `/matching` `/rota`.
- Dual chave presença vs check-in (já documentado, não fundir agora).
- `authorId` de `demo-posts` ainda usa `currentUser.id`.
- Painéis finance/performance do motorista; design-system; QA routes.
- Lint global 478 erros + 20 warnings.

## 12. FLUXOS CONFIRMADOS FUNCIONAIS

Não tocar agora, salvo regressão:

- 1D-1 identidade/perfil/interesses/edição
- 1D-2 convite direcional, aceite/recusa, conversa, mensagem
- 1D-3 Reel local, like, comment, reply, detalhe, FAB gerenciar
- 1D-4 Trip completa, paradas, pagamento dinheiro/pix, `user_not_paid`,
  desbloqueio, histórico, modo motorista
- 1D-5 inbox de convites, redirect `/notifications`, histórico de
  viagens, presença, atalhos de Settings
- BottomNav global
- Marketplace busca/filtros (catálogo)
- Detalhe de local/evento → Pedir corrida
- Logout demo

## 13. FLUXOS PARCIAIS

- Lista de conversas (mocks + reais)
- Notificações (inbox real + catálogo morto)
- Settings (núcleo persistente + toasts)
- Explore (filtros/detalhe/corrida ok; busca/eventos/ir juntos não)
- Create hub (navega; só reel gerenciar e create-post persistem)
- Reels follow/save
- Meu Connexy (atalho Histórico real; stats/atividade/wizards fake)
- Cadastro passo 1

## 14. FLUXOS QUEBRADOS

- Busca em `/locais`
- Aba Solicitações e filtro de `/connecta`
- Clique em evento no mapa Discover
- Publicação `/create/*` via `usePublisherForm`
- Reels Conectar
- CTA de corrida após Ir juntos
- Continuar sem entrar sem sessão
- Participar de evento / seguir negócio (somem no reload)

Nenhum desses quebra o P0 já entregue; quebram superfícies que
**parecem** prontas.

## 15. RECOMENDAÇÃO DA PRÓXIMA FASE

**Não migrar para Supabase.**

Próxima fase sugerida: **1F — Explore / Locais / Create canônico**,
ainda 100% local:

1. Ligar a busca de `/locais` ao catálogo já filtrado.
2. Navegar eventos do Discover para `/event/$id`.
3. Unificar favorito de negócio com `saved-details`.
4. Decidir Ir juntos: completar aceite local **ou** desabilitar o CTA
   até existir aceite (hoje o botão de corrida nunca habilita).
5. Apontar o hub `/create` (ao menos Reel) para o publicador real, ou
   deixar explícito que foto/vídeo/texto/evento são não persistidos.
6. Opcional no mesmo pacote: aba Connecta Solicitações lendo
   `listLocalInboxItems`; não misturar isso com nova persistência.

Não reabrir 1D-1…1D-5. Não corrigir lint global. Não criar stores
novas salvo reutilizar chaves já existentes.

## Validação desta auditoria

- Testes: **245 pass / 941 assertions / 0 fail**
- Typecheck: **PASS** (`tsc --noEmit`)
- Build: **PASS**
- Lint focado: não aplicável (nenhum arquivo de produto editado)
- Lint global: **FAIL — 498 problemas (478 erros, 20 warnings)**,
  recontado nesta fase, sem correção
- Browser (ao vivo em `:8080`): onboarding já persistido (Home
  Lucas); presença Invisível + reload de tela; chat enviar + reload;
  histórico vazio; Connecta aba Solicitações vazia; `/locais` busca
  “Burger” inerte e filtro Cafés funcional; detalhe Café Central;
  Ir juntos envia e trava em Aguardando aceites; Feed Reels abre;
  `/gerenciar/novo-reel` canônico vs `/create/reel` toast; inbox
  `/notificacoes` com catálogo; `/notifications` redireciona;
  Discover Eventos filtra mas clique em Sunset permanece em
  `/discover`; Settings lista atalhos reais. Logout não foi
  clicado (auto-review). Convite social A→B, like/comment de Reel e
  corrida completa permanecem cobertos pelos testes Chrome 1D-2…1D-4
- Código funcional: **inalterado**
