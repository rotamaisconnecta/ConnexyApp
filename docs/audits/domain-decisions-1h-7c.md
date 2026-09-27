# 1H-7C — Domain Decisions Closure

- **Data:** 2026-09-24
- **Tipo:** fechamento das decisões ainda abertas após 1H-7B. Sem implementação.
- **Herdado:** 1H-5, 1H-6, 1H-7, 1H-7A, 1H-7B. **Não** modificados.
- **Arquivo criado:** este relatório.
- **Arquivos de produto alterados:** 0
- **STATUS:** **PASS**
- **BACKEND READINESS:** **READY WITH OPEN FUTURE DECISIONS**

Nenhuma tabela, migration, RLS, tela, store, dashboard ou chamada de rede foi criada.

---

## 1. Objetivo

Fechar o que ainda estava aberto (pagamento, logística, carrinho, web, staff, variações, estoque, comissão, Order×Reservation, ingresso) **o bastante** para a **1H-8** desenhar o schema remoto **sem descobrir produto no SQL**.

`DEFERRED` = retirada **deliberada** do Schema A / do primeiro Commerce MVP — **não** desapareceu.

Não é preciso fechar todo o produto futuro para desenhar o Schema A.

---

## 2. Documentos analisados

| Doc | Papel |
| --- | --- |
| `backend-readiness-1h-5.md` | Fontes de verdade locais; mocks ≠ remoto |
| `domain-contract-1h-6.md` | Identity, grafo, chat, pin/read |
| `domain-decisions-1h-7.md` | Catálogo 4 entidades, reserva, group, call, carona, privacy |
| `business-commerce-contract-1h-7a.md` | Product/Service/Order; Delivery ≠ Trip |
| `business-customer-experience-1h-7b.md` | App / Business / Admin; Gerenciar ≠ dashboard |

Código revalidado só onde a decisão depende de existência real: **não há** Payment, Cart, Product, Order, Delivery job, Ticket, Staff, Inventory. Reserva e Offer **existem**. Trip/Dispatcher/Carona **existem** e **não** são comércio.

---

## 3. Estado atual

MVP local: vitrine + create de catálogo + reserva **customer** + social/chat/Agora/carona/trip.

Não processa dinheiro, não tem cardápio, não tem pedido comercial, não tem dashboard, não tem ingresso.

Núcleo 1H-6/1H-7 **permanece**. 1H-7A/B **permanecem**. Esta fase só classifica o que era OPEN.

---

## 4. Matriz de decisões

| Decisão | Estado atual no código | Impacta MVP local? | Impacta Schema A? | Impacta Commerce B? | Classificação | Decisão |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Pagamento | Demo string / Trip PIX | Não (não há Order) | **Não** | Conceito sim; **tabela não no 1º B** | **DEFERRED** | Sem entidade Payment no Schema A nem no primeiro recorte B |
| Logística | Inexistente (≠ Trip) | Não | Não | Modo no Order; operador depois | **DEFERRED** (operador) / **CLOSED** (modo) | `fulfillmentMode` no Order; sem DeliveryJob |
| Carrinho | Inexistente | Não | Não | Não no 1º B | **DEFERRED** | Pedido 1 produto; Cart depois |
| Business Web | Inexistente; `/gerenciar` ≠ ops | Não | Não | Superfície depois | **CLOSED** arquitetura / **DEFERRED** implementação | |
| Staff | Flag morta | Não | Não (ownerId basta) | Não no 1º B | **DEFERRED** | Owner-only; modelo não impede staff depois |
| Variações | Inexistente | Não | Não | Não no 1º B | **DEFERRED** | Product → ProductVariant futuro |
| Estoque | Inexistente | Não | Não | Availability basta | **DEFERRED** | AVAILABLE/UNAVAILABLE ≠ inventory |
| Comissão | Inexistente | Não | Não | Não | **DEFERRED** | Sem wallet/payout |
| Order + Reservation | Reserva existe; Order não | Reserva já no app | Reservation no A; Order no B | Relação opcional | **CLOSED** | Independentes; FK opcional futura |
| Ticketing | Evento sem ingresso | Não | Event no A **sem** Ticket | Não | **DEFERRED** | Event ≠ Ticket |
| Product / Service | Inexistente | Não | **Não** (ficam no B) | Sim | **CLOSED** (contrato) | Entidades B |
| Offer | Overlay local | Já no MVP | **Sim** (catálogo) | Gestão avançada no B | **CLOSED** | Offer → Business; ≠ Product |
| Order / Item / status | Inexistente | Não | Não | Sim | **CLOSED** (contrato B) | Snapshot de preço |
| Fulfillment | Inexistente | Não | Não | Atributo do Order | **CLOSED** | Enum no Order; sem tabela extra no 1º B |
| Reservation policy | Auto-confirm demo | Comportamento demo | Colunas de status no A | Owner incoming no B | **DEFERRED POLICY** | Status no A; quem clica confirmar = política |

Nenhum item da lista do briefing é **BLOCKER** do Schema A.

---

## 5. Pagamento

Não há gateway. Settings “Cartão final 4821” e PIX de Trip **não** são Order Payment.

**Contrato:**

- Order **pode existir sem pagamento** (`created` / `confirmed` por política).
- Pagamento **não** é obrigatório para o registro existir.
- Pagamento posterior, na retirada ou na entrega: **permitidos como política futura**, não como tabelas agora.
- Pix/cartão **não** são entidades do Schema A.
- **Payment não entra no Schema A.**
- No **primeiro Commerce B**, Order nasce **sem** tabela Payment. `Payment` / `PaymentIntent` = evolução (gateway).

```text
Order  →  [futuro] PaymentIntent  →  Payment
```

```text
DEFERRED — fora do Schema A; fora do primeiro recorte de tabelas B
```

---

## 6. Logística

```text
Order.fulfillmentMode = PICKUP | DELIVERY | ON_SITE
```

**Não** reutilizar Trip, Dispatcher, Carona.

- Primeiro Commerce B: **atributo do Order**, não agregado `Fulfillment` / `DeliveryJob`.
- Endereço: campo opcional no Order **se** DELIVERY (pode reusar dado de Profile; não exige tabela Address agora).
- Taxa, entregador, operador, tracking: **DEFERRED**.

```text
CLOSED: modo no Order, domínio ≠ mobilidade
DEFERRED: operador logístico, taxa, tracking, tabela Delivery
```

---

## 7. Carrinho

Compatível com Order + OrderItem + snapshot + quantity **sem** Cart: um Order com **um** OrderItem (quantity ≥ 1 do mesmo produto).

**MVP comércio:** sim, pedido de um único produto sem Cart.  
**Futuro:** Cart quando o cardápio tiver vários SKUs distintos.

```text
DEFERRED
```

---

## 8. Business Web

```text
BUSINESS DASHBOARD:
ARCHITECTURE = CLOSED     (superfície própria; ≠ App; ≠ /gerenciar; ≠ Admin)
IMPLEMENTATION = DEFERRED (depois de existir Product/Order)
```

Schema A **não** cria tabelas “de dashboard”. App e dashboard futura compartilham as mesmas entidades.

---

## 9. Staff

Validado: **Owner-only no MVP.** `canManageEmployees` sem UI.

Não criar employees, invitations, staff roles.

Owner = `ownerId` / Identity. Staff depois pode ser membership no Business **sem** invalidar Schema A (não há `staff_id` obrigatório).

```text
DEFERRED
```

---

## 10. Variações

Sem cardápio. Não antecipar tamanho/cor/sabor.

```text
DEFERRED
futuro: Product → ProductVariant (preço/disponibilidade por variante)
```

Quantity no OrderItem **não** é variação.

---

## 11. Estoque

**AVAILABLE / UNAVAILABLE** (e publication DRAFT/PUBLISHED/PAUSED) bastam no primeiro Commerce.

Inventory (quantidade, baixa, mínimo) = **DEFERRED**. Não confundir com availability.

---

## 12. Comissão

Sem cobrança real da plataforma.

```text
DEFERRED
```

Sem payout, settlement, commission, wallet, balance no Schema A nem no primeiro B.

---

## 13. Order + Reservation

**Caso D (fechado):** entidades **independentes**. Relacionamento **opcional e futuro** (`order.reservationId` ou inverso), nunca obrigatório.

| Exemplo | Agora | Contrato |
| --- | --- | --- |
| Mesa + pedido | Só reserva genérica | Duas entidades; link depois |
| Salão + pagamento | Só reserva genérica | Service+Reservation no B; Payment depois |
| Evento + compra | Só Event + check-in | Ticket DEFERRED |

Schema A: **Reservation** (já no MVP). Schema B: **Order**. Sem FK cruzada no desenho inicial de cada um.

```text
CLOSED
```

---

## 14. Ticketing

Event existe. Ticket **não**. Check-in de presença ≠ ingresso.

```text
Event ≠ Ticket
DEFERRED
```

Não criar Ticket, QR, inventory de ingresso.

---

## 15. Product (contrato B — validado)

```text
id, businessId, ownerId
name, description, price, image?
publication, availability
fulfillment eligibility (delivery / pickup / on_site flags)
```

Não Schema A. Não implementar.

---

## 16. Service (contrato B — validado)

```text
id, businessId, ownerId
name, description, price, durationMinutes?
publication, availability
requiresSchedule
location mode: AT_BUSINESS | AT_CUSTOMER
```

`ONLINE` = **DEFERRED** (1H-7A OPEN resolvido: **fora do primeiro B**).

Não Schema A.

---

## 17. Offer (Schema A — já no catálogo)

```text
Offer → Business   (businessId obrigatório)
Offer ≠ Product
```

Aplicar Offer a Product/Service específico = **evolução**, não resolvido no primeiro B.

Cupom mock ≠ Offer; unificação **DEFERRED**.

---

## 18–19. Order e OrderItem (contrato B)

```text
Order
  id, customerId, businessId
  status, fulfillmentMode
  total (snapshot)
  address? (se DELIVERY)
  items[]

OrderItem
  productId? (referência)
  nameSnapshot, unitPriceSnapshot, quantity, subtotal
```

Preço **histórico no item**, nunca reconstruir só pelo Product live.

Service em OrderItem: só se o serviço **não** for agenda (`requiresSchedule` → Reservation). Combo = futuro.

---

## 20. Order status (validado)

```text
CREATED → CONFIRMED → PREPARING → READY → COMPLETED
                                      → CANCELLED
READY → OUT_FOR_DELIVERY → COMPLETED   [somente DELIVERY]
PICKUP: READY = retire no local; sem OUT_FOR_DELIVERY
```

Sem estados extras. Cancelamento = política futura (quem pode), não novo status.

---

## 21. Reservation (Schema A)

Contrato 1H-7 **mantido**:

```text
pending → confirmed → cancelled
```

`completed` fora. Demo auto-confirm **não** é a política remota definitiva.

**DEFERRED POLICY:** quem confirma (sistema auto vs owner). Schema A persiste `status` + `userId` + target; não automatiza aceite.

Incoming para o owner = experiência B/dashboard, mesma tabela.

---

## 22. Schema A — Core Connexy

Primeira migração remota = o que **já é produto estável local**, sem comércio de itens:

```text
Auth / Identity          (Supabase Auth; não tabela de produto)
Profile                  (PK = userId)
Follow
ConnectionRequest
Connection
Conversation
ConversationParticipant  (pin, lastReadAt, invite status)
Message                  (kind inclui call estruturado)
Reel + ReelLike + ReelComment
Post / Moment
Business
Place
Event
Offer                    (businessId → Business)
Reservation
CaronaOffer
CaronaRequest
```

**Fora do A:** Product, Service, Order, OrderItem, Payment, Cart, Ticket, Staff, Inventory, Commission, DeliveryJob, Trip (demo/infra depois), mocks.

Settings language: opcional no A (pref de conta) ou ficar local — 1H-6 HYBRID; **não blocker**. Preferência: coluna/prefs no Profile ou adiar. **DEFERRED** se não for crítico no dia 1.

Saves / business follow / reviews: candidatos A **leves** ou B; **não blocker**. Recomendação 1H-8: Save genérico pode ser A se já persiste (`saved-details`); follow negócio e reviews locais são parciais — 1H-8 decide packing, não reabre domínio.

---

## 23. Schema B — Commerce

Justificado só quando o comércio for implementado:

```text
Product
Service
Order
OrderItem
```

Fulfillment = **campo** de Order, não tabela no 1º B.

Evolução B+/C (não 1º B): ProductVariant, Inventory, Payment, DeliveryJob, Cart, Order↔Reservation FK, Offer→Product, Staff, Ticket, Commission.

Offer já está no **A**. Dashboard web **não** é schema.

---

## 24. Decisões fechadas

- App / Business / Admin (arquitetura).
- `/gerenciar` ≠ dashboard; implementação dashboard DEFERRED.
- Product ≠ Service ≠ Offer ≠ Order ≠ Reservation.
- Professional ⊂ Business.
- Delivery ≠ Trip/Dispatcher/Carona.
- Order independente de Reservation; link opcional futuro.
- Event ≠ Ticket.
- Owner-only MVP.
- Pedido inicial sem Cart.
- Fulfillment = enum no Order.
- OrderItem com snapshot de preço.
- Status de Order e Reservation (1H-7 / 1H-7A).
- Service location AT_BUSINESS | AT_CUSTOMER; ONLINE adiado.
- Payment **não** no Schema A.
- Schema A = social + catálogo 4 + reservation + carona + conteúdo.
- Schema B = Product, Service, Order, OrderItem.

---

## 25. Decisões adiadas (DEFERRED)

Pagamento (entidade e gateway); operador logístico / taxa / tracking; Cart; implementação da web; Staff; ProductVariant; Inventory; Comissão; Ticket; Offer aplicada a Product/Service; Order↔Reservation FK; serviço ONLINE; incoming-reservation UX; meios Pix/cartão/dinheiro; cupom vs Offer.

---

## 26. Blockers

**Nenhum blocker de domínio para desenhar o Schema A.**

Reuso de stubs `ChatRepository` / 6 tabelas geradas continua **risco de implementação** (1H-5), não decisão aberta: 1H-8 deve **ignorar** esses stubs como contrato.

Auth real é **infra** da implementação A, não decisão de produto em aberto.

---

## 27. Recomendação do 1H-8

**1H-8 — Remote Schema Design / Supabase Contract** (ainda **documento**):

1. Desenhar **somente Schema A** (hipótese de tabelas, PKs, FKs, RLS em prosa, Storage de mídia social/catálogo).
2. Anexar **Schema B** como lista conceitual, sem pretender migration no mesmo momento.
3. Não copiar `integrations/supabase/types.ts` nem `ChatRepository` como fonte.
4. Não incluir Payment, Cart, Ticket, Trip, DeliveryJob.

Não iniciar 1H-8 nesta fase. Não alterar o MVP.

---

## Backend readiness

```text
READY WITH OPEN FUTURE DECISIONS
```

Pronto para **desenhar** Schema A. Commerce, pagamento e logística estão **nomeados e adiados**, não bloqueando o A.

---

## Validação

| Check | Resultado |
| --- | --- |
| Produto alterado | 0 |
| Relatórios anteriores | intactos |
| Testes unitários (não-browser) | **326 pass / 0 fail / 1509 expect()** |
| `bunx tsc --noEmit` | PASS |
| `bun run build` | PASS |
