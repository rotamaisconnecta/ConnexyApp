# Fase 1H-2 — Home Discovery + Connect Pulse + Reserva + Carona Amiga

- **Data:** 2026-09-23
- **Status:** PASS
- **Modo:** evolução controlada sobre fontes já auditadas.
  Sem Supabase. Sem commit/push. Sem próxima fase automática.
- **Baseline anterior:** 1G-3 (328 testes / 1951 assertions).

Quatro capacidades sobre a arquitetura local existente:

1. Connect Pulse visual/editorial, sem navegação;
2. Perto de você com incremento 5 → +5 sobre o catálogo já disponível;
3. Reserva genérica persistida;
4. Carona Amiga social, isolada do dispatcher.

## 1. Files changed

Produto / domínio:

- `src/lib/home/home-discovery.ts` (novo)
- `src/components/home/ConnexyPulse.tsx`
- `src/components/home/nearby-you-list.tsx` (novo)
- `src/lib/reservations/reservable.ts` (novo)
- `src/lib/reservations/reservation-store.ts` (novo)
- `src/lib/carona/carona-store.ts` (novo)
- `src/routes/_app/reserva.$resourceId.tsx` (novo)
- `src/routes/_app/reservas.tsx` (novo)
- `src/routes/_app/carona.tsx` (novo)
- `src/routes/_app/carona.nova.tsx` (novo)
- `src/routes/_app/carona.$offerId.tsx` (novo)
- `src/routes/_app/create.tsx` (item Carona Amiga)
- `src/routes/_app/business.$businessId.tsx` (CTA Reservar)
- `src/routes/_app.local.$id.tsx` (CTA Reservar)
- `src/components/navigation/back-button.tsx` (fallbacks `/reservas`, `/carona`)
- `src/routeTree.gen.ts`

Testes:

- `tests/persist-phase-1h-2.test.ts` (novo)
- `tests/persist-phase-1h-2-browser.test.ts` (novo)
- `tests/fixtures/mvp-1h-2-browser.ts` (novo)

Relatórios:

- `docs/audits/local-functional-mvp-1h-2.md`
- `docs/audits/local-functional-mvp-baseline.md`

Não foram criados IndexedDB novos, `/agora`, `RideChatRepository`,
`restaurant-reservations` nem store paralelo de Pulse.

## 2. Connect Pulse

### Origem dos dados

Projeção de apresentação em `listConnectPulseItems()`:

- catálogo persistente `connexy:demo:catalog` via
  `mergeCatalogPlaces` / `mergeCatalogEvents` / `listCatalogByKind`;
- negócios e promoções de `getAllBusinesses()`;
- eventos de `MOCK_EVENTS` e `HOME_EVENTS`;
- imagens já presentes nessas entidades (fallback Unsplash só se a
  entidade não tiver foto).

Não existe `connexy:demo:pulse`. Sem banco novo.

### Comportamento

Carrossel editorial com até 10 cards misturando evento, negócio,
local e oferta. Cards são `<article>` com imagem, tipo e distância.
Reload da Home continua lendo as mesmas fontes.

### Navegação

Clicar nos cards **não navega**. Não há `Link` para evento, negócio,
local, oferta, conversa ou mapa. Rota permanece `/home`.

### Browser

Vite `:8080`, `VITE_APP_DEMO_MODE=true`.

- Título **Connect Pulse** + “Uma vitrine da cidade ao seu redor.”
- 10 cards com imagem: Evento (Sunset no Parque), Negócio, Local,
  Oferta (Café 12%), Workshop, Padaria 1F-13, Café Central, Combo
  café, Noite de Jazz, Praça Central.
- `pulseLinks = []` no DOM do carrossel.
- Toque em “Sunset no Parque” manteve `http://localhost:8080/home`.

## 3. Perto de você

### Fonte

A mesma `listHomeDiscoveryItems()` do Pulse (catálogo + fixtures).
Ordenação existente `sortByDistanceMeters`. Sem ranking novo.

### Paginação

Camada de apresentação: `NEARBY_PAGE_SIZE = 5`, `paginateNearby`,
`IntersectionObserver` no sentinela.

Live:

- primeiro paint: **5** itens;
- ao chegar ao fim: **10**, depois **15**;
- IDs únicos (prefixo `kind:id`);
- fim: “Não há mais itens” quando `limit >= total`.

Não foram inventados mocks só para alongar o scroll.

### Ver mais

`Link to="/locais"`. Live: `http://localhost:8080/locais`, título
“Locais próximos — Connexy”, lista existente (Ateliê 1F-13, Café
Central, Sunset no Parque, Burger House, Vinil & Cia). Sem segunda
experiência de descoberta.

### Reload

A lista recomeça em 5 (estado de UI). Os dados vêm das mesmas
fontes persistidas/fixtures.

## 4. Reserva

### Modelo

Entidade única `Reservation`:

```ts
id, userId, resourceId, resourceType, resourceName,
date, time, partySize, status, createdAt
```

`resourceType`: `business | place`. `reservable` é derivado da
categoria (`isBusinessReservable` / `isPlaceReservable`), sem agenda
complexa no catálogo.

Estados: `requested | confirmed | cancelled | completed`.
MVP local confirma na hora: `requested → confirmed`.

### Source of truth

```text
connexy:demo:reservations
```

Uma chave. Sem `restaurant-reservations` / `service-reservations`.

### Fluxo

```text
negócio/local reservável → /reserva/$resourceId
→ data + horário + pessoas → Confirmar
→ /reservas (status confirmed) → reload → Cancelar
```

Live: `/business/b1` (Bistrô Paulista) → Reservar → 2026-09-24,
19:30, 2 pessoas → `reservation-1790134735623-eodbl` confirmada →
reload de `/reservas` manteve o item → Cancelar remove o CTA e
marca cancelada.

Isolamento: `listReservations(userId)` filtra por
`getDemoIdentity().id`. Reserva de Lucas não aparece para Beatriz
(teste unitário e harness CDP).

### Limitações

Sem pagamento, PIX, disponibilidade real, calendário externo,
notificação remota ou backend.

## 5. Carona Amiga

### Modelo

Conceitos `RideOffer` / `RideRequest`, nomes de implementação
`CaronaOffer` / `CaronaRequest` para não colidir com o dispatcher.

Offer: `id, ownerId, origin, destination, meetup, date, time,
availableSeats, status (active|full|cancelled|completed), createdAt`.

Request: `id, rideOfferId, requesterId, status
(requested|accepted|rejected|cancelled), createdAt, conversationId?`.

Origem/destino/encontro passam por `approximateLabel` (primeiro
segmento). Sem endereço residencial preciso.

### Source of truth

```text
connexy:demo:carona
```

Blob `{ offers, requests }`. Isolado de `connexy_demo_trip` e
`connexy_demo_dispatcher`.

### Fluxo

```text
/create → Carona Amiga → /carona/nova
→ publicar → /carona/$offerId
→ outra identidade solicita → ofertante aceita
→ conversa existente + mensagem de contexto
```

Live:

- Lucas publicou Av. Paulista → Ibirapuera, encontro Metrô Trianon,
  2 vagas, 19:30 (`carona-1790134801356-q3pvm`);
- Beatriz (switcher canônico em `/chat`) viu **Solicitar carona**;
- pedido `requested`;
- Lucas aceitou → 1 vaga, status `accepted`, **Conversar**,
  **Ver ponto de encontro** e **Cancelar**;
- reload da oferta manteve accepted + as três ações.

### Conversa

`acceptCaronaRequest` reutiliza `connectUser` + `sendLocalMessage`.
Sem `RideChatRepository`.

Live: `/chat/demo-direct-beatriz--lucas` com a mensagem

```text
Carona Amiga confirmada
Destino: Ibirapuera
Horário: 19:30
Encontro: Metrô Trianon
```

### Limitações

Sem GPS, tracking, matching, rota real, pagamento ou denúncia/bloqueio
de produto. Ponto de encontro é label aproximado, sem mapa. Create Hub
ganhou o atalho; o menu Mais não.

## 6. Source of truth map

Novas entidades desta fase:

```text
Reservation
→ connexy:demo:reservations

CaronaOffer / CaronaRequest  (conceitos RideOffer / RideRequest)
→ connexy:demo:carona
```

Inalteradas:

```text
Identity          → getDemoIdentity()
Profile           → connexy:demo:own-profile
Connections/…     → connexy:demo:db
Conversations     → IndexedDB connexy-app-local-db
Momento           → connexy:demo:posts
Agora             → IndexedDB connexy-reels-data-local-db
Saves             → connexy:demo:saved-details
Outing            → connexy:demo:outing-invites
Trip              → connexy_demo_trip
Dispatcher        → connexy_demo_dispatcher
Catalog           → connexy:demo:catalog
```

Pulse e Perto de você são projeção. Sem segunda fonte.

## 7. Tests

```text
quantidade anterior: 328 testes / 1951 assertions
novos testes:        7 (6 unitários 1H-2 + 1 browser CDP)
total:               335 pass
assertions:          2025
falhas:              0
```

```text
335 pass
2025 assertions
0 fail
```

Harness CDP: Pulse kinds business+event, nearby 5→10 sem duplicar,
reserva confirmada + reload + isolamento B vazio + cancel, carona
publicar/solicitar/aceitar com `conversationId`, `networkCalls = 0`,
menu Mais intacto, sem chaves paralelas.

## 8. Typecheck

PASS (`bunx tsc --noEmit`)

## 9. Build

PASS (`bun run build`, nitro ✔)

## 10. Lint

PASS nos arquivos alterados desta fase (`bunx eslint` na lista
tocada). Lint global permanece o baseline preexistente (não limpo).

## 11. Browser/CDP

Vite `:8080`, `VITE_APP_DEMO_MODE=true`.

Ao vivo:

- `/home` Connect Pulse visual, sem links, toque sem navegação;
- Perto de você 5 → 10 → 15; Ver mais → `/locais`;
- `/business/b1` → Reservar → confirmar → `/reservas` → reload →
  cancelar;
- `/carona/nova` → publicar → Beatriz solicita → Lucas aceita →
  `/chat/demo-direct-beatriz--lucas` com contexto;
- reload da oferta: accepted + Conversar + Ver ponto de encontro +
  Cancelar;
- `/profile` → Mais opções: Locais, Eventos, Negócios, Agora,
  Ofertas, Gerenciar.

Harness CDP 1H-2: domínio + persistência + isolamento + rede zero.

Observação: o modo Motorista (pré-existente) pausa o chat até
voltar a Passageiro. Não é regressão desta fase; a conversa
canônica abre depois do switch.

## 12. Network

Harness:

```text
networkCalls = 0
```

No browser ao vivo, os únicos hits com “supabase” no nome são
módulos Vite locais (`src/lib/supabase/*.ts`,
`node_modules/.vite/deps/@supabase_ssr.js`). Sem
`supabase.co` / `/rest/v1/` / realtime remoto.

## 13. Supabase

```text
0 chamadas
```

Não houve login, link, SQL, migration nem bucket remoto.

## 14. Regressões

| Módulo | Resultado |
| --- | --- |
| Identity | Intacta (`getDemoIdentity()`, switcher `/chat`) |
| Profile | Intacta (`connexy:demo:own-profile`, saudação Lucas) |
| Connections | `connectUser` reutilizado só no aceite da carona |
| Conversations / Messages | Mesma conversa `demo-direct-*` + IndexedDB |
| Agora | Rota `/reels`, IndexedDB original, menu Agora |
| Momento | Não tocado |
| Saves | `connexy:demo:saved-details` intacto |
| Catalog | Mesmo overlay; Pulse/nearby só leem |
| Trip / Dispatcher | Não recebem `createCaronaOffer`; chaves originais |
| Menu Mais | Locais, Eventos, Negócios, Agora, Ofertas, Gerenciar |

Ir juntos (`outing-invites`) permanece domínio separado da Carona
Amiga.

## 15. Limitações

### MVP local

- Pulse sem navegação (vitrine);
- Perto de você sem link por item; Ver mais abre `/locais`;
- Reserva confirma na hora, slots fixos, sem agenda do negócio;
- Carona usa labels aproximados e conversa existente;
- Identidade demo canônica para isolamento.

### P1

- Disponibilidade real / capacidade do estabelecimento;
- Inbox de pedidos de carona fora da tela da oferta;
- Denúncia, bloqueio e histórico de carona como produto.

### P2

- GPS, tracking, mapa de encontro, matching;
- Pagamento / PIX / gateway;
- WebRTC;
- Delivery / marketplace de pedidos.

### Dependências de backend

Substituição prevista:

```text
connexy:demo:reservations  → persistence remota Reservation
connexy:demo:carona        → persistence remota RideOffer / RideRequest
```

UI → store/domínio → (futuro) repository remoto. Sem API nesta fase.

## 16. Decisão final

**PASS**

Connect Pulse é vitrine dinâmica sem navegação. Perto de você pagina
5 em 5 sobre a fonte existente e Ver mais abre `/locais`. Reserva e
Carona Amiga persistem no reload, isolam por identidade canônica e
não duplicam catálogo, Trip, dispatcher nem chat.

Não criar uma próxima fase automaticamente. Não fazer commit/push.
Aguardar decisão sobre backend, reservas avançadas, Carona Amiga,
mapas/GPS, pagamentos, delivery e WebRTC.
