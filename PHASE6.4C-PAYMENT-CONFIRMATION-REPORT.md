# Fase 6.4-C — Confirmação de Pagamento pelo Motorista e Bloqueio de Corridas Não Pagas (demo/local)

> **Supersessão do §24 (6.4-B):** a 6.4-B previa que o usuário confirmava o PIX com "Simular pagamento" →
> `paymentConfirmed = true`. Isso foi revisto (decisão da 6.4-C): em fluxo real quem confirma o recebimento
> é o motorista. **"Simular pagamento" continua no painel do passageiro, mas agora é apenas local/visual** —
> mostra "Pagamento simulado enviado — o motorista confirmará o recebimento" e **não** altera
> `paymentConfirmed`. A autoridade real de `paymentConfirmed = true` é exclusiva do motorista.

## Autoridade de confirmação (motorista)

- Painel do motorista (`/driver`), apenas em `chegada`/`avaliacao` (`hasNoPaymentWindow`).
- Dois caminhos explícitos, ambos exigem ação consciente:
  - **"Confirmar pagamento"** → `confirmDriverPayment()` → `paymentConfirmed = true`. Sem modal (ação direta: recebeu e confirmou).
  - **"Usuário não pagou"** → abre modal **"Usuário não pagou a corrida?"** com consequência declarada
    (impedido de solicitar novas corridas). "Voltar" é inócuo; **"Confirmar não pagamento"** → `recordUnpaidTrip()`
    → `paymentConfirmed = false` + `paymentIssue = "user_not_paid"`.
- Funciona nos dois métodos: PIX e Dinheiro. O chip do motorista troca para "Pagamento confirmado · Pago via
  Pix/Dinheiro" após a confirmação; pendencias ficam "Aguardando pagamento" (pulse).

## Estados e invariantes (domínio)

- `paid` = `paymentConfirmed === true`; `pending` = `false` sem issue; `unpaid` = `false` + `paymentIssue === "user_not_paid"`.
- Invariantes garantidas por guards idempotentes em `trip-store.ts`:
  1. `paymentConfirmed=true` + issue é **inválido** (confirmar em trip não paga é no-op).
  2. `paymentConfirmed=false` **sozinho nunca** gera bloqueio.
  3. Corrida `cancelada` **nunca** gera bloqueio.
  4. Bloqueio **nunca** carrega `paymentConfirmed=true`.
  5. `recordUnpaidTrip()` é no-op em `conclusao` (terminal).

## Bloqueio por usuário

- Fonte única: `connexy_demo_ride_blocks` = `Record<userId, RideBlock>`.
- Chave = **identidade demo** (`userId` → identidade `connexy:demo:identity`, ex. `"lucas"`/`"beatriz"`) — **por usuário, não por navegador/app**.
- Aplicado **antes do matching**: `RideBlockedPanel` com early return em `/ride/request` (`useRideBlock`).
- Idempotente: 1 bloqueio por `tripId` e por usuário; persiste após reload (localStorage).
- `clearRideBlock()` existe para resets do harness/demo; **não** é usada para regularização (fase futura).

## Histórico e detalhe da viagem

- `/ride/history` virou **layout** (`Outlet`) + `index.tsx` (lista) — resolveu o detalhe que nunca renderizava
  quando navegado via child `$tripId`.
- `RideHistoryCard`: chips `Pagamento confirmado`, `Aguardando pagamento`, `Corrida não paga`, `Cancelada`
  (via `tripPaymentStatus`). Cartão cancelado não mostra valor/método.
- `/ride/history/$tripId` → `RideTripDetail` (origem, destino, paradas, motorista, valores, chip de status),
  `throw notFound()` quando o id não existe. `BackButton` com `FallbackRoute` = `"/ride/history"`.

## Ajustes de demo (motorista)

- O dispatcher prioriza o motorista-demo do dispositivo (`DEMO_DRIVER_ID`, marcos) quando disponível/elegível,
  com fallback por proximidade — a tela `/driver` corresponde a quem realmente recebe a corrida.
- `active` do painel deriva direto da Trip (`useTrip`, `driver.id === DEMO_DRIVER_ID`, status não-terminal),
  sem depender da store de dispatch.

## Fora de escopo (mock explícito)

- Sem gateway, QR Code, copia-e-cola, chave PIX, banco, agência, conta, wallet ou transações reais.
- Sem registro remoto ilícito; todo o estado é demo/local (sem Supabase).
- Sem botão "Regularizar" no bloqueio — regularização fica para fase futura (o painel informa isso).

## Validação

- E2E `qa64c.mjs`: **11/11 PASS** (PIX e Dinheiro; não-pago + modal; bloqueio antes do matching; por identidade;
  persistência após reload; cancelada não bloqueia; pending não bloqueia; passageiro não confirma; sem infra;
  detalhe da viagem). Sem erros de console.
- Responsividade: sem overflow horizontal em 375/430/768/1024/1440 (histórico, detalhe, bloqueio, driver).
- `bunx tsc --noEmit` limpo; `bun run build` OK; `eslint` 0 erros (1 warning pré-existente);
  `git diff --check` limpo.
- Commit da fase: `3674f81` (sem push).