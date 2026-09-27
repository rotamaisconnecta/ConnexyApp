# Baseline funcional do MVP local

- **Origem:** Fase 1D-0 (2026-09-12), atualizado após 1D-1…1D-5, a
  auditoria global **1E** (2026-09-17), o fechamento **1F-1**
  (2026-09-18), o Create canônico de Reel **1F-2**, os tipos restantes
  do Create Hub **1F-3**, o Meu Connexy honesto **1F-4**, o social residual
  **1F-5**, o Ir juntos **1F-6** (2026-09-18), os residuais de Reels
  **1F-7** (2026-09-18), os tipos restantes do Create **1F-8**
  (2026-09-19), o dispatcher persistido **1F-9** (2026-09-19), as
  chamadas demo do Chat **1F-10** (2026-09-19), o catálogo local
  **1F-12** (2026-09-19), o fechamento **1F-13** (2026-09-19), a
  auditoria E2E **1G-2** (2026-09-20), a nomenclatura **1G-3**
  (2026-09-20) e a fase **1H-2** (2026-09-23).
- **Objetivo:** estado real do Connexy como produto local ponta a ponta.
- **Supabase:** não acessado nem alterado.
- **Documento da auditoria global:**
  `docs/audits/local-functional-mvp-1e.md`.
- **Documento da fase 1F-1:**
  `docs/audits/local-functional-mvp-1f-1.md`.
- **Documento da fase 1F-2:**
  `docs/audits/local-functional-mvp-1f-2.md`.
- **Documento da fase 1F-3:**
  `docs/audits/local-functional-mvp-1f-3.md`.
- **Documento da fase 1F-4:**
  `docs/audits/local-functional-mvp-1f-4.md`.
- **Documento da fase 1F-5:**
  `docs/audits/local-functional-mvp-1f-5.md`.
- **Documento da fase 1F-6:**
  `docs/audits/local-functional-mvp-1f-6.md`.
- **Documento da fase 1F-7:**
  `docs/audits/local-functional-mvp-1f-7.md`.
- **Documento da fase 1F-8:**
  `docs/audits/local-functional-mvp-1f-8.md`.
- **Documento da fase 1F-9:**
  `docs/audits/local-functional-mvp-1f-9.md`.
- **Documento da fase 1F-10:**
  `docs/audits/local-functional-mvp-1f-10.md`.
- **Documento da fase 1F-12:**
  `docs/audits/local-functional-mvp-1f-12.md`.
- **Documento da fase 1F-13:**
  `docs/audits/local-functional-mvp-1f-13.md`.
- **Documento da fase 1G-2:**
  `docs/audits/local-functional-mvp-1g-2.md`.
- **Documento da fase 1G-3:**
  `docs/audits/local-functional-mvp-1g-3.md`.
- **Documento da fase 1H-2:**
  `docs/audits/local-functional-mvp-1h-2.md`.

## Critério e método

`FUNCIONAL` significa que o fluxo local principal possui início, conclusão e
estado observável/persistido quando necessário. Fixtures de catálogo e atores
demo são aceitas. `PARCIAL` significa que o núcleo existe, mas há uma quebra
relevante, fonte de verdade concorrente ou estado estrutural que não sobrevive.
`VISUAL/MOCK` significa que a interação muda apenas estado React ou exibe
feedback sem realizar a operação anunciada.

A classificação abaixo resulta de inspeção dos caminhos reais de execução e
dos testes existentes. Esta fase não adicionou uma suíte E2E de cliques nem
declara que dados reais de um navegador específico foram exercitados.

## Matriz funcional

| Módulo                    | Estado atual (1E) | Persistência                                                                                                         | Reload                         | Funciona ponta a ponta                                                                                                                                                         | Prioridade |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Autenticação / identidade | FUNCIONAL         | Sessão e identidade demo em `localStorage`                                                                           | Sim no modo demo               | Splash, login demo, guarda, troca de identidade e logout funcionam. Campos de `/cadastro` não viram perfil; o canônico é `/completar-perfil`. “Continuar sem entrar” volta ao auth. | P2 residual |
| Perfil                    | FUNCIONAL         | `connexy:demo:own-profile`                                                                                           | Sim                            | Onboarding e edição persistem nome, handle, bio, foto, idade, interesses. Home e `/perfil` leem a mesma fonte.                                                                  | —          |
| Social                    | FUNCIONAL         | `connexy:demo:db` (requests + connections)                                                                           | Sim                            | Convite direcional, aceite/recusa e conversa. `/connecta` Solicitações e o filtro usam `getPendingRequests()`.                                                                  | —          |
| Conversas                 | FUNCIONAL         | IndexedDB conversas/mensagens + grupos em `demo-db`                                                                  | Sim para o núcleo              | Lista funcional = conexões + grupos + ConversationRepository. `MOCK_CONVERSATIONS` só catálogo. Ligar/vídeo 1:1 são fluxo demo (sessão em memória + registro TEXT). Grupos e bloquear continuam toast. | P2 residual |
| Agora (Reels / Feed)      | FUNCIONAL         | `ReelRepository` / likes / comments no IndexedDB; follow em `connexy:demo:db`; guardar em `saved-details`             | Sim                            | UI apresenta **Agora**; rota `/reels`. Publicar, feed, like, comment, reply. Seguir/guardar/conectar usam demo-db e saved-details. `MOCK_REELS` só catálogo.                    | —          |
| Mobilidade                | FUNCIONAL         | Trip + history + bloqueio em `localStorage`; dispatcher deriva da Trip após reload                                   | Sim via Trip                   | Origem → destino → paradas → motorista → pagamento dinheiro/pix → histórico. Após reload, `hydrateDispatcherFromTrip` reconstrói oferta (`buscando`) e atribuição (`trip.driver`). Ir juntos persiste aceite/recusa e só então habilita `/ride/request`. | P2 residual |
| Explorar / locais         | FUNCIONAL         | Fixtures + overlay `connexy:demo:catalog`; favoritos/avaliações/cupons/outing em `localStorage`                      | Sim para catálogo, favoritos e outing | Busca, filtro, detalhe e Pedir corrida funcionam. Eventos do Discover abrem `/event/$id`. Cadastros do usuário sobrepõem fixtures. Favorito usa `connexy:demo:saved-details`. Ir juntos: A envia, B aceita/recusa na inbox, corrida só após aceite. | —          |
| Notificações              | FUNCIONAL         | Inbox = projeção de `connexy:demo:db` + outing invites                                                               | Sim para convites              | Convites sociais, de grupo e de Ir juntos abrem a ação correspondente. `/notifications` redireciona. Catálogo `n1`–`n4` fora da inbox. Read/unread ausente.                    | P2 residual |
| Histórico                 | FUNCIONAL         | `history` de `connexy_demo_trip`                                                                                     | Sim                            | Lista, detalhe, vazio, `/driver/history`. Meu Connexy ainda mostra atividade fictícia além do atalho real.                                                                     | P2 residual |
| Configurações             | FUNCIONAL         | Presença `connexy.presence.preference`; modo `connexy_roles`                                                         | Sim                            | Privacidade, notificações, histórico e logout ligados. Menu Mais: Locais, Eventos, Negócios, Agora, Ofertas, Gerenciar. Segurança, idioma, ajuda e cartão continuam mock.       | P2 residual |
| Home                      | FUNCIONAL         | Perfil canônico + catálogo (projeção)                                                                                | Sim para o perfil/catálogo     | Connect Pulse é vitrine (negócios/eventos/locais/ofertas + imagens) **sem navegação**. Perto de você começa em 5 e incrementa +5. Ver mais abre `/locais`.                      | —          |
| Create / Meu Connexy      | FUNCIONAL         | Reel: IndexedDB; posts/momento: `connexy:demo:posts`; ride: Trip; catálogo: `connexy:demo:catalog`; carona: `connexy:demo:carona` | Sim nos caminhos reais | Hub `/create`: Foto/Vídeo/Texto/Momento → `/create-post`. Evento/local/oferta/negócio → catálogo local. Carona Amiga → `/carona/nova`. `/gerenciar` lista entidades do owner. Menu Mais não duplica criação. | P2 residual (remoto) |
| Reserva                   | FUNCIONAL         | `connexy:demo:reservations`                                                                                          | Sim                            | Negócio/local reservável → data/horário/pessoas → confirmed imediato → lista `/reservas` → cancelar. Isolada por `getDemoIdentity().id`. Sem pagamento nem agenda real.       | P2 residual (remoto) |
| Carona Amiga              | FUNCIONAL         | `connexy:demo:carona` (offers + requests)                                                                            | Sim                            | Oferecer vaga → solicitar → aceitar → conversa existente com contexto. Isolada do Trip/dispatcher. Labels aproximados; sem GPS.                                                | P2 residual (remoto) |

## Evidências arquiteturais

### Autenticação, identidade e perfil

- `src/routes/auth.tsx` cria e restaura sessão demo explicitamente; qualquer
  credencial é aceita apenas quando `VITE_APP_DEMO_MODE=true`.
- `src/hooks/use-auth.ts` reconstrói a sessão a partir da flag demo e da
  identidade selecionada.
- `src/lib/demo/demo-identity.ts` persiste a identidade e
  `src/components/chat/conversations-screen.tsx` expõe a troca no modo demo.
- `src/routes/_app.tsx` aplica guarda de autenticação e de perfil; logout demo
  remove a sessão em `src/routes/_app.profile.tsx`.
- `src/routes/_app.perfil.index.tsx` salva a edição em
  `src/lib/demo/demo-own-profile.ts`, que sobrevive ao reload.
- Após 1D-1, `completar-perfil` e `interesses` gravam em `demo-own-profile`
  antes de navegar. Residual 1E: campos de `/cadastro` (email/senha) não entram
  no perfil; “Continuar sem entrar” ainda navega para `/home` sem sessão e o
  guard devolve `/auth`.
- O menu “Meu perfil” do chat aponta para `/profile` (configurações), não para
  `/perfil` (perfil próprio).

### Social e conversas

- `src/lib/demo/demo-db.ts` persiste solicitações, conexões e grupos; mensagens
  e agregados de conversa delegam para `src/lib/chat/local-chat-persistence.ts`.
- `src/routes/_app.solicitacao.$id.tsx` implementa enviar, aceitar e recusar.
  Aceitar cria conexão, assegura o agregado e abre o chat.
- `src/components/chat/ConnexyChatScreen.tsx` envia texto, imagem/vídeo local e
  conteúdo compartilhado; também cria e responde convites de grupo. Ligar e
  Videocall 1:1 abrem overlay demo (`demo-call.ts`) e gravam o desfecho com
  `sendLocalMessage`; grupos mantêm o aviso honesto da 1A.
- A lista em `src/components/chat/conversations-screen.tsx` lê
  `listFunctionalDemoConversations()` (conexões, grupos aceitos e
  ConversationRepository via `getLocalConversations()`). `MOCK_CONVERSATIONS`
  permanece no módulo de catálogo e não entra na lista funcional.
- “Bloquear” informa indisponibilidade; as chaves de bloqueio/ocultação em
  `src/lib/feed/commonalities.ts` não possuem gravador. Videochamada 1:1 deixou
  de ser só toast após 1F-10 (fluxo demo, sem WebRTC).
- A aba “Solicitações” de `src/routes/_app.connecta.tsx` lista
  `getPendingRequests()` e o filtro online/perto aplica-se à lista.

### Reels / Feed

- A camada nova (`ReelRepository`, `ReelLikeRepository` e
  `ReelCommentRepository`) foi validada com reload real, idempotência e árvores
  normalizadas por `parentId`/`siblingOrder`.
- Após 1D-3, Feed e detalhe leem `persisted-reels-reader` / repositories.
  `getReelFeed()` combina persistidos + `MOCK_REELS`. Like, comment e reply
  persistem no IndexedDB. O FAB aponta para `/gerenciar/novo-reel`.
- Após 1F-3, o Create Hub não usa `usePublisherForm`. Foto/vídeo/texto
  vão para `/create-post`. Após 1F-8, Momento também usa `/create-post`
  com categoria `MOMENT` e a mesma chave `connexy:demo:posts`.
  Após 1F-12, Evento/local/oferta/negócio usam `connexy:demo:catalog`
  (um store, overlay nas listas/detalhes). Ride reutiliza `/ride/request`. Após 1F-7, seguir persiste
  em `connexy:demo:db`, guardar reutiliza `connexy:demo:saved-details` e
  conectar abre o fluxo 1D-2.

### Mobilidade e histórico

- `src/lib/mobility/trip/trip-store.ts` é a fonte central persistida da Trip e
  do histórico. A recuperação sanitiza estados impossíveis após reload.
- `src/components/mobility/ride/ride-flow.tsx` cobre planejamento, paradas,
  tarifa demo, categoria, motorista, viagem, avaliação, pagamento e conclusão.
- `src/lib/mobility/dispatch/dispatcher-store.ts` guarda frota, oferta e
  atribuição em memória. Após 1F-9, `hydrateDispatcherFromTrip()` reconstrói
  esse estado a partir da Trip persistida: `buscando` volta a despachar;
  estados com `trip.driver` restauram a entry `assigned` sem evento duplicado.
- Chat de corrida, ligação e SOS são feedbacks simulados adequados para
  segurança honesta do demo, porém não geram conversa/evento persistido.
- `src/routes/_app/ride/history/index.tsx` e
  `src/routes/_app/ride/history/$tripId.tsx` leem a mesma fonte persistida.
- O fluxo completo inicia corretamente por `/ride/request`. Links que abrem
  `/ride` sem criar uma Trip deixam ações de destino/transição sem entidade
  para atualizar.

### Explorar / locais

- `src/routes/_app/marketplace.tsx`, rotas de local, negócio e evento leem
  fixtures **mais** o overlay `connexy:demo:catalog`. Fixtures continuam
  catálogo demo; entidades do usuário persistem no store único.
- `src/lib/marketplace/saved-details.ts` e
  `src/components/marketplace/local-engagement.tsx` persistem favoritos na
  chave já existente `connexy:demo:saved-details`. Avaliações, promoções
  resgatadas e convites para sair continuam nas chaves locais anteriores.
- Após 1F-1, a busca de `/locais` filtra o catálogo `places`; o filtro de
  categoria permanece; busca vazia restaura o filtro atual. Eventos do
  Discover navegam para `/event/$eventId` com o id do catálogo
  (`sunset-parque`). Favorito de negócio (♥) e “Salvar” do detalhe usam a
  mesma lista persistida.
- Residual: “Ir juntos” persiste aceite/recusa na mesma chave
  `connexy:demo:outing-invites`. A corrida só fica disponível depois do
  aceite e reutiliza `/ride/request` + `createTrip`. `HOME_EVENTS.ev1` e
  `places.sunset-parque` continuam fixtures distintas com o mesmo título.

### Notificações e configurações

- Após a 1F-6, `/notificacoes` mostra a projeção `listLocalInboxItems()`
  (convites sociais e de grupo de `connexy:demo:db` e outing invites de
  `connexy:demo:outing-invites`). `/notifications` redireciona. O array
  `notifications` de `mock-data.ts` permanece no arquivo e não entra na
  inbox. Read/unread não é persistido.
- A preferência de presença usa a chave existente
  `connexy.presence.preference` via `presence-preference.ts`.
- Privacidade, notificações e histórico no `/profile` navegam para
  `/privacidade`, `/notificacoes` e `/ride/history`. Segurança, idioma e
  ajuda do sheet continuam mock.
- `/ride/history` e `/driver/history` leem `getHistorySnapshot()`. Não existe
  histórico consolidado de conexões/interações.

## Dados estruturais e fixtures

### Devem permanecer persistidos

- sessão/identidade demo e perfil próprio;
- solicitações, conexões, grupos, conversas e mensagens;
- Reels criados, Likes, Comments e Replies;
- Trip ativa, bloqueios e histórico;
- favoritos, avaliações, resgates e convites do usuário;
- preferências de presença, privacidade e notificações;
- reservas locais (`connexy:demo:reservations`);
- ofertas e pedidos de Carona Amiga (`connexy:demo:carona`).

### Podem continuar como fixtures

- pessoas e motoristas demo;
- restaurantes, bares, lojas, serviços e eventos;
- promoções de catálogo e conteúdo inicial;
- Reels iniciais usados apenas para preencher o catálogo.

## Mapa dos fluxos

### IDENTIDADE → PERFIL

```text
entrada demo → sessão local → guarda → onboarding → perfil canônico
                                   └─ residual: /cadastro não copia email/senha; “Continuar sem entrar” sem sessão volta ao /auth
```

Login, reload, troca de identidade, logout, completar-perfil e interesses
têm caminho local persistido (1D-1).

### PESSOAS PRÓXIMAS → CONVITE → ACEITE → CONVERSA → MENSAGEM

```text
fixtures/discovery → solicitação local → conexão local
→ ConversationRepository → MessageRepository
```

O roteiro demo é executável e sobrevive ao reload. A pendência é tornar a
solicitação coerente entre duas identidades (remetente e destinatário), remover
fontes concorrentes da lista e implementar bloqueio real local.

### REEL → PUBLICAÇÃO → FEED → LIKE → COMMENT → REPLY

```text
/create → Reel → /gerenciar/novo-reel
/create → Foto|Vídeo|Texto|Momento → /create-post → connexy:demo:posts
/create/ride → /ride/request → Trip
/create → Evento|Local|Oferta|Negócio → indisponível honesto (BLOCKED)
```

### VIAGEM → ORIGEM → DESTINO → SOLICITAÇÃO → MOTORISTA → CORRIDA → FINALIZAÇÃO → HISTÓRICO

```text
Trip persistida → dispatcher demo → motorista na Trip → estados temporizados
→ avaliação/pagamento demo → conclusão → histórico persistido
```

O caminho principal conclui localmente. Após 1F-9 o dispatcher operacional
é reconstruído a partir da Trip no reload. Chat/SOS continuam sem entidade
persistida; GPS, matching e pagamento reais não são requisitos do MVP local.

### EXPLORAR → LOCAL → DETALHE → FAVORITO

```text
catálogo fixture → filtros + busca local → detalhe → favorito localStorage
Discover eventos → /event/$id (sunset-parque) → voltar
```

Busca, filtro, detalhe, corrida e favorito de local/negócio funcionam no
MVP local. “Ir juntos” persiste o convite e encerra de forma honesta,
sem aceite.

### NOTIFICAÇÃO → AÇÃO → ESTADO ATUALIZADO

```text
convite demo → abrir solicitação/grupo → ação persistida
fixture genérica → leitura/descarte em React → QUEBRA NO RELOAD
```

Convites possuem ação persistida (1D-5). O catálogo fixture de
`/notificacoes` continua visual e sem clique. Read/unread não existe.

## Maiores bloqueios (após 1E)

Os P0 de identidade, social, Reels e mobilidade foram encerrados em
1D-1…1D-4. A auditoria 1E **não encontrou P0 novo do núcleo**.

Residuais que ainda enganam o usuário:

1. Seguir negócio e Participar de evento são só React.
2. Ir juntos persiste o convite e aguarda um aceite que ainda não existe.

Nenhum desses problemas exige Supabase.

## Priorização prática (após 1E)

### P0

Nenhum. Não reabrir 1D-1…1D-5.

### P1

1. **Ir juntos:** aceite local dos convites e só então habilitar a corrida.

### P2

- chamadas reais (WebRTC/signaling), bloqueio e mute persistidos;
- GPS, matching, pagamentos e dispatcher remoto;
- read/unread; histórico consolidado de conexões;
- telas órfãs `/corrida` `/destino` `/matching` `/rota`;
- lint global (478 erros + 20 warnings).

## Recomendação para 1D-1

Implementar **Identidade / Perfil local canônico** primeiro. É a dependência de
autor, ownership e preferências para Social, Conversas, Reels, Mobilidade e
Notificações. A mudança deve reutilizar `demo-own-profile`, não criar outro
storage, e deve incluir um teste de cadastro → reload → perfil.

## 1D-1 — Identidade / Perfil

- **Status:** PASS.
- **Fonte canônica de identidade demo:** `src/lib/demo/demo-identity.ts`
  (`getDemoIdentity()`), refletida pela sessão de `useAuth()`.
- **Fonte canônica de perfil demo:** `src/lib/demo/demo-own-profile.ts`, na
  chave já existente `connexy:demo:own-profile`. Nenhum banco, repository ou
  storage paralelo de perfil foi criado.
- **Problema:** as etapas demo navegavam sem gravar os campos coletados. Além
  disso, o cadastro em `/cadastro` marcava o signup sem iniciar a sessão, e o
  guarda demo pendente sempre retornava para `completar-perfil`, mesmo quando o
  primeiro passo já estava persistido.
- **Causa:** o ramo local das rotas não chamava a fonte de perfil já consumida
  por Home e Perfil; a flag `signup-pending` era avaliada sem considerar o
  estado persistido.
- **Correção:** `completar-perfil` e `interesses` agora gravam pela API única de
  `demo-own-profile`; a navegação ocorre somente depois de a escrita síncrona
  em `localStorage` retornar com sucesso. Falhas mantêm a etapa aberta e usam o
  toast existente. O cadastro inicia a mesma sessão demo, e o guarda retoma
  `interesses` quando nome, handle e idade já estão persistidos.
- **Campos persistidos:** identidade associada (`identityId`), nome, handle,
  bio, foto opcional, data de nascimento, idade derivada e interesses. Campos
  antigos de foto, capa, cidade, endereços privados e visibilidade são
  preservados ao completar um perfil incompleto.
- **Interesses:** trim e deduplicação case-insensitive preservam a primeira
  ocorrência e a ordem; menos de três itens únicos não concluem a etapa.
- **Reload:** perfil, interesses, foto, idade, identidade e edições posteriores
  foram validados em `localStorage` nativo com Chrome/Chromium e reload real.
  Home e Perfil continuam usando `useDemoOwnProfile`; o contrato
  `getCanonicalDemoProfile()` entrega a mesma identidade/perfil para os demais
  módulos.
- **Testes:** 20 testes focados, 104 assertions e zero falhas; suíte completa
  com 221 testes, 621 assertions e zero falhas. Typecheck e build passaram.
  Lint focado nos arquivos 1D-1 passou; o baseline global não foi corrigido.
- **Limitações:** por restrição de escopo, telas de Social, Conversas e Reels
  que ainda usam fixtures ou `currentUser` não foram refatoradas. A automação
  de Chrome validou as funções reais e o storage nativo; a aba integrada do
  Cursor não alcançou o servidor local para repetir o roteiro por cliques.
- **Arquivos da fase:** `src/lib/demo/demo-own-profile.ts`,
  `src/lib/profile/profile-rules.ts`, `src/lib/profile/profile-status.ts`,
  `src/routes/cadastro.tsx`, `src/routes/completar-perfil.tsx`,
  `src/routes/interesses.tsx`, `tests/persist-phase-1d-1.test.ts`,
  `tests/fixtures/profile-onboarding-browser.ts`,
  `tests/helpers/cdp-browser.ts`,
  `tests/persist-phase-1d-1-browser.test.ts` e este documento.
- **Supabase:** não acessado nem alterado.

## 1D-2 — Social / Conversas

- **Status:** PASS.
- **Fonte canônica de Connections:** `src/lib/demo/demo-db.ts`, no registro
  `connections` da chave local existente `connexy:demo:db`.
- **Fonte canônica de Invites:** `src/lib/demo/demo-db.ts`, no registro
  `requests` da mesma chave. Solicitações agora possuem remetente
  (`fromUserId`) e destinatário (`toUserId`) explícitos.
- **Fonte canônica de Conversations:** `ConversationRepository`, store
  `conversations` do IndexedDB `connexy-app-local-db`, acessado pela facade
  `src/lib/chat/local-chat-persistence.ts`.
- **Fonte canônica de Messages:** `MessageRepository`, store `messages` do
  mesmo IndexedDB e da mesma facade.
- **Problema:** o id do destinatário era gravado como remetente do convite, o
  blob de conexões não representava o par de identidades e a lista de conversas
  ignorava os agregados persistidos. Assim, o remetente via e aceitava o próprio
  convite, a troca de identidade não tinha isolamento social e o resumo da
  conversa podia voltar para fixtures após reload.
- **Correção:** convites são direcionais e idempotentes; conexões registram as
  duas identidades e um id determinístico de conversa. O aceite aguarda a
  criação idempotente do agregado em IndexedDB antes de navegar. A lista e a
  tela de chat resolvem o participante pelo par conectado e priorizam o
  agregado persistido sobre conversas fixture com id colidente.
- **Fluxo:** A envia para B; somente B recebe a solicitação; B pode recusar ou
  aceitar; o aceite cria uma única conexão e uma única conversa; A e B abrem o
  mesmo `conversationId`; mensagens incluem `senderId`, atualizam o agregado e
  sobrevivem a reload.
- **Reload e hidratação:** o pub/sub do `demo-db` passou a ouvir o mesmo evento
  emitido pela facade IndexedDB. O cache preserva mensagens enviadas durante a
  hidratação, carrega também Conversations e permite aguardar as gravações
  pendentes nos testes de browser.
- **Compatibilidade:** Connections e Requests legados são normalizados na
  leitura, sem limpeza ou migração destrutiva. O formato antigo é associado à
  identidade demo padrão, preservando os dados existentes.
- **Duplicação:** reenvio do mesmo convite reutiliza o registro; aceite,
  conexão e criação de conversa repetidos são idempotentes; múltiplos reloads
  não duplicam mensagens.
- **Testes:** 9 testes focados, 79 assertions e zero falhas, incluindo fluxo
  completo com Lucas, Beatriz e Rafael em Chrome/Chromium, `localStorage` e
  IndexedDB nativos. Suíte completa: 230 testes, 700 assertions e zero falhas.
- **Limitações:** catálogo de pessoas e conversas iniciais continua em fixtures.
  A central completa de notificações, read/unread, bloqueio e realtime remoto
  permanecem fora desta fase.
- **Arquivos da fase:** `src/lib/demo/demo-db.ts`,
  `src/lib/demo/use-demo-db.ts`, `src/lib/chat/local-chat-persistence.ts`,
  `src/lib/feed/commonalities.ts`, `src/hooks/api/use-chat.ts`,
  `src/routes/_app.solicitacao.$id.tsx`, `src/routes/_app.home.tsx`,
  `src/routes/_app.notificacoes.tsx`,
  `src/components/chat/conversation-invite-button.tsx`,
  `src/components/chat/conversations-screen.tsx`,
  `src/components/chat/ConnexyChatScreen.tsx`,
  `src/components/chat/group-invite-sheet.tsx`,
  `src/components/home/HomeActionHub.tsx`,
  `tests/persist-phase-1d-2.test.ts`,
  `tests/fixtures/social-conversation-browser.ts`,
  `tests/persist-phase-1d-2-browser.test.ts` e este documento.
- **Supabase:** não acessado nem alterado.

## 1D-3 — Reels / Feed

- **Status:** PASS.
- **Fonte canônica de Reels:** `ReelRepository`, store `reels` do IndexedDB
  `connexy-reels-data-local-db`, acessado por
  `src/lib/reels/persisted-reels-reader.ts`.
- **Fonte canônica de Likes:** `ReelLikeRepository`, store `reel_likes` do
  mesmo IndexedDB. A chave determinística `${reelId}::${userId}` mantém uma
  única curtida por identidade e Reel.
- **Fonte canônica de Comments e Replies:** `ReelCommentRepository`, store
  `reel_comments`. Replies são registros normalizados no mesmo repository,
  ligados por `parentId` e ordenados por `siblingOrder`.
- **Fonte do catálogo demo:** `MOCK_REELS`, em
  `src/lib/reels/reel-mocks.ts`. O catálogo permanece somente leitura, não é
  migrado nem gravado no IndexedDB.
- **Problema:** Feed, publicação, Likes e Comments ainda usavam as chaves
  históricas de `localStorage`, enquanto os repositories validados na 1C-3 não
  tinham consumidores de produto. O detalhe de Reel não montava por falta do
  `Outlet`, recebia `comments={[]}` e a UI não oferecia Reply.
- **Correção:** o leitor persistido existente passou a ser a facade fina sobre
  os três repositories. O Feed combina Reels persistidos primeiro com
  `MOCK_REELS`, elimina IDs repetidos e deriva Likes/Comments das coleções
  canônicas. A ordenação inicial por data garante que uma publicação recente
  fique visível. A rota de detalhe agora monta corretamente.
- **Publicação local:** `publishReel` preserva o banco de mídia existente e
  grava a metadata no `ReelRepository`, sem dual-write em
  `connexy:reels:published:v1`. Em modo demo, o caminho remoto não é tentado.
  Falha na metadata remove a mídia recém-gravada e é propagada à UI.
- **Like e Unlike:** a UI usa `ReelLikeRepository` com
  `getDemoIdentity().id`; contagem e estado visual são atualizados somente
  após a gravação concluir e sobrevivem ao reload.
- **Comment e Reply:** o Feed e o detalhe criam comentários com a identidade
  demo canônica. A UI oferece `Responder`, envia `parentId`, reconstrói a
  árvore recursivamente via `listByParent` e preserva autor, `createdAt`,
  `siblingOrder` e likes de comentário. O sheet foi colocado acima da
  navegação inferior para que seu botão de envio permaneça clicável.
- **Reload e duplicação:** Reel publicado, Like, Comment e Reply foram
  verificados em IndexedDB real. Repetição do mesmo ID e reloads sucessivos não
  duplicam registros; colisão entre catálogo e persistido mantém uma única
  entrada, com precedência do persistido.
- **Legado preservado:** `connexy:reels:published:v1`,
  `connexy:reels:likes:v1` e `connexy:reels:comments:v1` não são escritos pelo
  novo fluxo e permaneceram byte a byte intactos no teste. A preferência
  `connexy:reels:sound:v1` continua em `localStorage`.
- **Testes:** 1 teste focado de browser, 38 assertions e zero falhas, cobrindo
  catálogo + persistido, publicação, deduplicação, Like/Unlike, identidade,
  Comment, Reply, árvore, `parentId`, `siblingOrder`, reloads, ausência de
  dual-write e ausência de rede. Suíte completa: 231 testes, 738 assertions e
  zero falhas. O mesmo fluxo de Comment → Reply → reload também foi exercitado
  pela UI real em `/reels/reel-001`.
- **Limitações:** o upload automatizado pela UI não foi usado porque a
  automação disponível não fornece seleção de arquivo; o caminho de publicação
  foi validado no Chrome real pelo mesmo `publishReel`. Saves, follows, shares
  e publicação remota permanecem fora da fase.
- **Arquivos da fase:** `src/lib/reels/persisted-reels-reader.ts`,
  `src/lib/reels/reel-feed.ts`, `src/lib/reels/reel-publish.ts`,
  `src/lib/reels/reel-local-storage.ts`,
  `src/components/reels/reel-comments-sheet.tsx`,
  `src/components/reels/reel-comment-item.tsx`,
  `src/routes/_app.reels.tsx`, `src/routes/_app/reels/$reelId.tsx`,
  `src/routes/_app.gerenciar.novo-reel.tsx`,
  `tests/fixtures/reels-feed-browser.ts`,
  `tests/persist-phase-1d-3-browser.test.ts` e este documento.
- **Supabase:** nenhum arquivo, migration, policy, bucket ou configuração foi
  alterado; o teste confirmou zero chamadas de rede no fluxo local.

## 1D-4 — Mobility

- **Status:** PASS.
- **Fonte canônica de Trip e Active Ride:** `src/lib/mobility/trip/trip-store.ts`
  e a máquina `trip-machine.ts`, persistidas na chave local existente
  `connexy_demo_trip`. A mesma Trip, com o mesmo `id`, atravessa planejamento,
  despacho, corrida, pagamento e conclusão.
- **Fonte canônica de Dispatcher:** `LocalDispatcher`, em
  `src/lib/mobility/dispatch/dispatcher-store.ts`, integrado à Trip por
  `src/lib/mobility/dispatch/dispatcher.ts`. Frota, ofertas e atribuições
  continuam em memória; a política demo permanece em
  `connexy_demo_dispatcher`. Após reload, a Trip persistida é suficiente para
  retomar a tela do passageiro e o modo motorista deriva a atribuição ativa da
  própria Trip.
- **Fonte canônica de History:** o array `history` do mesmo
  `connexy_demo_trip`, acessado por `getHistorySnapshot()`. Transições para
  `conclusao` e `cancelada` arquivam imediatamente por `trip.id`, e
  `resetTrip()` não duplica.
- **Fonte canônica de Payment:** `paymentMethod`, `paymentConfirmed` e
  `paymentIssue` na Trip, com regras de apresentação em
  `src/lib/mobility/payment.ts`. Os únicos métodos do fluxo são `dinheiro` e
  `pix`, ambos manuais e sem QR Code, gateway ou cobrança.
- **Fonte canônica de Driver State:** frota/oferta no `LocalDispatcher`, Trip
  atribuída em `trip.driver` e aprovação demo existente em
  `connexy_driver_application_v1`. Nenhum novo sistema de aprovação foi criado.
- **Estados:** foi preservada a máquina existente:
  `solicitar → rota → embarque → categoria → buscando → encontrado → chegando
  → chegou → emviagem/parada → chegada → avaliacao → conclusao`, além de
  `cancelada`. `canComplete` agora coincide com a transição real
  `avaliacao → conclusao`.
- **Solicitação e identidade:** `/ride` passou a inicializar a mesma Trip que
  `/ride/request`, respeitando o bloqueio por inadimplência. `createTrip`
  rejeita nova solicitação bloqueada e impede que uma Trip ativa seja
  reutilizada por outra identidade. O dispatcher resolve nome e foto pelo
  `userId` persistido da Trip.
- **Paradas e Ir junto:** `MAX_ROUTE_STOPS = 3` é aplicado no domínio, em
  patches da Trip e na conversão de companions. Zero, uma, duas e três paradas
  foram percorridas; a quarta foi rejeitada. `Ir juntos` reutiliza
  `RouteStop[]`, `source: "invite"` e `companionLabel`, sem segundo modelo de
  rota.
- **Avanço e recuperação:** origem, destino, ordem, `currentStopIndex`,
  motorista, método de pagamento e timestamps sobrevivem ao reload. O teste
  recarregou durante uma corrida de três paradas, continuou da parada correta,
  concluiu e reencontrou a mesma Trip no histórico após novo reload.
- **Finalização e pagamento:** uma corrida pendente não pode ser concluída como
  se o pagamento tivesse sido resolvido. O motorista confirma Dinheiro/Pix ou
  registra `user_not_paid`; somente então a avaliação conclui e arquiva a
  viagem. Falhas de `localStorage` não avançam mais o estado em memória e são
  propagadas.
- **Inadimplência:** `recordUnpaidTrip()` e
  `connexy_demo_ride_blocks` continuam sendo a regra existente. Registro
  repetido não duplica; nova corrida é bloqueada; `clearRideBlock()` regulariza
  e libera novamente. A regularização ainda não possui tela própria.
- **Cancelamento:** cancelamentos do passageiro e do motorista entram no mesmo
  histórico sem duplicar. Desistência do motorista antes do embarque reabre o
  dispatcher; durante a viagem encerra a Trip como `cancelada`.
- **Testes:** 6 testes focados, 105 assertions e zero falhas, incluindo Chrome
  real, múltiplos reloads, quatro quantidades de paradas, Dispatcher,
  atribuição, Driver, Dinheiro, Pix, inadimplência, desbloqueio, cancelamentos,
  Ir junto, falha de persistência e ausência de rede. Suíte completa:
  237 testes, 843 assertions e zero falhas.
- **Limitações:** mapa e distâncias permanecem simulados; o dispatcher não é
  persistido separadamente; regularização de inadimplência não tem UI; o CTA
  social de Ir junto continua dependente do fluxo de convite existente; não há
  GPS, matching, pagamento ou realtime remotos.
- **Arquivos da fase:** `src/lib/mobility/route-utils.ts`,
  `src/lib/mobility/ride-search.ts`, `src/lib/mobility/ride-utils.ts`,
  `src/lib/mobility/trip/trip-store.ts`,
  `src/lib/mobility/trip/trip-machine.ts`,
  `src/lib/mobility/trip/ride-blocks.ts`,
  `src/lib/mobility/dispatch/dispatcher.ts`,
  `src/components/mobility/ride/ride-flow.tsx`,
  `src/routes/_app/ride.index.tsx`, `src/routes/_app/ride/request.tsx`,
  `src/routes/_app/driver/index.tsx`,
  `tests/persist-phase-1d-4.test.ts`,
  `tests/fixtures/mobility-trip-browser.ts`,
  `tests/persist-phase-1d-4-browser.test.ts` e este documento.
- **Supabase e outros P0:** Supabase, Reels, Social/Conversas e
  Identidade/Perfil não foram alterados. O teste confirmou zero chamadas de
  rede.

## 1D-5 — Notifications / History / Settings

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1d-5.md`.
- **Fonte canônica de Notifications:** projeção de solicitações e convites
  de grupo em `src/lib/demo/demo-db.ts` (`connexy:demo:db`), exposta por
  `listLocalInboxItems()`. A rota de produto é `/notificacoes`.
- **Fonte canônica de History:** `getHistorySnapshot()` em
  `src/lib/mobility/trip/trip-store.ts` (`connexy_demo_trip`).
- **Fonte canônica de Settings:** presença em
  `connexy.presence.preference` e modo em `connexy_roles`.
- **Testes:** 8 testes focados, 98 assertions e zero falhas, incluindo
  Chrome real. Suíte completa: 245 testes, 941 assertions e zero falhas.

## 1E — Auditoria global do Local Functional MVP

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1e.md`.
- **Modo:** somente auditoria; nenhum código funcional alterado.
- **Achado central:** o núcleo 1D-1…1D-5 permanece FUNCIONAL. O gap
  restante é Explorar/Locais + Create visual (PARTIAL), com CTAs mortos
  documentados, sem P0 novo.
- **Browser:** sessão demo em `:8080`; Home **Boa noite, Lucas**;
  presença **Invisível** persistida após navegação; mensagem de
  chat persistida após reload; histórico vazio; `/locais` busca
  inerte e filtro Cafés funcional; Ir juntos envia e não habilita
  corrida; Discover Eventos sem navegação; `/create/reel` toast;
  `/gerenciar/novo-reel` canônico; `/notifications` redireciona.
  Logout não exercitado nesta aba (auto-review).
- **Próxima fase recomendada:** 1F Explore/Locais/Create canônico,
  ainda local, sem Supabase.

## 1F-1 — Explore / Locais

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-1.md`.
- **Busca `/locais`:** `filterNearbyPlaces()` sobre o catálogo `places`.
- **Eventos Discover:** navegam para `/event/sunset-parque` via lookup
  existente + lugares com categoria Eventos.
- **Favoritos:** local e negócio usam `connexy:demo:saved-details`.
- **Ir juntos:** convite permanece na chave existente; CTA honesto de
  “convite enviado / aguardando resposta”, sem aceite nem corrida.
- **Testes:** 12 focados; suíte completa 257 pass / 995 assertions / 0 fail.

## 1F-2 — Create canônico de Reel

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-2.md`.
- **Problema:** `/create/reel` usava `usePublisherForm` (toast → `/home`)
  sem persistir; o hub `/create` apontava Reel para esse caminho.
- **Correção:** CTA Reel do hub → `/gerenciar/novo-reel`; `/create/reel`
  redireciona com `replace: true`. Sem novo formulário, repository ou
  persistência.
- **Fonte canônica:** `publishReel` → `ReelRepository` → IndexedDB
  `connexy-reels-data-local-db` / store `reels`.
- **Legado:** `usePublisherForm` permanece para os demais tipos do hub.
  `roles-engine`, `RoleSelector` e `context-rules` ainda nomeiam
  `/create/reel`; o redirect os cobre.
- **Testes:** 5 focados (4 unitários + 1 browser CDP); suíte completa
  262 pass / 1024 assertions / 0 fail.

## 1F-3 — Create Hub, tipos restantes

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-3.md`.
- **Foto/vídeo/texto:** hub e `/create/{photo,video,text}` → `/create-post`
  (`saveDemoPost`, chave existente `connexy:demo:posts`).
- **Ride:** `/create/ride` → `/ride/request` (Trip 1D-4). Não há listagem
  persistida de carona.
- **Evento/local/oferta/momento/negócio:** na 1F-3, tela honesta de
  indisponibilidade. Momento ligado na 1F-8; Evento/local/oferta/negócio
  ligados na 1F-12 (`connexy:demo:catalog`).
- **Reel:** intacto (1F-2).
- **Testes:** 8 focados (7 unitários + 1 browser CDP); suíte completa
  270 pass / 1125 assertions / 0 fail.

## 1F-4 — Meu Connexy sem wizards falsos

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-4.md`.
- **Wizards:** negócio/evento/local/oferta deixam de simular cadastro e
  abrem o estado honesto da 1F-3.
- **Métricas:** estatísticas, atividade recente e PresenceAnalytics de
  catálogo não são mais apresentadas como dados do usuário.
- **Preservado:** `/gerenciar/novo-reel`, Foto/Vídeo/Texto → `/create-post`,
  Mobilidade `/driver`.
- **Testes:** 6 focados (5 unitários + 1 browser CDP); suíte completa
  276 pass / 1191 assertions / 0 fail.

## 1F-5 — Social residual: Connecta, Conversas e Notificações

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-5.md`.
- **Connecta:** Solicitações lê `getPendingRequests()`; o filtro online/perto
  passa a ter efeito. Aceitar/recusar permanece em `/solicitacao/$id`.
- **Conversas:** a lista funcional não mistura `MOCK_CONVERSATIONS`.
  ConversationRepository / MessageRepository intactos.
- **Notificações:** inbox = `listLocalInboxItems()` apenas. Sem read/unread.
- **Testes:** 8 focados (7 unitários + 1 browser CDP); suíte completa
  284 pass / 1293 assertions / 0 fail.

## 1F-6 — Ir juntos: aceite local e habilitação da corrida

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-6.md`.
- **Convite:** continua em `connexy:demo:outing-invites` com
  `pending` / `accepted` / `declined`.
- **Inbox:** Pessoa B recebe o outing invite na mesma projeção da 1F-5.
- **Corrida:** CTA só após aceite; `/ride/request` + `RideFlow` /
  `createTrip` existentes. Sem Trip store novo.
- **Testes:** 10 focados (9 unitários + 1 browser CDP); suíte completa
  294 pass / 1415 assertions / 0 fail.

## 1F-7 — Reels residuais: Seguir, Guardar e Conectar

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-7.md`.
- **Seguir:** `follows[]` no blob `connexy:demo:db`. Sem FollowRepository.
- **Guardar:** `connexy:demo:saved-details` com `reel.id`.
- **Conectar:** `/solicitacao/$id` + requests/connections da 1D-2.
- **Testes:** 5 focados (4 unitários + 1 browser CDP); suíte completa
  299 pass / 1491 assertions / 0 fail.

## 1F-8 — Tipos restantes do catálogo Create

- **Status:** PASS parcial. Detalhe em
  `docs/audits/local-functional-mvp-1f-8.md`.
- **Momento:** `/create/moment` → `/create-post?category=MOMENT` →
  `connexy:demo:posts`. Sem chave nova.
- **Evento / local / oferta / negócio:** na 1F-8, BLOCKED. Ligados na
  1F-12 com um store `connexy:demo:catalog`, sem virar posts.
- **Testes:** 4 focados (3 unitários + 1 browser CDP); suíte completa
  304 pass / 1558 assertions / 0 fail.

## 1F-9 — Dispatcher persistido

- **Status:** PASS. Detalhe em `docs/audits/local-functional-mvp-1f-9.md`.
- **Autoridade:** Trip em `connexy_demo_trip`. Dispatcher deriva no boot.
- **Sem chave nova:** `connexy_demo_dispatcher` continua só a política demo.
- **Testes:** 6 focados (5 unitários + 1 browser CDP); suíte completa
  310 pass / 1632 assertions / 0 fail.

## 1F-10 — Chamada de voz/vídeo no Chat

- **Status:** PASS (fluxo local/demo). Detalhe em
  `docs/audits/local-functional-mvp-1f-10.md`.
- **Autoridade:** conversa existente (`conversationId`, `callerId`,
  `calleeId`). Histórico via `sendLocalMessage` (TEXT no IndexedDB).
- **Sem chave nova / sem WebRTC:** sessão em memória; overlay declara o
  modo demo. Signaling, STUN/TURN e `RTCPeerConnection` permanecem
  BLOCKED como telefonia real.
- **Testes:** 5 focados (4 unitários + 1 browser CDP); suíte completa
  315 pass / 1709 assertions / 0 fail.

## 1F-12 — Catálogo local persistente

- **Status:** PASS (cadastro local/demo). Detalhe em
  `docs/audits/local-functional-mvp-1f-12.md`.
- **Store único:** `connexy:demo:catalog`. Sem Event/Place/Offer/Business
  repository, sem IndexedDB de catálogo, sem `connexy:demo:posts`.
- **Identidade:** `ownerId = getDemoIdentity().id`. Overlay nas listas
  e detalhes existentes. `ssr: false` nos detalhes para sobreviver ao
  reload.
- **Honesto:** copy de cadastro local/demo. Publicação remota BLOCKED.
- **Testes:** 4 focados (3 unitários + 1 browser CDP); suíte completa
  319 pass / 1818 assertions / 0 fail.

## 1F-13 — Fechamento do catálogo local + menu "Mais"

- **Status:** PASS (cadastro local/demo). Detalhe em
  `docs/audits/local-functional-mvp-1f-13.md`.
- **Catálogo:** Evento, Local, Negócio e Oferta no store único
  `connexy:demo:catalog`. Create/Read/List/Detail/Reload validados.
  Edit/Delete ausentes. Ofertas do menu reutilizam `/marketplace`.
- **Menu Mais:** Locais, Eventos, Negócios, Reel, Ofertas, Gerenciar.
  Sem itens extras. Create Hub permanece a criação.
- **Gerenciar:** lista Catálogo local das entidades do
  `getDemoIdentity().id`.
- **Testes:** 5 focados (4 unitários + 1 browser CDP); suíte completa
  324 pass / 1891 assertions / 0 fail.

## 1G-2 — Auditoria E2E do MVP local

- **Status:** PASS PARCIAL. Detalhe em
  `docs/audits/local-functional-mvp-1g-2.md`.
- **Código:** `FILES CHANGED: 0`. Sem nova persistência.
- **Integração:** identidade/perfil/home, conexão/conversa/call demo,
  catálogo, menu Mais, saves e Momento vs posts permanecem canônicos.
  Overlay de catálogo é por dispositivo; Gerenciar filtra `ownerId`.
- **Testes:** suíte inalterada 324 pass / 1891 assertions / 0 fail.

## 1G-3 — Nomenclatura de produto Reels → Agora

- **Status:** PASS. Detalhe em
  `docs/audits/local-functional-mvp-1g-3.md`.
- **UI:** o módulo é apresentado como **Agora** (menu Mais, títulos,
  empty states, Create Hub, Gerenciar, partilha).
- **Infraestrutura:** inalterada. Rota `/reels`. IndexedDB
  `connexy-reels-data-local-db`. `ReelRepository` / likes / comments.
- **Menu Mais:** Locais, Eventos, Negócios, Agora, Ofertas, Gerenciar.
- **Testes:** 4 novos (3 unitários + 1 browser CDP); suíte completa
  328 pass / 1951 assertions / 0 fail.

## 1H-2 — Home Discovery + Connect Pulse + Reserva + Carona Amiga

- **Status:** PASS. Detalhe em
  `docs/audits/local-functional-mvp-1h-2.md`.
- **Pulse:** projeção visual sobre catálogo/fixtures, sem `Link`.
- **Perto de você:** paginação de apresentação 5 + 5; Ver mais →
  `/locais`.
- **Reserva:** `connexy:demo:reservations`, confirmação imediata,
  isolamento por identidade.
- **Carona Amiga:** `connexy:demo:carona`, conversa via
  `connectUser` / `sendLocalMessage`. Sem dispatcher.
- **Menu Mais:** inalterado (Locais, Eventos, Negócios, Agora,
  Ofertas, Gerenciar).
- **Testes:** 7 novos (6 unitários + 1 browser CDP); suíte completa
  335 pass / 2025 assertions / 0 fail.

## Validação do baseline

- Testes existentes: **335 pass / 2025 assertions / 0 fail**.
- TypeScript: **PASS**.
- Build: **PASS**.
- Lint dos arquivos 1H-2: **PASS**. Lint global: **FAIL — baseline
  preexistente (não limpo nesta fase)**.
- Commit/push: **não realizados**.

## Arquivos alterados nesta fase (1H-2)

Home discovery, Pulse, nearby, reserva genérica, Carona Amiga,
testes 1H-2 e relatórios. Sem IndexedDB novo, sem `/agora`, sem
segunda caixa de mensagens, sem alterar Trip/dispatcher.

As fases antigas 1C-3C-E/F/G/H permanecem pausadas. Não iniciar a
próxima fase automaticamente.
