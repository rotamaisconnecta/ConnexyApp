# CONNEXY — AUDITORIA MESTRE DE PRODUTO, UX, ARQUITETURA E ROADMAP

- **Data**: 2026-09-10
- **Tipo**: auditoria **somente leitura** (nenhuma alteração de código; working tree limpo; **sem commit**)
- **Branch**: `fix/chat-publicacao`
- **Base**: 41 requisitos/temas fornecidos pelo usuário + verificação estática do codebase (7 auditorias de domínio: navegação/shell, conversas, conteúdo/publicação, home/locais/eventos/check-in, contatos/permissões/uploads, mobilidade, admin/arquitetura)
- **Legenda**: ✅ EXISTE · 🟡 PARCIAL · ❌ NÃO EXISTE · 🧪 MOCK (dado fictício) · 💀 DEAD (código morto) · 🔮 FUTURO (decisão de produto postergada)

---

## 1. Sumário executivo

O Connexy hoje é um protótipo de experiência coeso em **modo demo** (`VITE_APP_DEMO_MODE`), rodando 100% em localStorage, com três famílias de produto ativas: **Conteúdo/Publicação (UX moderna)**, **Conectividade (conversas/grupos/presença)** e **Mobilidade (corridas + motorista)** — e duas famílias rascunhadas: **Comércio (marketplace/anúncios)** e **Locais (check-in/avaliações)**.

Pontos de força: conversas com header/composer fixos e rolagem isolada (3 dos 41 itens já atendidos e estáveis); criação de conteúdo com prévia no fluxo moderno; check-in com visibilidade e lista de presentes; decisões de mobilidade das fases 6.4-A/B/C conservadas; engenharia de "payments/rides" limpa e testável (11/11 E2E).

Pontos críticos: **navegação global incompatível com o requisito "BottomNav em todas as telas"**; prévia publicacional ausente para evento/local/oferta; **nenhuma gestão de conteúdo ativo real** (ver/editar/excluir/pausar); contatos do celular, configurações espalhadas, IA sem revisão humana, admin/moderacão/métricas inexistentes, sort de distância com **bug lexicográfico**, e uma camada de "mock estático" que **parece funcional** em várias telas (my-connexy, dashboards de motorista, marketplace, config).

Nenhum defeito crítico de segurança foi introduzido nesta auditoria; os riscos operacionais mais relevantes são de **estado em memória/localStorage que pode enganar a demo** (descritos na §7.3).

---

## 2. Estado por requisito (41 itens)

### A. Lembretes, agenda e programações (1–2)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 1 | Lembrar de evento no dia com opção de check-in | ❌ NÃO EXISTE | Nenhum scheduler/comparador de data-lista de eventos; sem notificação in-app; evento tem data (`formatEventDateTimeRange`) mas nenhum lembrete |
| 2 | Agenda de viagens e programações | ❌ NÃO EXISTE | `ScheduleRide` é só um toggle "agendar para depois" em `ride/request`; sem agenda exibível nem programação de ações |

### B. Publicação e gestão de conteúdo (3–5)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 3 | Prévia completa antes de publicar | 🟡 PARCIAL | Post: ✅ `post-preview.tsx` + `create-post-form.tsx:187-194`; texto/foto/vídeo/momento e «criar reel» no wizard: prévia textual (resumo de dados, `_app.gerenciar.novo-reel.tsx:358-401`); **evento, local/lugár-negócio e oferta: SEM prévia**; «novo-reel» via gerenciar: só resumo |
| 4 | Gestão de conteúdos ativos (publicações, eventos, locais/negócios, produtos, anúncios — ver/editar/excluir/pausar/reativar) | 🟡 PARCIAL | Bio: publicações com editar/excluir reais ✅; `MyConnexy` e painéis `/gerenciar` mostram cards **mock estático** com botões (Editar/Excluir/Pausar/Ativar) que **não executam ação** (sem handler); `gerenciar.tsx` só **direciona para criação**; **sem listagem dinâmica** de eventos/locais/ofertas/anúncios + CRUD |
| 5 | Compartilhar o app (fim da Home e Configurações) | ❌ NÃO EXISTE | Building block existe (`lib/share/share-connexy.ts:21-23` — WhatsApp/nativo/copiar link) mas só usado p/ compartilhar **conteúdo**; `ConnexyInviteCard` definido e **nunca renderizado** 💀; `/config` não tem "Compartilhar app" |

### C. Permissões e galeria/câmera/mic (6)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 6 | Permissões contextuais (fotos/galeria, câmera, microfone, chamadas áudio/vídeo) | 🟡 PARCIAL | Utils `permissions.ts` + hook granulares; `getUserMedia` usado em validação de avatar e camera capture no chat (`ConnexyChatScreen.tsx:221-226`); **chamadas de áudio/vídeo NÃO existem** (placeholder toast); **gravação de voz = placeholder**; sem gestion contextuAL por tipo de fluxo |

### D. Conversas (7–11, 20–25)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 7 | Adicionar mais pessoas às conversas | 🟡 PARCIAL | `GroupInviteSheet` (`group-invite-sheet.tsx:15-172`) cria um **NOVO grupo** selecionando pessoas; **não adiciona participantes a uma conversa existente** (sem `addParticipant`); aviso "histórico não é copiado" (:67) |
| 8 | Header de conversa fixo | ✅ EXISTE | Estrutura flex com header fora do container de scroll — funcionalmente fixo (`chat-header.tsx`, layout `ConnexyChatScreen`) |
| 9 | Composer fixo | ✅ EXISTE | Autor/input ancorado fora do scroll (`ConnexyChatScreen.tsx:667-676`) |
| 10 | Só o conteúdo rola na conversa | ✅ EXISTE | Scroll confinado ao `<main>` da conversa (`ConnexyChatScreen.tsx:390`) |
| 11 | BottomNav visível em TODAS as telas, inclusive conversa | ❌ NÃO EXISTE | `_app.tsx:42-60` **oculta** a BottomNav nas imersivas: `/chat/$conversationId`, `/solicitacao/$id`, `/perfil?edit=true`, `/ride`, `/ride/request|matching|active` (e companions). Requisito em **conflito direto** com a atual decisão de imersão |
| 20 | Fixar conversas (pin) | 🟡 PARCIAL | Campo `isPinned`, ordenação e ícone existem; **sem ação de pin/unpin** pelo usuário (nenhum botão/gesto conecta ao store) |
| 21 | Auditar finalidade dos três pontos | 🟡 PARCIAL | ⋮ **na lista de conversas: sem handler** (nada acontece) 💀; ⋮ **aberto na conversa**: Ver perfil, Convidar, Participantes, Sair do grupo, Videocall (placeholder), Silenciar, Bloquear (placeholder) — 3 de 7 reais |
| 22 | Ações rápidas ouvir/confirmar/retornar sem abrir conversa | 🟡 PARCIAL | Na lista, só "Confirmar" age direto (gesto inline); **Ver/Ouvir/Responder/Retomar abrem a conversa**; sem pré-visualização de áudio na lista |
| 23 | Alinhar controles dos cards de Configurações | 🟡 PARCIAL (a confirmar tela a tela) | Cards de config com estilos variados; alinhamento de toggles/lista não uniforme — tarefa de polimento UI |
| 24 | Ligar a partir da conversa | 💀 MOCK QUEBRADO | Botão Phone existe no header mas `onCall` **não é passado** → botão não renderiza efeito; "videocall" é toast placeholder. Sumariamente: **não é possível ligar** na prática |
| 25 | Navegação começa no topo | 🟡 PARCIAL | `router.tsx:11` `scrollRestoration:true` + reset do **container externo** (`_app.tsx:78-80`); containers internos não resetam (ex.: lista de conversas preserva posição); `/pessoas` preserva filtro intencionalmente |

### E. Check-in e Home (12–13)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 12 | Check-in com convite de amigos | 🟡 PARCIAL | Check-in completo ✅ (`presence-checkin.tsx:20-151`, modal + privacidade público/amigos/anônimo + `present-list.tsx` + raio em `event-checkin-button.tsx`); **convite de amigos DENTRO do check-in: ❌** — "Ir juntos" (`local-engagement.tsx:241-468`) é fluxo separado, sem check-in anexado |
| 13 | "Acontecendo Agora" — mais cards, conteúdo de amigos, rotação e abrir publicação | 🟡 PARCIAL | `HomeActionHub.tsx:265-332`: **apenas 2 cards** (1 fixo do amigo + 1 rotativo a cada 8s entre evento/local/marketplace); ao tocar **abre a página** do item (evento/local/perfil/marketplace), não a publicação em si; hint "Deslize para ver" é enganoso (sem conteúdo rolável) |

### F. Locais e publicações de local (14–15)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 14 | Locais com cardápio, produtos, serviços e fotos de acontecimentos | ❌ NÃO EXISTE | `_app.local.$id.tsx:42-173` e `/business/$businessId` exibem cover/rating/distância/promo/check-in/avaliações/mapa; **`Business` (`business-types.ts:117-143`) não tem campos menu/produtos/serviços/fotos de acontecimentos** |
| 15 | Fotografar o local + comentário + publicar associado | ❌ NÃO EXISTE | `create/photo` faz **upload de arquivo** + legenda + `PublisherLocationPicker` = **texto livre** ("Onde foi isso?"); sem associar a um local estruturado, sem câmera, sem termos de direitos de uso |

### G. Contatos do celular (16–18)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 16 | Identificar contatos do celular que já têm Connexy | ❌ NÃO EXISTE | Sem API de contatos, sem matching por telefone, sem backend de telefones |
| 17 | Separar contatos com/sem Connexy | ❌ NÃO EXISTE | (dependente de 16) |
| 18 | Convite via SMS/WhatsApp para quem não tem | ❌ NÃO EXISTE | Só link genérico de convite via WhatsApp (`share-connexy.ts`), sem dirigir a contatos específicos |

### H. IA (19)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 19 | IA para criar/melhorar anúncios e eventos, com revisão humana | 🟡 PARCIAL / 🧪 | Assistente IA global em `components/ai/*` com **templates hardcoded** (sem LLM client), focado em post/conversa/check-in; **não cobre anúncios/eventos**; **sem fluxo de revisão humana**; pode sugerir texto editável antes de usar em `create/*` |

### I. Mobilidade e motorista (26–28)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 26 | Perfil motorista no matching premium e inovador | 🟡 PARCIAL | Matching exibe foto/nota/veículo/placa (painel ok); sem destaque premium/narrativa inovadora do perfil |
| 27 | Motorista cadastrar chave PIX (futuro) | 🔮 FUTURO (DECIDIDO) | `DriverProfile.pixKey` e `bankAccount` **já existem** no tipo (`src/lib/driver/driver-types.ts:67-68`) — deve-se criar **UI de cadastro** (perfil/config motorista), sem gateway |
| 28 | Exibir chave PIX do motorista ao passageiro no fim da corrida | 🔮 FUTURO (DECIDIDO) | ❌ não existe; consolidado como FUTURO nas fases 6.4; requisito de produto registrado (não implementar gateway/carteira/split desta vez) |

### J. Admin, moderação, métricas (29–32)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 29 | Dashboard admin / visão geral do negócio | ❌ NÃO EXISTE | `/engine` e `/my-connexy` são do **usuário** (não plataforma); sem papel admin, sem visão agregada |
| 30 | Admin valida docs de motoristas | 🟡 PARCIAL | Motorista submete docs (`driver-application-storage.ts`); em demo é `auto-approve` (`use-driver-mode.ts:45`); **sem tela de validação admin** |
| 31 | Admin modera publicações/eventos/locais | ❌ NÃO EXISTE | Sem moderação, sem "reportar", sem fila de análise |
| 32 | Métricas de usuários/corridas/motoristas/anúncios | 🧪 MOCK | Números hardcoded em `my-connexy` e dashboards do motorista; sem métricas dinâmicas da plataforma |

### K. Logística e comércio (33–34, 39–41)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 33 | Entrega de comida/comércio via motoristas | 🔮 FUTURO (DECIDIDO) | ❌ não existe |
| 34 | Retirada no estabelecimento | 🔮 FUTURO (DECIDIDO) | ❌ não existe |
| 39 | "Menu Mais": substituir "Solicitar comida" por "Solicitar corrida" | ℹ️ N/A | **Não existe "Menu Mais"**; BottomNav = Home/Mapa/Criar/Chat/Perfil; "Solicitar comida" não está em lugar algum da navegação |
| 40 | "Menu Mais": manter Marketplace + My Connex, remover demais | ℹ️ N/A | Sem menu Mais; Marketplace acessível por roles/HomeActionHub; MyConnex disponível |
| 41 | Reservas em restaurantes/bares/serviços | 🔮 FUTURO (DECIDIDO) | ❌ não existe (só toast mock de reserva em anúncios) |

### L. Pulsos e proximidade (35–38)

| # | Requisito | Estado | Onde / Evidência |
|---|---|---|---|
| 35 | Connect Pulse estático/curado (sem links/sem interação) | 🟡 PARCIAL | Curadoria fixa de 7 pessoas + mapa decorativo (`ConnexyPulse.tsx:134-227`), porém **cada card tem link** (perfil) e CTA "Ver pessoas perto de mim" → requisito "sem links" não atendido |
| 36 | Perto de Você 5 + carregar mais 5 progressivamente | 🟡 PARCIAL | 7 cards fixos (não 5); `/discover` mostra 7 (slice) e `/pessoas` em grid sem paginação; **sem lazy-load / carregar mais ao rolar** |
| 37 | Perto de Você com "Ver todos" | 🟡 PARCIAL | CTA do Pulse → `/discover` e link no feed; mas o carrossel em si **não tem** "Ver todos" |
| 38 | Locais/eventos próximos por proximidade + raio progressivo | 🔴 COM BUG | Sort numérico correto em vários pontos (`discover.tsx:193`, `home-premium.ts:320`, etc.) **porém** `home-premium.ts:339-343` ordena a string formatada com `localeCompare` → **ordenação lexicográfica errada** ("1,2km" < "180m" ...); **expansão de raio progressiva: ❌** (só fallback fixo de 2km no sponsored feed) |

---

## 3. Auditoria transversal de UX/Shell e Arquitetura

### 3.1 Navegação e shell
- **BottomNav imersiva**: oculta em 5 famílias de rota (`_app.tsx:42-60`) — diretamente incompatível com o item 11. Conversa, solicitação de amizade, edição de perfil e o fluxo de corrida são telas sem navegação global.
- **Scroll aninhado**: `PhoneFrame` + `_app` criam duas camadas de rolagem; paddings de bottom para dar espaço à BottomNav são replicados por tela com valores divergentes (falhas de fundo cortado em algumas rotas) — corrigir em uma camada só.
- **Reset de scroll**: apenas container externo (`_app.tsx:78-80`); containers internos não resetam (item 25 parcial).
- **Rotas PT/EN coexistem** (`/notifications` vs traduções, `events`/`locais`): URL scheme misto; sem redirects — confusão de deep-link. A definir conscientemente; não reverter decisões anteriores sem autorização.

### 3.2 Conversas (estado detalhado)
- Fluxo servido por `conversations-store` (localStorage) + chat real-time **fake** (timers); mensagens mock/seedados; `typing indicator` definido mas não conectado ao envio.
- Mídia: imagem/vídeo via `<input type=file>` + dataURL **funcional** ✅; **áudio = placeholder** (sem gravação); **arquivo = placeholder**.
- Presença/leitura: read/unread funciona no estado local (mock), sem backend.
- Gestos na lista: confirmar/ouvir/retomar/responder como atalhos, mas só "Confirmar" age inline (item 22).
- 3 itens do requisito já maduros: header fixo (8), composer fixo (9), scroll isolado (10).

### 3.3 Conteúdo e publicação
- Dois mundos de criação: `/create/*` (moderno, com preview via `PublisherPreview`) e `/gerenciar/*` (legado, só direciona ou resumo). Coexistem sem convergir.
- **Uploads**: `UploadMedia` usa `simulateUpload` (demo); únicos uploads reais: avatar no onboarding (createObjectURL/DataStorage local). `services`/`repositories` (Supabase) **existem prontos mas mortos em demo**.
- **Gestão**: bio CRUD real; **todo o resto é mock estático** — MyConnex e gerenciar mostram estado fictício.
- **IA**: assistente com revisão no contexto de post (usuário edita o texto sugerido antes de publicar); ausente para anúncio/evento e **sem fluxo de revisão humana explícito** p/ publicar sob IA (item 19).

### 3.4 Home/descobrir
- 6 seções em `_app.home.tsx:64-172`: Pulse, ActionHub, Locais Próximos, Eventos Próximos, Descobertas locais (patrocinados), popup promocional.
- "Acontecendo Agora" reduzido a 2 cards (item 13); Connect Pulse com links (gap do item 35); sort lexicográfico no feed (item 38); raio progressivo ausente.

### 3.5 Mobilidade (decisões 6.4-A/B/C conservadas — confirmado)
- `confirmDriverPayment` (`trip-store.ts:230-239`), `recordUnpaidTrip` `246-260`, `cancelTrip` `205-210` sem issue; `ride-blocks.ts:103-130` exige `user_not_paid` e bloqueia nova corrida; disparador prioriza `DEMO_DRIVER_ID`; `active` derivado direto da Trip (`driver/index.tsx`).
- **Riscos de estado** (§7.3): trip presa em estado não-terminal após reload bloqueia nova `createTrip` (sem limpeza); dispatcher em memória (`demo-fleet` 3 motoristas, não persiste); `/corrida` e `/ride/active` **desacopladas** (par bloqueado histórico); `/driver/trip/$tripId` **100% mock**; ganhos do motorista **100% mock**; saldo/pagamento só verboso.

### 3.6 Comércio e locais
- Marketplace: página + detalhe + itens mock; **sem checkout real**; anúncios/ads mock com popup promocional hardcoded.
- Locais: 4 tipos (restaurante/café/loja/profissional?) com detalhe social (check-in, avaliações, "Ir juntos"); **sem cardápio/produtos/serviços/fotos de acontecimentos** (item 14); publicar foto **não associa** ao local (item 15).

### 3.7 Admin/plataforma
- Nada de admin de plataforma: sem papel, sem fila de validação de motorista, sem moderação, sem métricas agregadas (itens 29–32).

### 3.8 Riscos de arquitetura (cross-cutting)
- **Módulos duplicados/paralelos**: vários dashboards de motorista (4 variantes), `MyConnex` vs `/gerenciar` coexistindo, rotas PT/EN, notificações (`/notificacoes` vs `/notifications`), roda ativa (`/corrida` vs `/ride/active`), matching (`/matching` vs `/ride/matching`), `engine` (usuário) vs admin (inexistente).
- **Stores singleton** carregados por código dividido (chunks) com risco já mitigado para driver (`driver-store` em admissions); risco similar ainda presente em `trip-store`/`conversations-store` para **code-splitting** — mitigação: importar stores dede o módulo raiz que precisa, evitar import induzido via algum sub-chunk. (Nota: os atuais usos estão OK em teste; registrar como padrão de engenharia, não defeito ativo.)
- **Sem dependências** de IA/LLM, WebRTC, push, contatos no `package.json` (confirmado — tudo mock/avanço sem lib).

### 3.9 Infraestrutura transversal (uploads, permissões, chamadas, IA, notificações, marketplace, analytics)

**Uploads** — 🟡 PARCIAL; infraestrutura rica mas **desconectada do backend real**:
- UI completa (`UploadMedia`, `UploadDropzone`, `UploadPreview`, `UploadGrid`, `UploadToolbar`, `UploadProgress`, `UploadSources`) com pré-visualização por `URL.createObjectURL`, compressão (canvas ×1920px JPEG), validação (foto 20MB/vídeo 250MB, grid máx. 9) e estados id/reading/uploading/success/error (`upload-types.ts`, `upload-utils.ts`).
- `upload-storage.ts:3-10` e `upload-engine.ts:62` **lançam erro** `"Storage provider not configured."` (stub); `UploadMedia` usa `simulateUpload()` falso (`UploadMedia.tsx:149-162`) com barra fake (+10%/200ms); **sem cancelamento** (sem AbortController), progresso do hook `use-upload` sempre 0.
- **Upload real só para avatar/bio** via Supabase Storage (`services/upload.service.ts`, buckets `avatars`/`bio-media`; `BioAvatarSection`, `completar-perfil.tsx`). Aplicação do `UploadMedia` em posts/foto/vídeo/reel/momento/oferta/evento/local/negócio e My Connexy **é preview local**.
- Pronto p/ as fases: conectar `UploadService` + progresso real + cancelamento + prévia obrigatória.

**Permissões** — 🟡 PARCIAL; infraestrutura **criada mas não consumida**:
- `lib/system/permission-utils.ts` (`PermissionKind: camera|location|notification|microphone`), `hooks/system/use-permissions.ts`, `PermissionCard`, `PermissionModal` — **nenhum importado** por componente (verificado).
- As permissões que de fato disparam são **ad-hoc** via `getUserMedia` em `UploadSources.tsx:114-127` (câmera/galeria/vídeo; marca `connexy.media.permission.granted`) e em `ConnexyChatScreen.tsx:222-239` (câmera p/ foto no chat). Localização via `useGeolocation`. Sem solicitação de microfone/notificação; sem onboarding contextual.

**Chamadas/áudio/WebRTC** — ❌ NÃO EXISTE:
- Nenhum arquivo/procura por `call|videocall|webrtc|RTCPeerConnection|MediaRecorder` no código; único `MediaRecorder` é comentário em `demo-db.ts:20` (áudio foi deliberadamente excluído do subset local).
- `VoiceRecorder` (chat) e `AudioPlayer` (chat) são **simulações visuais** (timer/waveform fake, sem blob/áudio real); `AudioPlayer` do sistema é real (`<audio>`). Placeholder explícito: `ConnexyChatScreen.tsx:247`.

**IA** — 🧪 MOCK/HARDCODED:
- Único componente `ConnexyAiAssistant` (`connexy-ai-assistant.tsx:40`): `suggestionFor()` retorna **templates de string** (modos: media/invite/conversations), zero LLM. Resultado é editável (revisão implícita) mas via clipboard. **Não cobre anúncios/eventos**. Camadas `ai-marketplace.ts/ai-score/ai-ranking` são **heurísticas de ranking** (não LLM).
- `ai-history` persiste em `connexy:ai:history` (5000 entradas, TTL 90d).

**Notificações** — 🟡 PARCIAL (UI robusta, sem push):
- 14 componentes em `components/notifications/*`, 16 categorias (`notification-types.ts:54`), filtros/grupos/settings; bell na Home com badge de `pendingRequests` (`_app.home.tsx:131-142`).
- **Duas rotas duplicadas**: `/notificacoes` (legada, `_app.notificacoes.tsx`, tabs) e `/notifications` (nova `_app/notifications.tsx` com `NotificationCenter` + `MOCK_NOTIFICATIONS` hardcoded).
- **Sem push** (sem PushManager/service worker/FCM), sem agendamento; `NotificationRepository`/Service/hook Supabase existem mas a rota usa mock. 100% in-app.

**Marketplace** — 🧪 MOCK (sem transação):
- 24+ componentes (grade, card, detalhe, galeria, horários, rating, cupons, ofertas, seguir/favoritar, engajamento local), 3 rotas (`/marketplace`, `/business/$businessId`, `/local/$id`). Fonte: `MOCK_BUSINESSES` (20 empresas) + `MOCK_PROMOTIONS/EVENTS/COUPONS/SPONSORED_ADS` hardcoded.
- **Sem checkout, sem pedido, sem reserva real** — "Reservar" mostra toast "Reserva simulada" (`mock-sponsored-content.ts:114`); cupom gera código local (`CX-...` em localStorage). `MarketplaceRepository/Service` Supabase existem mas a rota usa mock direto.

**Moderação / Analytics / Event Tracking** — ❌ NÃO EXISTE:
- Zero componentes de denúncia/moderação (`presence-analytics.tsx` é métrica de presença em locais, não analytics de uso); `roles-engine.ts:83` lista "Relatórios" apenas como label de UI. Zero SDK de analytics/track; `lovable-error-reporting.ts` é reporte de erros da plataforma Lovable.

### 3.10 Persistência e arquitetura de dados

**Fonte única por domínio (localStorage)** — mapa completo de chaves:
- Auth/identidade/perfil: `connexy:demo:authenticated`, `connexy:demo:signup-pending`, `connexy:demo:identity`, `connexy:demo:own-profile`.
- DB principal (conexões/solicitações/mensagens/grupos): `connexy:demo:db`; posts: `connexy:demo:posts`.
- Mobilidade: `connexy_demo_trip` (trip+history), `connexy_demo_ride_blocks`, `connexy_demo_dispatcher`, `connexy_driver_application_v1`.
- Social/contexto: `connexy_roles`, `connexy_context`, `connexy_live_events`, `connexy.presence.*` (visibility, checkins, preference), `connexy:ai:history`, `connexy.mock.*`, `connexy:reels:*`, `connexy.carousel.position.*`.
- **Só em memória**: frota/dispacher (`dispatcher-store.ts:28`, reseta a cada reload), listeners/sets/Timers módulo-level, `sessionStorage` (repost media).

**Duplicações de domínio (conflitos) encontradas (§ descreve o problema do "fonte única")**:
1. **Presença**: `connexy.presence.preference` lida em DOIS caminhos — `hooks/use-user-presence-control.ts:5` e `providers/presence/presence-context.tsx:12`; sem proteção de concorrência (podem sobrescrever).
2. **Visibilidade vs preferência de presença**: `connexy.presence.visibility` (PUBLIC/FRIENDS/ANON) e `connexy.presence.preference` (online/dnd…) são domínios sobrepostos sem sincronia.
3. **Posts**: dois pipelines — demo (`demo-posts.ts` → `connexy:demo:posts`) e Supabase (`FeedRepository/Service` → `bio_posts`); `create-post-form` usa demo, repository usa Supabase: **nunca se encontram**.
4. **Chat**: `demo-db.messages` (localStorage + CustomEvent) vs `ChatRepository/Service` Supabase; `use-chat.ts:135` é **gateway híbrido** (React Query + evento demo).
5. **Conexões**: `demo-db.connections` vs `mock-conversation-invites` (`connexy.mock.conversation-invites`) representam o mesmo conceito.
6. **Tipo `Trip` duplicado**: `ride-types.ts:105` (legado "RotaMais") vs `trip-types.ts:88` (ativo demo); apenas o segundo persiste.
7. **`VehicleInfo` duplicado**: `driver-types.ts:42` vs `ride-types.ts:94` (campos diferentes).
8. **Perfis silos**: `ProfileVariant` ("person|business|event|driver"), `Business` e `Person` são paralelos, sem contrato compartilhado (`ProfileData` aceita qualquer variante mas não herda).

**Camada Supabase** — completa mas **gating em demo**:
- `@supabase/supabase-js 2.111.0` + `@supabase/ssr` instalados; client lazy-proxy (`lib/supabase/client.ts`) só instancia se env vars existirem; em demo `isPublicSupabaseConfigured()`=false (54 gates `isDemoMode()` em produção, demo statically false).
- Repositories prontos (auth, chat, connections, feed, marketplace, notification, presence, profile, ride, user) **importados e referenciados**, mas as chamadas **falham silenciosamente** sem credenciais; UI biforca por gate.
- **Não há zustand**; padrão = store módulo-level + `useSyncExternalStore` ou localStorage + CustomEvent. Store único por módulo TS → risco de duplicação **baixo** p/ trip/dispatcher; **médio** p/ stores não-reativos (`demo-db`, `roles-storage`, `context-storage`, `reel-local-storage`) — reads frescos do mesmo JSON sem notificação. React Query usado só em `use-chat.ts:2`.

**Identidade/demo**: `DEMO_MODE_ENABLED = DEV && VITE_APP_DEMO_MODE==="true"` (`demo-config.ts:20-21`); `route-guard.ts:24-29` é **no-op em DEV sem Supabase** (deixa passar) e erro em prod sem Supabase.

---

## 4. Classificação P0–P3 / FUTURO

### 🔴 P0 — Defeitos visíveis que afetam a demo atual (corrigir já)
1. **Sort lexicográfico de locais/eventos próximos** — `home-premium.ts:339-343` ordena string formatada com `localeCompare` → ordem errada visível no feed.
2. **Botão "Ligar" da conversa inoperante** — `onCall` não é passado → gesto morto (item 24).
3. **Scroll aninhado + padding de BottomNav por tela** — dupla camada de rolagem e fundos cortados (padronizar em uma camada só).
4. **Trip presa em estado não-terminal após reload** bloqueia nova corrida sem limpeza visível (melhorar UX de recuperação de estado na demo).

### 🟠 P1 — Correções e fundações necessárias antes da próxima fase de implementação
1. **BottomNav em TODAS as telas** (item 11) — decisão + implementação (inclui conversa e fluxo de corrida). Conflito com padrão de imersão precisa ser resolvido por produto.
2. **Prévia de publicação para evento/local/oferta/lugár-negócio** (item 3) — obrigar preview antes de publicar em todos os publishers.
3. **Gestão de conteúdos ativos** (item 4): listagem real (publicações/eventos/locais/negócios/ofertas/anúncios) com ver/editar/excluir/pausar/reativar — hoje mock estático.
4. **Contatos do celular** (16–18) — decidir estratégia (grant de contatos + matching por telefone + convite SMS/WhatsApp) e implementar em fases (16 → 17 → 18).
5. **Conversa: adicionar pessoas à conversa existente** (item 7) — `addParticipant`, não só criar grupo novo.
6. **Picar/pin de conversa** (item 20), **ações rápidas reais** (item 22), **⋮ com finalidade consolidada** (item 21, remover 3 opções mortas), **ligar de verdade** (item 24).
7. **Reset de scroll dos containers internos** (item 25).
8. **Uploads reais conectados** (`UploadMedia` sem `simulateUpload`) — pré-requisito de conteúdo/mídia real. Serviços/repos prontos existem, mas em demo seguem simulados.
9. **Fix aninhado de scroll** se não resolvido na P0 (agrupar na mesma correção).

### 🟡 P2 — Funcionalidades de produto (próximas fases, dependem das P0/P1)
1. **Check-in com convite de amigos** (item 12) — fundir "Ir juntos" ao fluxo de check-in.
2. **"Acontecendo Agora" expandido** (item 13) — mais cards, rotação real, abre a publicação.
3. **Fotografar o local + associar + publicar** (item 15) — picker real de local, câmera, direitos de uso.
4. **Locais completos** (item 14) — cardápio/produtos/serviços/fotos de acontecimentos (expandir modelo `Business`).
5. **Perto de Você 5+5 e "Ver todos"** (itens 36–37) — paginação/lazy-load, carrossel com "Ver todos".
6. **Expandir raio progressivo** (item 38, parte 2) — remover fallback fixo e usar raio ascendente por busca vazia.
7. **Connect Pulse curado sem links ou com CTA único** (item 35) — alinhar com a intenção do requisito.
8. **IA para anúncios/eventos com revisão humana** (item 19) — estender assistente + confirmar fluxo de revisão.
9. **Alinhamento dos cards de Configurações** (item 23) — polimento de UI.
10. **Matching premium do motorista** (item 26) — apresentação inovadora do perfil/motorista.
11. **Auditar/limpar módulos duplicados** (dashboards motorista, `MyConnex` vs `gerenciar`, rotas PT/EN) antes das fases que os tocam.

### 🟢 P3 — Polimento e pré-requisitos de menor prioridade
1. **Redirecionar/centralizar deep-links PT/EN** (rotas misturadas).
2. **Lazy-load / code-splitting** com padrão de import de stores (evitar réplica de singleton).
3. **Padronizar estados vazios/erro** em feeds e listas.
4. **Métricas de engajamento por seção** (instrumentação leve) para validar mudanças de Home.

### 🔮 FUTURO — decisões já tomadas (não alterar sem nova autorização)
- **Mobilidade**: chave PIX do motorista (27), exibição da chave ao passageiro (28) — fases futuras de mobilidade.
- **Logística**: entrega de comida/comércio (33), retirada no estabelecimento (34).
- **Comércio**: reservas em restaurantes/bares/serviços (41), checkout real de marketplace/my-connex (não pedidos ainda; base mock pronta).
- **Plataforma**: admin dashboard (29), validação de docs com tela admin (30), moderação (31), métricas dinâmicas (32) — dependem de dados reais/backend.

> Itens 39–40 ("Menu Mais") não se aplicam — não existe menu "Mais"; corrigir só se "Menu Mais" voltar a existir no roadmap.

---

## 5. Roadmap por dependência

Ordem de fases em função de dependências reais (uploads → conteúdo; conteúdo → locais; identidade/auth → contatos; dados reais → plataforma):

```
FASE 1 — FUNDAÇÃO/NAVEGAÇÃO (P0+P1)
  P0-1 sort · P0-2 ligar · P0-3 scroll+padding · P0-4 trip recovery
  BottomNav on-demand (11) · reset scroll interno (25) · uploads reais (P1-8)
  ⇒ destrava: todas as telas consistentes p/ as demais fases

FASE 2 — CONTEÚDO EDITORIAL (itens 3, 4)   [depende: uploads]
  Prévia obrigatória em todos os publishers (3)
  Gestão CRUD real: publicações/eventos/locais/ofertas/anúncios (4)
  Limpeza de módulos duplicados do domínio (2a)
  ⇒ destrava: publicação "presentável" e IA (19)

FASE 3 — CONVERSAS (itens 7, 20, 21, 22, 24)   [independe de 1–2]
  addParticipant em conversa existente (7) · pin/unpin (20)
  ⋮ consolidado (21) · ações rápidas reais (22) · ligar (24)
  Gravação de áudio + chamadas (depende de permissões, item 6)
  ⇒ destrava: item 6 (chamada) e futura integração de contatos

FASE 4 — HOME/DESCOBRIR (itens 13, 35, 36, 37, 38)
  Acontecendo Agora expandido (13) · Pulso curado ou CTA único (35)
  Perto de Você 5+5 + Ver todos (36–37) · raio progressivo (38)
  ⇒ destrava: métricas de seções p/ validar (P3)

FASE 5 — LOCAIS E PUBLICAÇÃO GEOLOCAL (itens 14, 15)   [depende: Fase 1 (scroll/nav) + uploads]
  Modelo Business com cardápio/produtos/serviços/fotos (14)
  Fotografar + assoc. a local + direitos (15)
  Check-in com convite (12) reutiliza "Ir juntos"
  ⇒ destrava: comércio de locais e anúncios locais (19)

FASE 6 — SOCIAL/CONTATOS (itens 16, 17, 18, 23)   [depende: identificação/identidade + permissões]
  Contatos do celular + matching (16) → separação (17) → convite SMS/WA (18)
  Alinhamento de cards de Configurações (23)
  ⇒ destrava: scheduling social, presença, convite de app (5)

FASE 7 — MOBILIDADE EVOLUÍDA (itens 26, 27, 28)   [depende: fases 6.4 conservadas]
  Matching premium (26) primeiro; PIX cadastro (27) e exibição (28) nas próximas
  Consolidar /corrida vs /ride/active + limpeza de dashboards duplicados
  ⇒ destrava: logística (33–34), agenda (2), lembretes (1)

FASE 8 — COMÉRCIO (itens 41 + my-connex/marketplace real)   [depende: Fase 5 + conteúdo]
  Checkout real, reservas (41), ofertas/ads reais
  Compartilhar app (5) entra aqui (campanha de crescimento)

FASE 9 — PLATAFORMA ADMIN (itens 29, 30, 31, 32)   [depende: dados reais do backend]
  Admin dashboard (29) → validação de docs (30) → moderação (31) → métricas (32)
```

### Direção recomendada da próxima sessão
Começar pela **Fase 1 (P0s + BottomNav + uploads reais + fix de scroll)**, que destrava as demais e elimina os quatro defeitos visíveis da demo. Itens 39–40 e FUTURO (27/28/33/34/41) **não** devem ser tocados.

---

## 6. Funcionalidades que JÁ existem de forma madura (não reimplementar)

| Área | O que existe de sólido |
|---|---|
| Conversas | Header fixo, composer fixo, scroll isolado (itens 8–10); mídia img/vídeo via dataURL; read/unread funcionais; presença mock |
| Publicação | Prévia em post/texto/foto/momento e wizard de reel; bio CRUD real |
| Check-in | Fluxo completo com visibilidade pública/amigos/anônimo + lista de presentes + raio geográfico |
| Mobilidade | Pagamento confirmado pelo motorista fica registrado; corrida não paga bloqueia nova solicitação; histórico persistido; `driver/index` derive `active` da Trip |
| Home | 6 seções de feed com cards ricos (pulse, action hub, locais/eventos, patrocinados) |
| Identidade/demo | Login docker com identidades; `requireAuth` env-gated; demo mode integrado |

---

## 7. Notas do estado real do repositório

### 7.1 Commits e branch
- Branch `fix/chat-publicacao`; últimos commits: `3674f81` (`feat(mobility)`) e `0df4dcf` (`docs(mobility)`) — árvore **limpa** no momento da auditoria.

### 7.2 Modo de execução
- Dev server demo em `127.0.0.1:8090` (`VITE_APP_DEMO_MODE=true`); sem Supabase remoto; tudo em localStorage (`connexy_demo_*`).

### 7.3 Riscos operacionais conhecidos
1. **Trip presa** — reload durante status intermediário pode bloquear nova `createTrip` (sem limpeza automática). (P0-4)
2. **Dispatcher em memória** — frota de 3 motoristas não persiste; simulações por timer.
3. **`/corrida` vs `/ride/active`** — par de rotas desacopladas historicamente (resolver conscientemente em Fase 7).
4. **Mock que "parece funcional"** — MyConnex, dashboards de motorista, marketplace/ads, configurações de IA exibem dados fictícios com aparência real (risco de confundir stakeholders; mitigar com selo "demo" ou convergir para estados vazios honestos).
5. **`simulateUpload`** — todo upload de conteúdo é simulado; apenas avatar de onboarding é real.

### 7.4 Arquivos-chave citados
- Shell/nav: `src/routes/_app.tsx`, `src/router.tsx:11`, `src/components/bottom-nav.tsx`.
- Conversas: `src/components/chat/{conversations-screen,chat-header,ConnexyChatScreen,group-invite-sheet}.tsx`.
- Conteúdo: `src/routes/_app/gerenciar/*`, `src/components/post/*`, `src/components/ai/*`, `src/components/upload/*`, `src/lib/share/share-connexy.ts`.
- Home: `src/routes/_app.home.tsx`, `src/components/home/{HomeActionHub,ConnexyPulse}.tsx`, `src/lib/feed/home-premium.ts`, `src/components/feed/HomePremiumFeed.tsx`, `src/components/ads/LocalSponsoredFeed.tsx`.
- Locais/eventos/check-in: `src/routes/_app.{locais,local.$id,events,event.$eventId,business.$businessId}.tsx`, `src/components/event-checkin/*`, `src/components/marketplace/local-engagement.tsx`, `src/lib/marketplace/business-types.ts`.
- Mobilidade: `src/lib/mobility/trip/{trip-store,ride-blocks}.ts`, `src/lib/mobility/dispatch/{dispatcher-store,demo-fleet}.ts`, `src/routes/_app/ride/*`, `src/routes/_app/driver/index.tsx`, `src/components/driver/*`.
- Admin/arq: `src/routes/_app/engine.tsx`, `src/routes/_app/my-connexy.tsx`, `src/lib/driver/driver-application-storage.ts`, `src/lib/auth/route-guard.ts`.

## 8. Inventário de rotas (apêndice)

88 arquivos / ~85 caminhos em `src/routes/`.

### 8.1 Fora do `_app` (sem BottomNav, sem guard)
| Rota | Finalidade |
|---|---|
| `/` (`index.tsx`) | Splash → redirect `/auth` ou `/home` |
| `/auth`, `/auth/callback` | Login/registro + OAuth callback |
| `/cadastro`, `/completar-perfil`, `/finalizar-perfil`, `/interesses`, `/localizacao`, `/welcome` | Fluxo de onboarding |
| `/.lovable.oauth.consent` | Consentimento OAuth Lovable |
| `/qa-chat-media`, `/qa-sheet-bottom`, `/qa-sheet-create`, `/qa-sheet-modal` | Telas de QA (dev) |
| `/__dev/demo` | Demo panel (gated `isDemoMode()`; redirect `/home` fora de demo) |
| `/.mcp/*`, `/.well-known/oauth-protected-resource` | Handlers de protocolo (server) |

### 8.2 Sob `_app` (layout global com BottomNav; guard)
| Grupo | Rotas | BottomNav |
|---|---|---|
| Abas | `/home`, `/discover` (Mapa), `/chat`, `/profile` (Configurações) + botão central `/create` | visível |
| Content/feed | `/feed`, `/trending`, `/recommendations`, `/reels`, `/reels/$reelId`, `/create-post` | visível |
| Create hub | `/create` (layout) + `/create/{photo,video,text,reel,event,offer,place,place-business,moment,ride}` | visível |
| Social | `/pessoas`, `/connecta`, `/people`, `/notificacoes`, `/notifications`; `solicitacao/$id` | visível (hide em `/people`=redirect e solicitacao é imersiva — **oculta**) |
| Chat | `/chat/$conversationId` | **OCULTA** |
| Perfil | `/perfil`, `/perfil/$id`, `/perfil?edit=true`, `/profile/roles`, `/privacidade`, `/my-connexy`, `/engine`, `/gerenciar/*` | visível (perfil?edit=true **oculta**) |
| Ride | `/ride` (layout), `/ride/`, `/ride/request`, `/ride/matching`, `/ride/active`, `/ride/history`, `/ride/history/$tripId` | **oculta** nas imersivas ride, visível em history |
| RotaMais (legado) | `/corrida`, `/destino`, `/matching`, `/rota`, `/avaliar` | visível |
| Marketplace/locais | `/marketplace`, `/business/$businessId`, `/locais`, `/local/$id`, `/events`, `/event/$eventId` | visível |
| Driver | `/driver`, `/driver/cadastro`, `/driver/profile`, `/driver/finance`, `/driver/performance`, `/driver/history`, `/driver/trip/$tripId` | visível |
| Design | `/design-system` | visível (referência) |
| Gerenciar (layout) | `/gerenciar` (layout conjunto + `/gerenciar/{bio,novo-reel}`) | visível |

### 8.3 Rotas mortas / redirects unidirecionais
- `_app/people.tsx` → redirect `/pessoas` (legado EN).
- `_app.gerenciar.nova-{foto,evento,oferta,local,texto,video}.tsx` → redirect `/create/*` (6 rotas mortas).
- `/index` splash redirect intencional (auth-dependent). Sem loops.

### 8.4 Rotas duplicadas relevantes
- Notificações PT/EN: `/notificacoes` (legada) e `/notifications` (nova) — alta duplicação de UI.
- Ativa do ride: `/corrida` (RotaMais) vs `/ride/active` (Connexy) — alto overlap.
- Matching: `/matching` (RotaMais) vs `/ride/matching` (Connexy) — alto overlap.
- `create/reel` (wizard) vs `gerenciar/novo-reel` (form completo).
- Pessoas/discovery: `/pessoas`, `/connecta`, `/discover` — overlap médio (lista vs tempo-real vs mapa).

### 8.5 Notas de navegação
- `_app.tsx:78-80` reset de scroll só do container externo; containers internos não resetam.
- Mode driver: aba "Conversas" é filtrada (`bottom-nav.tsx:32-34`); `/pessoas`, `/matching`, `/connecta`, `/chat*`, `/solicitacao*` trocam `<Outlet />` por `DriverModeSocialBlock` (`_app.tsx:63-68`).
- Componente premium `components/navigation/bottom-nav.tsx` existe mas não é usado — o layout usa `components/bottom-nav.tsx`.