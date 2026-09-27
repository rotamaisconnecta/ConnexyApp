# 1H-7B — Business + Customer Experience Architecture

- **Data:** 2026-09-24
- **Tipo:** auditoria de experiência e arquitetura. Sem implementação.
- **Herdado:** 1H-5, 1H-6, 1H-7, **1H-7A** (`business-commerce-contract-1h-7a.md`). Relatórios anteriores **não** foram alterados.
- **Arquivo criado:** este relatório.
- **Arquivos de produto alterados:** 0
- **STATUS:** **PASS PARTIAL**

Nenhuma tela, dashboard, store, repository, tabela, migration, RLS, Storage, Realtime ou chamada de rede foi criada. O MVP local permanece intacto.

---

## 1. Objetivo

Definir onde vive cada responsabilidade:

1. **Cliente** no app Connexy (quem está na cidade).
2. **Negócio** (quem oferece algo) — hoje no app; amanhã em dashboard.
3. **Admin da plataforma** — futuro.

Perguntas:

- O que permanece no aplicativo?
- O que vai para uma **Business Dashboard** web?
- Quais telas existem / são parciais / não existem?
- O que é MVP vs adiado?

A hipótese de três superfícies (App / Business / Admin) foi **auditada**, não assumida.

---

## 2. Metodologia

AUDIT → MAP INFRA → SOURCE OF TRUTH → classificar App vs Dashboard → documentar. **Sem implementar.**

Contratos 1H-7 e 1H-7A são a base de domínio. Esta fase fecha **experiência e superfície**, não SQL.

---

## 3. Auditoria atual

### App shell

Bottom nav: Home `/home`, Mapa `/discover`, Criar (sheet → `/create`), Chat `/chat`, Perfil `/profile`.

Menu Mais: Locais, Eventos, Negócios (`/marketplace`), Agora, Ofertas (`/marketplace`), **Gerenciar** (`/gerenciar`).

### Criar vs Gerenciar

| Superfície | Papel real |
| --- | --- |
| `/create` | Publicação: Momento, Agora, Evento, Negócio, Local, Oferta, Carona |
| `/gerenciar` | Hub do **criador** (“Meu Connexy”): atalhos de create + lista **owned** do overlay. Clique abre **detalhe público**. Sem edição, fila, pedidos. |
| `/my-connexy` | Atalhos de create (duplicata leve do gerenciar). |
| `/profile/roles` | Ativar papéis USER/BUSINESS/DRIVER/… |
| `/gerenciar/nova-*` | Redirects para `/create/*` |

`canAccessBusinessDashboard` e `canManageEmployees` existem em `roles-guards.ts` e **não são usados em nenhuma rota**. Não há dashboard.

### Detalhes públicos (consumo)

| Rota | O que faz | Pedir / Reservar |
| --- | --- | --- |
| `/marketplace` | Grid de businesses (mock + overlay) | — |
| `/business/$businessId` | Vitrine: fotos, hours (mock), promoções, cupom, follow (memória), save, check-in, review | **Reservar** se categoria reservável; **Pedir corrida** (Trip, não Order) |
| `/local/$id` | Place: check-in, review, save | **Reservar** se reservável |
| `/event/$eventId` | Evento: check-in, review | **Sem** reserva/ingresso |
| Oferta | Sem rota própria; abre o Business | Redeem local ≠ Order |

### Reservas

Customer: `/reserva/$resourceId` cria (`confirmed` imediato no demo); `/reservas` lista e cancela. **Owner não recebe** a reserva.

### O que não existe (código)

Product, Service (prestação), Order, Cart, Checkout, Delivery comercial, Pickup comercial, fila, Product/Service detail, Business web, Admin.

“Pedido” na UI = conversa, carona ou **corrida**, nunca pedido de produto.

---

## 4. Telas existentes

Comprovadas no código e usadas no MVP demo:

- Home, Discover/Mapa, Create hub, Chat, Perfil
- Menu Mais → Locais, Eventos, Marketplace, Agora, Gerenciar
- `/create/{event,place,place-business,offer,moment,reel,…}`, `/carona/nova`
- `/business/$businessId`, `/local/$id`, `/event/$eventId`
- `/marketplace`, `/locais`, `/events`, `/reels`
- `/reserva/$resourceId`, `/reservas`
- `/gerenciar` (hub), `/profile/roles`, `/my-connexy`
- Reviews/check-in/save/redeem **no detalhe**
- Mobilidade `/ride/*`, `/driver/*` (fora de comércio)

---

## 5. Telas parciais

| Tela | Por que parcial |
| --- | --- |
| `/gerenciar` | Lista owned, mas **não** opera (sem edit/pausar/pedidos/reservas incoming) |
| Detalhe Business | Vitrine rica (muito mock); follow não persiste; sem catálogo de itens |
| Hours / contato / imagens | Completos no **mock** `Business`; overlay UGC só name/category/address/description/cover |
| Oferta | Create sim; sem detalhe próprio, sem editar/pausar |
| Reserva | Customer sim; confirmação demo; sem lado negócio |
| Roles business | Papel liga create; flags de dashboard **mortas** |
| Avaliações | Lista local no detalhe; negócio **não** responde |

---

## 6. Telas ausentes

- Product list/detail/CRUD
- Service list/detail/CRUD + agenda
- Cart, checkout, Order list/detail (customer e owner)
- Incoming reservations (owner)
- Entrega/retirada comercial
- Editar Business/Place/Event/Offer
- Publicar/pausar/arquivar
- Connexy Business (web)
- Connexy Admin
- Ingresso/ticketing de evento

---

## 7. Experiência do cliente

**Hoje (real):**

```text
Home / Mais / Marketplace / Locais / Eventos
        ↓
Business | Place | Event detail
        ↓
Seguir* / Salvar / Check-in / Cupom / Review
        ↓
[se reservável] Reservar slot → /reservas
[sempre no business] Pedir corrida → Trip
```

\* follow de negócio = React state.

**Jornada alvo (contrato, não implementar):**

```text
Descobrir
  → Business Detail
  → Produtos e/ou Serviços e/ou Ofertas   [faltam produtos/serviços]
  → ação conforme o tipo
  → Order e/ou Reservation
  → confirmação → acompanhamento → histórico / avaliação
```

Por tipo de oferta (nem todo negócio vende produto):

| Tipo | Consumo no app |
| --- | --- |
| Restaurante / loja / café | Produtos → Order → PICKUP ou DELIVERY (ou ON_SITE) |
| Salão / profissional | Serviços → agendar → Reservation |
| Evento | Detalhe → check-in; **ingresso = FUTURO** (não existe) |
| Place sem ficha Business | Reserva de slot / check-in, sem cardápio |

O fluxo único “sempre Comprar” **não** vale. A ação principal deriva do que o Business publica (products, services, ou só ficha+reserva).

---

## 8. Experiência Business

**Hoje:** Identity ativa papel → `/create` ou `/gerenciar` → publica ficha/oferta no overlay → vê o mesmo detalhe **público** que o cliente.

**Alvo conceitual (Connexy Business):**

```text
Dashboard
Meu negócio (ficha, hours, modalidades)
Produtos CRUD
Serviços CRUD
Ofertas CRUD + pausar
Pedidos (fila + detalhe)
Reservas recebidas
Fulfillment (flags; operação de entrega depois)
Avaliações (responder — depois)
Configurações
```

| Módulo | MVP comércio? | Depois? | Depende |
| --- | --- | --- | --- |
| Meu negócio (editar ficha) | Sim | — | Não pagamento |
| Produtos CRUD | Sim **se** o recorte incluir venda | — | Order |
| Serviços CRUD | Sim **se** incluir agenda específica | Reserva já existe genérica | — |
| Ofertas editar/pausar | Sim (já há create) | — | — |
| Pedidos fila | Sim **com** Product+Order | — | Pagamento OPEN; logística OPEN |
| Reservas incoming | Sim (fecha o buraco do owner) | — | Política pending 1H-7 |
| Entrega operação | Não MVP | Sim | Logística OPEN |
| Avaliações responder | Não MVP | Sim | — |
| Métricas | Não MVP | Sim | Dashboard |
| Staff | Não MVP | OPEN | — |

O `/gerenciar` atual **não** é esse produto. É um **publisher hub no app**. Não duplicá-lo com um segundo “dashboard” no mesmo app sem decidir a superfície (Parte 9).

---

## 9. App vs Business Web

**Hipótese auditada e recomendada:**

> O **app** é para quem está na cidade: descobrir, conectar, consumir, publicar conteúdo social, e um **recorte leve** de presença comercial (criar ficha).  
> A **dashboard web** é para administrar catálogo, preços, fila e reservas recebidas.  
> **Admin** é superfície **separada e futura**.

O app **já** cria Business/Place/Event/Offer. Isso não contradiz a dashboard: create inicial no app é válido (onboarding na rua). Operação contínua (estoque, fila, horários) não cabe bem no telefone do dono **como MVP completo**, mas **listas curtas** (novos pedidos, novas reservas) podem ser **ambos**.

| Ação | App | Business Web | Ambos | Futuro |
| --- | --- | --- | --- | --- |
| Criar negócio (ficha) | Sim (já existe) | Sim (depois) | Onboarding | — |
| Editar negócio | Recorte mínimo depois | **Primário** | — | — |
| Criar/editar produto | Não no 1º corte app | **Primário** | — | — |
| Criar/editar serviço | Não no 1º corte app | **Primário** | — | — |
| Criar oferta | Sim (já existe) | Primário para gestão | Create no app ok | — |
| Acompanhar pedido (customer) | **Sim** | — | — | — |
| Fila de pedidos (owner) | Badge/lista curta | **Primário** | Sim se notificação no app | — |
| Receber reserva (owner) | Lista curta | **Primário** | Sim | — |
| Responder avaliação | — | Depois | — | Sim |
| Momento / Agora / social | **App** | Não | — | — |
| Conversas pessoa–pessoa | **App** | Não (salvo inbox negócio depois) | — | Inbox comercial FUTURO |
| Métricas | Não | Depois | — | Sim |
| Moderação plataforma | Não | Não | — | **Admin** |

**Não** copiar o gerenciar atual para a web e apagar o app: o create de ficha no app permanece. A dashboard **nasce** quando Product/Order existirem; até lá `/gerenciar` continua o único “lado negócio”, incompleto.

---

## 10. Papéis

| Papel | No código | Contrato de experiência |
| --- | --- | --- |
| **CUSTOMER** | Identity padrão (`USER`) | Consome app |
| **OWNER** | `UserRole.BUSINESS` / PLACE_OWNER / EVENT_CREATOR + `ownerId` no catálogo | Administra o que criou. No v1, owner faz **tudo** do próprio Business |
| **STAFF** | Flag `canManageEmployees` **sem UI** | **Não no MVP.** OPEN se existir depois |
| **ADMIN** | `canModerateCommunity: false` | Experiência **futura separada** (Connexy Admin). Não misturar com Business Dashboard |

Staff: não edita produtos no MVP (não existe staff).  
Admin ≠ owner do restaurante.

```text
DECISION: CLOSED — Customer / Owner no MVP; Staff e Admin fora
```

---

## 11. Lifecycle (conceitual)

Alinhado a 1H-7 e 1H-7A. Publication ≠ availability (1H-7A).

**Product / Service**

```text
publication: DRAFT | PUBLISHED | PAUSED | ARCHIVED
availability: AVAILABLE | UNAVAILABLE
```

(O prompt misturava PAUSED com UNAVAILABLE; o contrato 1H-7A **separa** os dois.)

**Offer**

```text
DRAFT | ACTIVE | PAUSED | EXPIRED (validUntil)
```

Hoje: só “created visível”.

**Order** (quando existir)

```text
created → confirmed → preparing → ready → completed
                                       → cancelled
ready → out_for_delivery → completed   [só DELIVERY]
```

**Reservation** (já auditado, 1H-7)

```text
pending → confirmed → cancelled
```

`completed` está no enum/UI e **não** é escrito. **Não** reintroduzir no contrato desta fase.

---

## 12–16. Entidades (não misturar)

Herdado 1H-7A; reforço de experiência:

| Entidade | O que é | Onde o cliente age | Onde o negócio age |
| --- | --- | --- | --- |
| **Product** | Bem vendido | App: ver / pedir | Dashboard: CRUD |
| **Service** | Prestação | App: ver / agendar | Dashboard: CRUD |
| **Offer** | Condição comercial | App: ver / (cupom demo) | App create hoje; dashboard gestão |
| **Order** | Transação de compra | App: criar / acompanhar | Dashboard: fila |
| **Reservation** | Tempo/recurso | App: criar / cancelar / histórico | Dashboard: incoming |

---

## 17. Delivery / 18. Pickup

```text
Order
 ├── PICKUP     → ready = retire no local
 └── DELIVERY   → out_for_delivery
 └── ON_SITE    → consumo no estabelecimento
```

**Não** usar Trip, LocalDispatcher, Carona.

OPEN (produto, não desta UX): quem entrega, taxa, rastreio, pagamento da entrega.

Pickup **não** é entidade extra no mínimo (1H-7A).

---

## 19. Cart

**Recomendação:** primeiro recorte de venda **sem carrinho multi-item**:

```text
Product → Pedir este item → Order (1..n quantity do mesmo item)
```

Carrinho (`Business → vários products → Cart → Order`) entra quando houver cardápio real com vários SKUs. Motivo: não há Product hoje; um Cart vazio seria tela órfã; menor complexidade até existir catálogo.

```text
DECISION: CLOSED for first commerce slice (no cart)
OPEN: quando o cardápio tiver N itens distintos
```

---

## 20. Payment boundary

```text
Customer → confirma Order/Reservation → [Payment] → status avança
```

Order **pode** existir antes do pagamento (1H-7A). Meios e momento = **OPEN DECISION**. Sem gateway.

---

## 21. Order + Reservation

Continuam **separadas**. Relacionar (`order.reservationId`) = **futuro** (mesa + consumo; serviço + pagamento). Fora do MVP.

Evento + ingresso = **futuro**, não ticketing agora.

---

## 22. Mapa de telas

### App (hoje + alvo)

```text
Home | Mapa | Criar | Conversas | Perfil
Mais → Locais | Eventos | Marketplace | Agora | Gerenciar

Business Detail     [existe — vitrine]
  ├── Reservar      [existe]
  ├── Pedir corrida [existe — Trip]
  ├── Produtos      [FUTURO]
  ├── Serviços      [FUTURO]
  └── Ofertas       [parcial — embed]
Product Detail      [FUTURO]
Service Detail      [FUTURO]
Order confirm/track [FUTURO]
Reservation         [existe customer]
Gerenciar           [existe — publisher, não ops]
```

### Business Web (futuro — não existe)

```text
Dashboard
Meu negócio
Produtos / Produto
Serviços / Serviço
Ofertas
Pedidos / Pedido
Reservas / Reserva
Configurações
```

Entrega/Retirada operacional e Avaliações-resposta: **depois** do MVP comércio.

### Admin (futuro)

Moderação, users, negócios, denúncias. **Não** no app nem na dashboard do restaurante.

---

## 23. Entry points (rotas reais)

```text
Mais → Gerenciar → /create/* | detalhe público owned
Mais → Negócios/Ofertas → /marketplace → /business/$id
Home → Perto de você → /locais | detalhe
Home → Pulse (vitrine, sem nav 1H-2)
Business Detail → /reserva/$id | /ride/request
Perfil → /profile/roles → ativar BUSINESS
FAB Criar → /create → ficha/oferta (social + comercial leve)
/reservas ← histórico customer
```

**Não existe:** Gerenciar → Business Dashboard (flag morta).  
**Não existe:** Business Detail → Produto → Comprar.

---

## 24. Source of truth

| Domínio | Existe? | Persistência | SoT? | Mock? | Backend? | Separado? |
| --- | --- | --- | --- | --- | --- | --- |
| Identity | Sim | `connexy:demo:identity` | Sim (demo) | fixtures people | Auth futuro | Sim |
| Profile | Sim | `own-profile` | Sim (blob fraco) | defaults | Remote | Sim |
| Business | Sim | overlay + mocks | overlay UGC; mocks seed | Sim mocks | Remote UGC | Sim; ≠ Place |
| Place | Sim | overlay + `places` | overlay UGC | Sim | Remote UGC | Sim |
| Event | Sim | overlay + MOCK_EVENTS | overlay UGC | Sim | Remote UGC | Sim |
| Offer | Sim | overlay | Sim UGC | promoções mock extra | Remote | ≠ Product |
| Product | Não | — | — | — | Futuro remote | Nova |
| Service | Não | — | — | categoria SERVICE ≠ entidade | Futuro | Nova |
| Order | Não | — | — | — | Futuro | Nova; ≠ Trip |
| Reservation | Sim | `connexy:demo:reservations` | Sim | — | Remote | ≠ Order |
| Carona | Sim | `connexy:demo:carona` | Sim | — | Remote | ≠ Delivery |
| Trip | Sim | `connexy_demo_trip` | Demo | driver mock | Fora comércio | ≠ Order |
| Conversation | Sim | IDB chat | Sim | MOCK_CONVERSATIONS | Remote | Sim |
| Agora | Sim | IDB reels + MOCK_REELS | UGC sim | mocks seed | Remote UGC | Sim |

Nunca segunda SoT: dashboard futura **lê/escreve as mesmas entidades**, não um “business-db” paralelo.

---

## 25. MVP (proposta de escopo de experiência)

Baseado no estado real: vitrine + reserva customer **já existem**; comércio de itens **não**.

### Customer MVP (quando comércio for construído)

1. Continuar descobrir + detalhe + reservar slot (já há).
2. Ver **pelo menos um** tipo de oferta real no detalhe: produtos **ou** serviços (não exige os dois no primeiro negócio).
3. Uma ação: **Pedir** (Order simples, sem cartinho) **ou** **Agendar serviço** (Reservation ligada a Service).
4. Ver status / histórico no app.
5. Sem tracking de entregador, sem pagamento real, sem ingresso.

### Business MVP

1. Editar ficha (hoje só create).
2. CRUD do tipo que o recorte escolheu (Product **ou** Service) + Offer pausar.
3. Ver **incoming** reservations e/ou orders (lista).
4. Superfície: **começar no app como lista**, **dashboard web** quando a fila/catálogo crescer — não bloquear o primeiro corte à espera da web.

### Fora do MVP

Cart multi-item, delivery operator, staff, variações, métricas, admin, ticketing, Order+Reservation, responder reviews, comissão, estoque.

---

## 26. Futuro

Connexy Business web completa; Admin; logística; pagamento; inbox comercial; ingresso; staff; variações; serviço ONLINE.

---

## 27. Decisões fechadas

1. Três superfícies: **App (cidade)** / **Business Dashboard (operação)** / **Admin (plataforma, depois)**.
2. App = descoberta, social, consumo, create leve de ficha/oferta/conteúdo.
3. Dashboard = catálogo comercial, fila, reservas recebidas, hours, fulfillment.
4. `/gerenciar` hoje ≠ dashboard; não fingir que é.
5. Product ≠ Service ≠ Offer ≠ Order ≠ Reservation.
6. Professional ⊂ Business + Profile (1H-7A).
7. Delivery ≠ Trip/Carona/Dispatcher.
8. Owner administra o próprio Business no MVP; Staff não.
9. Primeiro corte de venda **sem** carrinho.
10. Order e Reservation separados; link = futuro.
11. Sem ticketing nesta geração.
12. Reservation lifecycle permanece 1H-7 (`pending/confirmed/cancelled`).
13. Follow negócio ≠ Connection social.

---

## 28. Decisões abertas

- Pagamento (meios e momento).
- Quem entrega / taxa / rastreio.
- Quando introduzir **carrinho** (após N produtos).
- Quando construir a **web dashboard** vs listas no app.
- Staff.
- Variações; serviço ONLINE; estoque; comissão.
- Order + Reservation.
- Unificar cupom mock com Offer.
- Ingresso de evento.

Não são falha desta fase; são produto.

---

## 29. Impacto futuro no backend

Mesmas entidades 1H-7 + camada 1H-7A. Dashboard e app **compartilham** o remoto. RLS: customer lê publicado; owner escreve o seu Business. Admin = policies à parte, depois.

1H-8: schema social+catálogo+reservation+carona primeiro. Product/Order = schema B. **Não** tabelas de dashboard distintas.

---

## 30. Recomendação da próxima fase

Não implementar dashboard nem cardápio agora.

Próxima fase alinhada à trilha:

> **1H-8 — Remote Schema Design / Supabase Contract** (documento)

Com anexo: superfícies App vs Business vs Admin (este relatório) e entidades commerce diferidas (1H-7A).

Não iniciar 1H-8 aqui. Não alterar Menu Mais, Agora, Carona, Trip, Conversas, Perfil.

---

## Apêndice — Classificação da hipótese inicial

A árvore App / Business / Admin **é adotada** como arquitetura de experiência, com correções:

- App **já** inclui criar ficha comercial — manter.
- “Comprar / Pedir / Agendar” no app é **alvo**, hoje só Agendar (reserva) + corrida.
- Business Dashboard **não existe**; Gerenciar não a substitui.
- Admin **não** começa junto do comércio.

---

## Validação

| Check | Resultado |
| --- | --- |
| Produto alterado nesta fase | 0 |
| Testes unitários (não-browser) | **326 pass / 0 fail / 1509 expect()** |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| Backend / network | 0 |
