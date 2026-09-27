# 1H-7A — Business, Products, Services, Orders & Delivery Contract

- **Data:** 2026-09-24
- **Tipo:** auditoria e contrato de domínio comercial. Sem implementação.
- **Herdado:** 1H-5, 1H-6, 1H-7 (`docs/audits/domain-decisions-1h-7.md`). Documentos anteriores **não** foram alterados.
- **Arquivo criado:** este relatório.
- **Arquivos de produto alterados:** 0
- **STATUS:** **PASS PARTIAL**
- **BUSINESS COMMERCE CONTRACT:** **PARTIAL**

Nenhuma tela, rota, tabela, SQL, migration, RLS, Storage, Realtime, API, checkout, pagamento, GPS de entrega ou WebRTC foi criada. O MVP permanece intacto.

---

## 1. Objetivo

Responder:

> Como um negócio ou profissional entra no Connexy, cria presença, cadastra produtos e serviços, define disponibilidade e administra pedidos, reservas, retirada e entrega?

E:

> O Connexy será apenas uma vitrine, ou permitirá que negócios configurem o que oferecem e recebam ações dos usuários?

Resposta a partir do **código + visão Connexy**, sem implementar.

---

## 2. Fontes auditadas

| Área | Fontes |
| --- | --- |
| Relatórios | `backend-readiness-1h-5.md`, `domain-contract-1h-6.md`, `domain-decisions-1h-7.md`, `product-gap-final-1h-3.md` (GAP 13 delivery/retirada), `connexy-master-product-audit.md` |
| Gerenciar | `_app.gerenciar.tsx` |
| Criar | `_app/create.tsx`, `catalog-create-form.tsx`, `/create/{event,place,place-business,offer}` |
| Marketplace | `_app/marketplace.tsx`, `business.$businessId.tsx`, `business-types.ts`, `mock-businesses.ts`, `local-engagement.tsx` |
| Catálogo | `local-catalog.ts` |
| Reserva | `reservation-store.ts`, `reservable.ts`, `reserva.$resourceId.tsx`, `reservas.tsx` |
| Roles | `roles-types.ts`, `roles-utils.ts` (`canAccessBusinessDashboard`, `canManageEmployees` — **sem UI**) |
| Mobilidade | Trip/Dispatcher — só para **separar** de delivery comercial |
| 1H-3 | delivery/retirada = NÃO IMPLEMENTADO |

Não há rotas, stores nem tipos `Product`, `Service` (prestação), `Order` (pedido comercial), `Delivery` (entrega de pedido) ou `Pickup` (retirada de pedido).

---

## 3. Inventário das telas existentes

| Área | Tela/Rota | Existe? | Funciona? | Persistência | Observação |
| --- | --- | ---: | ---: | --- | --- |
| Gerenciar | `/gerenciar` (“Meu Connexy”) | Sim | Sim (lista + atalhos) | roles `connexy_roles` + overlay catálogo | **Não** é dashboard operacional |
| Meu negócio | seção “Meus Negócios” no gerenciar | Parcial | Create + lista owned | `connexy:demo:catalog` kind business | Link vai ao **detalhe público**, não a edição |
| Criar negócio | `/create/place-business` | Sim | Sim | catalog overlay | Disclaimer local |
| Criar local | `/create/place` | Sim | Sim | overlay | Entidade Place, não filial de Business (1H-7) |
| Criar evento | `/create/event` | Sim | Sim | overlay | |
| Criar oferta | `/create/offer` | Sim | Sim | overlay + `businessId` | Promoção, **não** produto |
| Produtos (lista) | — | Não | — | — | Inexistente |
| Produto (CRUD) | — | Não | — | — | Inexistente |
| Serviços (lista) | — | Não | — | — | `BusinessCategory.SERVICE` é **categoria**, não entidade Service |
| Serviço (CRUD) | — | Não | — | — | Inexistente |
| Ofertas (owner) | gerenciar “Minhas Promoções” | Parcial | Create + lista | overlay offer | Sem editar/pausar/excluir |
| Pedidos | — | Não | — | — | “Pedido” no app = conversa, carona ou corrida |
| Reservas (user) | `/reservas`, `/reserva/$resourceId` | Sim | Sim | `connexy:demo:reservations` | Slot genérico business/place |
| Reservas (owner) | — | Não | — | — | Sem inbox do estabelecimento |
| Entregas | — | Não | — | — | Pickup de **corrida** ≠ retirada comercial |
| Usuário/loja | `/marketplace`, `/business/$businessId` | Sim | Vitrine | mocks + overlay | Promoções, cupons, follow **em memória**, save, check-in, reserva |
| Cupom | detalhe + `PromotionRedeemCard` | Parcial | Redeem local | `connexy:demo:redeemed-promotions` | **Não** é Order |
| Follow negócio | botão no detalhe | Parcial | Toggle React | **não** persiste em `DemoFollow` | ≠ grafo social |
| Carrinho / checkout | — | Não | — | — | 1H-3 GAP 13 |
| Dashboard pedidos | — | Não | — | — | Flag `canAccessBusinessDashboard` sem tela |

Não inventar telas: o que não está na tabela **não existe**.

---

## 4. Estado atual do `Gerenciar`

`/gerenciar` é o **hub do criador**, não o backoffice comercial.

- Seções: Meus Negócios, Meus Eventos, Meus Locais, Minhas Promoções, Mobilidade (motorista).
- Cada seção **aponta para create** (`/create/place-business`, `event`, `place`, `offer`, `/driver`).
- Lista **owned** do overlay; clique abre **página pública** (`/business`, `/local`, `/event`).
- Sem editar, excluir, pausar, preço, estoque, pedidos, reservas recebidas, entrega.
- Roles (`BUSINESS`, `PLACE_OWNER`, `EVENT_CREATOR`) ligam permissões **nominais** (`canManageEmployees`, `canManageCoupons`, `canReceivePayments`) **sem fluxo**.
- Create hub (`/create`) publica Event/Business/Place/Offer no catálogo local — mesmo recorte, lado “publicação”.

### Criar vs Gerenciar

| Capacidade | Existe? |
| --- | --- |
| Criar negócio | Sim |
| Criar produto | **Não** |
| Criar serviço | **Não** |
| Editar produto | **Não** |
| Excluir produto | **Não** |
| Ativar/desativar produto | **Não** |
| Alterar preço | **Não** (Offer tem desconto na criação; Product não existe) |
| Gerenciar disponibilidade | **Não** (`isOpen` só no mock Business) |
| Gerenciar pedidos | **Não** |
| Gerenciar reservas | **Não** (só o customer cancela as suas) |
| Gerenciar entrega | **Não** |

**Criar** = publicar entidade de catálogo / conteúdo.  
**Gerenciar** hoje = atalho para criar + listar owned. **Não** há operação comercial.

---

## 5. Business

### CURRENT

- Overlay `CatalogBusiness`: id, ownerId, name, category, address, description, cover?, lat/lng.
- Marketplace `Business` (mocks): hours, rating, photos, promotions, events, `isOpen`, `isFollowing`, `isFavorite`.
- Quem cria: Identity (`getDemoIdentity().id`).
- Owner = creator. Sem staff, sem multi-admin.
- Vários locais: **não** (1H-7: Business ⟂ Place).
- Ofertas: sim (`Offer.businessId`).
- Eventos: `businessId` opcional no tipo; create de evento **não** coleta.
- Pedidos: não. Reservas: **customer** reserva o business/place, o business **não** opera a fila.

### CANONICAL

Business = **estabelecimento ou marca comercial** com owner Identity.

- Cria: qualquer Identity (hoje) / Identity com papel BUSINESS (roles existem).
- Owner: o criador. **Um** owner no contrato v1.
- Multi-admin / staff: **não** no v1 (`canManageEmployees` é flag morta).
- Vários Places: **não** (1H-7).
- **Pode** oferecer Products e Services (entidades **novas**, ausentes).
- **Pode** criar Offers e (opcionalmente) Events.
- **Pode** receber Orders e Reservations **no domínio futuro**.
- Não é Profile. Não é Place. Não é Offer.

Pergunta central:

> Hoje o Connexy **é vitrine** (descobrir, seguir, salvar, cupom, reservar slot).  
> O contrato futuro: **não fica só vitrine** — o negócio configura o que oferece e recebe ações (pedido/reserva). Isso **ainda não está construído**.

```text
DECISION: CLOSED (conceito Business)
```

---

## 6. Professional

Não existe entidade `Professional`. Existe `BusinessCategory.SERVICE` (e HEALTH, GYM…) e Profile de pessoa.

**Contrato:** profissional (fotógrafo, barbeiro, personal, eletricista) opera como **Business** (categoria de serviço), owner = Identity/Profile da pessoa. **Não** criar entidade Professional no v1.

- Profile = a pessoa social.
- Business = a presença comercial (“Barbearia do João” ou “João — cortes”).
- Agenda/serviço = `Service` ligado a esse Business.

Separar Professional só se no futuro houver marketplace de pessoa física **sem** ficha comercial. O produto atual cadastra “negócio”.

```text
DECISION: CLOSED — Professional ⊂ Business + Profile owner
```

---

## 7. Product

**Não existe** no código. Offer/Promotion/Coupon **não** são produto.

### Contrato mínimo (necessário ao domínio comercial)

```text
Product
  id
  businessId     (owner comercial)
  ownerId        (Identity criadora; = owner do business no v1)
  name
  description
  image?         (arquivo futuro; metadado URL)
  price          (preço-base atual)
  category?      (texto/tag do negócio, não novo grafo)
  publication    (ver §23)
  availability   (AVAILABLE | UNAVAILABLE)
  fulfillment    (flags: delivery, pickup, on_site)
```

Sem estoque SKU, sem SKU interno, sem variações no **mínimo**. Quantidade entra no **OrderItem**, não obrigatoriamente no Product.

```text
DECISION: CLOSED — entidade nova, ausente hoje
```

---

## 8. Product Variation

Zero evidência no produto (sem cardápio, sem tamanho, sem combo).

**Contrato v1:** variações **não** são obrigatórias. Pizza/camiseta/combo são evolução.

Quando existirem: pertencem ao Product; podem alterar preço; disponibilidade pode ser por variação. **Não** são entidades independentes do Product.

```text
DECISION: CLOSED for v1 (out of minimum)
OPEN PRODUCT DECISION for later (tamanho/combo)
```

---

## 9. Service

**Não existe** como entidade. Reserva atual = slot genérico no Business/Place, sem “corte 45 min”.

### Contrato mínimo

```text
Service
  id
  businessId
  ownerId
  name
  description
  price
  durationMinutes?
  publication
  availability
  requiresSchedule     (boolean — se true, passa por Reservation)
  fulfillment          (AT_BUSINESS | AT_CUSTOMER | ONLINE)
```

Product ≠ Service: bem vendido vs prestação com duração/agenda.

Profissional responsável no v1 = owner do Business. Sem staff.

```text
DECISION: CLOSED — entidade nova
```

---

## 10. Availability (três camadas)

Não misturar:

| Camada | Significado | Hoje |
| --- | --- | --- |
| **Business availability** | Aberto agora / horários | `isOpen` + `hours` nos **mocks**; overlay UGC **não** persiste hours |
| **Product availability** | Pode ser pedido | Inexistente |
| **Service availability** | Há horário/capacidade para atender | Inexistente; reserva usa chips fixos `RESERVATION_TIME_SLOTS` |

Serviço com `requiresSchedule`: Availability conceitual = janelas (agenda). **Não** implementar agenda agora. Reserva v1 pode continuar sendo slot no Business; **evolução** = Reservation aponta a um `serviceId`.

Atendimento domiciliar = `Service.fulfillment = AT_CUSTOMER`, não Trip.

```text
DECISION: CLOSED — três conceitos distintos; agenda detalhada = evolução
```

---

## 11. Offer

Já existe (1H-7): condição comercial, `businessId` obrigatório, owner = criador.

**Não** é Product nem Order. Cupom mock (`Coupon`) é irmão promocional; redeem local ≠ compra.

Contrato:

- Offer aplica-se ao **Business**.
- Referência opcional futura a Product e/ou Service (`productId` / `serviceId`) — **não** obrigatória no v1 porque Product/Service ainda não existem no MVP.
- Não substitui o catálogo de itens.

```text
Product: Pizza Calabresa — R$ 50
Offer:   20% até domingo (sobre business ou, depois, sobre o product)
```

```text
DECISION: CLOSED — Offer permanece; não vira Product
```

---

## 12. Fulfillment

Com base na visão Connexy (local + marketplace) e no GAP 13, **não** em código inexistente:

**Produtos**

| Modalidade | No contrato v1? |
| --- | --- |
| `PICKUP` | Sim — retirada no estabelecimento |
| `DELIVERY` | Sim — entrega do **pedido** |
| `ON_SITE` | Sim — consumo no local (pode coexistir com Reservation) |

**Serviços**

| Modalidade | No contrato v1? |
| --- | --- |
| `AT_BUSINESS` | Sim — no estabelecimento |
| `AT_CUSTOMER` | Sim — deslocamento do profissional (≠ corrida) |
| `ONLINE` | Opcional; não há produto online hoje — **OPEN** se entra no v1 |

Business declara quais modalidades oferece; Order escolhe uma.

```text
DECISION: CLOSED for product PICKUP/DELIVERY/ON_SITE and service AT_BUSINESS/AT_CUSTOMER
OPEN: ONLINE as first-class v1
```

---

## 13. Delivery

**Não existe** fluxo comercial (1H-3). Pickup de **corrida** (`pickupLabel`) e Carona **não** são entrega de pedido.

### Contrato

```text
Delivery ≠ Trip ≠ Dispatcher ≠ Carona Amiga
```

Delivery = fulfillment de um **Order** até o endereço do customer.

| Pergunta | Contrato |
| --- | --- |
| Quem entrega? | **OPEN PRODUCT DECISION** (negócio próprio vs Connexy vs terceiro) |
| Motorista de corrida faz delivery? | **Não** por padrão. Domínios separados |
| Área / taxa / ETA / tracking | Infra futura; não no mínimo de domínio além de “Order em OUT_FOR_DELIVERY” |
| Endereço do cliente | Necessário **se** fulfillment = DELIVERY; Profile já tem `privateAddresses` demo |

Não reutilizar `connexy_demo_trip` para pizza.

```text
DECISION: CLOSED (separação). Operator = OPEN PRODUCT
```

---

## 14. Pickup

Inexistente como pedido. Contrato futuro, ligado ao Order:

```text
confirmed → preparing → ready_for_pickup → completed
                                         → cancelled
```

Parte do lifecycle do **Order** quando `fulfillment = PICKUP`. Não precisa de agregado Pickup separado no v1.

```text
DECISION: CLOSED — Pickup = modo + estados do Order, não entidade extra no mínimo
```

---

## 15. Order

Inexistente. **Não** é Offer, Product, Coupon redeem, Reservation, Connection Request nem Carona request.

```text
Order
  customerId
  businessId
  items[]
  fulfillment          (DELIVERY | PICKUP | ON_SITE)
  status
  totals               (snapshot)
  timestamps
  address?             (se DELIVERY)
```

Intent transacional: o usuário pede bens (e, se o produto permitir, serviços sem agenda). Serviços com agenda usam **Reservation**, não Order — salvo combo futuro.

```text
DECISION: CLOSED — entidade nova necessária ao comércio
```

---

## 16. Order Item

Se Order existe, items existem.

```text
OrderItem
  orderId
  productId?           (referência)
  nameSnapshot
  unitPriceSnapshot    — preço no momento do pedido, NÃO lookup live do Product
  quantity
  notes?
```

Variações: só se Product Variation existir depois (snapshot da escolha).

Um pedido pode ter 1..N itens.

```text
DECISION: CLOSED
```

---

## 17. Order lifecycle

Não copiar iFood inteiro. Estados **necessários**:

```text
created → confirmed → preparing → ready → completed
        → cancelled
```

Se `fulfillment = DELIVERY`, entre `ready` e `completed`:

```text
ready → out_for_delivery → completed
```

Se `PICKUP`: `ready` = pronto para retirada.

**Order status ≠** status de motorista de corrida. Sem entidade Delivery no v1: `out_for_delivery` é estado do Order.

Quem confirma: alinhado à Reserva 1H-7 — `created`/`pending` canônico; auto-confirm = política na ausência de operador.

```text
DECISION: CLOSED
```

---

## 18. Reservation vs Order

| | Reservation (existe) | Order (não existe) |
| --- | --- | --- |
| O quê | Horário/recurso no business ou place | Itens de produto (e serviço sem agenda) |
| Exemplo | Mesa 20h; corte 15h (quando houver Service) | 2 pizzas + 1 refri |
| Target hoje | business \| place | business + products |
| Persistência | `connexy:demo:reservations` | — |

**Podem coexistir** (reservar mesa **e** pedir no local). **Não** no MVP atual. Contrato: duas entidades; ligação `reservationId` opcional no Order = evolução, não v1 obrigatório.

Reservation **não** ganha itens de cardápio.

```text
DECISION: CLOSED — conceitos distintos; combo = evolução
```

---

## 19. Payment boundary

Nenhum checkout. Settings demo “Cartão final 4821” não é pagamento. Trip PIX ≠ pedido.

**Conceito:**

- Order **pode** existir antes do pagamento (`created` / `confirmed`).
- Payment é **conceito separado** (não coluna mágica misturada com item).
- Meios (Pix, cartão, dinheiro, no local, na entrega): **OPEN PRODUCT DECISION**.
- Sem gateway nesta geração.

```text
OPEN PRODUCT DECISION — meios e momento do pagamento
CLOSED — Order ≠ Payment; Order pode preceder pagamento
```

---

## 20. User experience

Etapas **reais hoje:**

```text
Descobrir (home / marketplace / locais)
  → Negócio ou Place
  → Ver promoções / cupom / eventos
  → Seguir (memória) / salvar / check-in / convidar rolê
  → Reservar slot (date, time, partySize)
  → Listar minhas reservas / cancelar
```

**Não existem:** catálogo de produtos, selecionar item, modalidade, carrinho, checkout, pedido, acompanhamento, retirada, entrega.

Contrato futuro do usuário (não construir agora):

```text
Descobrir → Negócio → Produtos e/ou Serviços
  → escolher item e modalidade
  → Order e/ou Reservation
  → acompanhar → concluir
```

Carrinho: **necessário** se N>1 itens; um “pedir agora” de item único pode pular carrinho. **OPEN** se o v1 exige carrinho multi-item.

---

## 21. Business experience

Hoje: Criar → ver na lista gerenciar → abrir vitrine pública.

Contrato futuro (não construir agora):

```text
Gerenciar
  → Meu negócio (dados, hours, modalidades)
  → Catálogo: Products / Services / Offers
  → Pedidos (fila)
  → Reservas recebidas
  → (depois) entrega/retirada operacional
```

---

## 22. Business dashboard

**Conceitualmente sim** — o gerenciar atual não cobre operação.

v1 conceitual:

- Visão: contagem de pedidos/reservas, status aberto.
- Gestão: CRUD product/service/offer, hours, fulfillment flags.
- Operação: lista pedidos por status; lista reservas incoming.
- Config: dados do business, modalidades.

Staff, analytics (`canSeeAnalytics`), campanhas: flags mortas — **fora do v1**.

Não implementar a tela nesta fase.

```text
DECISION: CLOSED — dashboard é produto necessário; não existe
```

---

## 23. Permissions

v1:

| Quem | Pode |
| --- | --- |
| Business owner (Identity) | criar/editar/publicar/pausar Business, Product, Service, Offer; ver pedidos/reservas do próprio business; confirmar/cancelar segundo política |
| Staff | **não** no v1 |
| Customer | ver publicado; pedir; reservar; cancelar o próprio pedido/reserva nas regras; follow/save |

Não criar RBAC agora. `canManageEmployees` permanece dívida de roles, não contrato v1.

```text
DECISION: CLOSED for v1 owner + customer
OPEN PRODUCT — staff
```

---

## 24. Publication state

**Publicação** ≠ **disponibilidade**.

```text
publication:  DRAFT | PUBLISHED | PAUSED | ARCHIVED
availability: AVAILABLE | UNAVAILABLE
```

Exemplo: PUBLISHED + UNAVAILABLE = visível “esgotado”. PAUSED = some da vitrine.

Offer hoje não tem esses enums (create = já visível). Contrato futuro aplica-se a Product, Service, Offer, Business.

```text
DECISION: CLOSED — ambos necessários no comércio; hoje só “created”
```

---

## 25. Business → user relation

| Ação hoje | Persistência | Grafo social? |
| --- | --- | --- |
| Seguir negócio | state React | **Não** (`DemoFollow` é pessoa) |
| Salvar | `saved-details` | Não |
| Compartilhar | share nativo | Não |
| Pedido | — | — |
| Reserva | reservations store | Não |
| Avaliar | reviews locais | Não |
| Conversar | não há DM negócio | Não |
| Check-in | presença local | Não |

**Contrato:** interações User↔Business **≠** Connection User↔User. Pedido/reserva **não** criam Connection (diferente de Carona 1H-7). Follow de negócio é relação comercial própria (futuro `business_follows`), não `DemoFollow`.

```text
DECISION: CLOSED
```

---

## 26. Existing × Needed

| Capacidade | Já existe | Parcial | Não existe | Necessária |
| --- | ---: | ---: | ---: | ---: |
| Criar Business | Sim | | | Sim |
| Editar Business | | | Sim | Sim |
| Criar Product | | | Sim | Sim (comércio) |
| Editar Product | | | Sim | Sim |
| Product availability | | | Sim | Sim |
| Product variations | | | Sim | Não no v1 |
| Criar Service | | | Sim | Sim (comércio) |
| Editar Service | | | Sim | Sim |
| Service schedule | | chips genéricos na reserva | Sim (por serviço) | Evolução; slot business existe |
| Criar Offer | Sim | | | Sim |
| Order | | | Sim | Sim (comércio) |
| Order items | | | Sim | Sim |
| Reservation | Sim | auto-confirm; sem owner inbox | | Sim (já 1H-7) |
| Delivery | | | Sim | Sim como fulfillment; operador OPEN |
| Pickup | | | Sim | Sim como modo de Order |
| Business dashboard | | gerenciar = create hub | operacional | Sim |
| User catalog (produtos) | vitrine promoções | | cardápio | Sim |
| Checkout | | | Sim | Sim se Order; pagamento OPEN |

---

## 27. Domain map

```text
USER (Identity + Profile)
 ├── discovers (marketplace, home, locais)
 ├── follows/saves/reviews/check-in     [User↔Business, ≠ Connection]
 ├── reservations                       [existe]
 └── orders                             [não existe]
          │
          ▼
       BUSINESS  (existe; vitrine)
          │
          ├── PRODUCTS                  [NÃO EXISTE — necessário]
          │      └── variations         [não v1]
          │
          ├── SERVICES                  [NÃO EXISTE — necessário]
          │      └── availability/schedule [evolução]
          │
          ├── OFFERS                    [existe]
          │
          ├── PLACE                     [irmão, não filho — 1H-7]
          │
          └── EVENTS                    [existe; businessId opcional]
          │
          └── operations
                 ├── Order + OrderItem + fulfillment
                 │      ├── PICKUP states
                 │      └── DELIVERY state (≠ Trip)
                 └── Reservation (incoming)
```

Professional = o mesmo Business (categoria serviço) + Profile owner.

---

## 28. Local / Remote / Hybrid

| Conceito | Hoje | Futuro |
| --- | --- | --- |
| Business UGC | local overlay | Remote |
| Business mock | bundle | não migrar cego |
| Place / Event / Offer UGC | local | Remote (1H-7) |
| Product / Service | — | Remote |
| Product Variation | — | Remote se produto pedir |
| Service Availability | — | Remote (evolução) |
| Order / OrderItem | — | Remote |
| Reservation | local | Remote (1H-7) |
| Delivery operator | — | Remote + INFRA; ≠ dispatcher |
| Pickup | — | estados no Order remoto |
| Hours / isOpen | mock / local | Hybrid (hours remote; “aberto agora” derivável) |
| Follow negócio | memória | Remote comercial |
| Coupon redeem | local demo | OPEN vs Offer |
| Payment | demo string | INFRA |
| Business settings | — | Hybrid |

---

## 29. Relação com o catálogo 1H-7

1H-7 fechou **quatro** entidades: Event, Place, Business, Offer.

**1H-7A não as apaga.** Acrescenta a camada que o catálogo **não cobre**:

| 1H-7 | 1H-7A |
| --- | --- |
| Business = ficha comercial | continua; ganha Products/Services/Orders |
| Place = local independente | continua; reserva de place permanece |
| Event | continua |
| Offer = promoção com `businessId` | continua; **não** substitui Product |
| Reservation | continua; ≠ Order |

```text
Product, Service, Order, OrderItem
```

são **entidades novas que faltam** ao modelo local. Offer e Reservation **não** as substituem.

**Implicação 1H-8:** o primeiro schema remoto deve representar o que **já é produto estável** (A+B + 4 catálogo + Reservation + Carona). Product/Service/Order entram como **contrato comercial documentado**, não como primeira migration obrigatória — senão o SQL nasceria sem telas nem persistência local.

---

## Backend implications (conceitos, não tabelas)

Provável suporte futuro:

```text
User / Profile
Business
Place
Event
Offer
Product
Service
Order
OrderItem
Reservation
```

Opcional/evolução: ProductVariation, ServiceAvailability/Schedule, BusinessFollow, Payment, DeliveryJob.

**Não** criar agora. **Não** reusar Trip para Delivery.

---

## BUSINESS SCREENS REQUIRED (conceitual — não criar)

Necessárias quando o comércio for implementado:

1. Gerenciar negócio (evolução de `/gerenciar`)
2. Dados do meu negócio (editar ficha, hours, modalidades)
3. Produtos (lista)
4. Criar produto
5. Editar produto (publicação + disponibilidade + preço)
6. Serviços (lista)
7. Criar serviço
8. Editar serviço
9. Ofertas (já há create; falta editar/pausar)
10. Pedidos (fila)
11. Pedido detalhado
12. Reservas recebidas
13. Reserva detalhada (owner)
14. Configurações de fulfillment (delivery/pickup/on-site)

**Não** no primeiro corte: entregas como app de motorista, staff, estoque, variações, analytics.

## USER SCREENS REQUIRED (conceitual — não criar)

1. Página do negócio — **existe** (vitrine)
2. Catálogo de produtos/serviços — **falta**
3. Detalhe de produto
4. Detalhe de serviço + escolher horário se `requiresSchedule`
5. Seleção de modalidade
6. Carrinho — se multi-item (OPEN)
7. Confirmação do pedido
8. Acompanhamento do pedido
9. Reserva — **existe** (genérica)
10. Histórico pedidos + reservas (reservas já)

---

## Open decisions

### OPEN PRODUCT DECISION

- Gateway e momento do pagamento; Pix/cartão/dinheiro/na entrega.
- Quem entrega (negócio / Connexy / terceiro); taxas; cobertura; tracking.
- Carrinho multi-item vs pedido de um item.
- Product Variations (tamanho/combo).
- Service ONLINE no v1.
- Staff / vários administradores.
- Estoque.
- Comissão / marketplace fee / split.
- Order ligado a Reservation (jantar + consumo).
- Coupon vs Offer unificados.
- Agenda por profissional além do owner.

### Não são OPEN de domínio (já fechados)

Vitrine vs comércio futuro; Professional=Business; Product≠Service≠Offer≠Order≠Reservation; Delivery≠Trip; Pickup=modo do Order; publication≠availability; User↔Business ≠ Connection.

---

## Recommendation

Não implementar comércio agora. Não desenhar SQL de Product/Order na mesma leva que Identity/Chat **a menos** que a 1H-8 seccione “schema social+catálogo” vs “schema commerce (depois)”.

Próxima fase alinhada à trilha já recomendada:

> **1H-8 — Remote Schema Design / Supabase Contract** (documento)

Nela: tabelas hipotéticas do núcleo 1H-7. **Anexar** Product/Service/Order como **fase schema B** (comércio), não migration dia 1.

Não iniciar 1H-8 nem telas de cardápio aqui.

---

## Apêndice — Validação

| Check | Resultado |
| --- | --- |
| Produto alterado | 0 |
| Testes unitários existentes (não-browser) | **326 pass / 0 fail / 1509 expect()** em 32 arquivos |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
| Supabase / network novos | 0 |
