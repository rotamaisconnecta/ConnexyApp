# Fase 6.4 — Pagamento e Histórico (demo/local)

> **ATUALIZADO pela Fase 6.4-C** (`PHASE6.4C-PAYMENT-CONFIRMATION-REPORT.md`): a confirmação de
> "Simular pagamento" (PIX) do §24 abaixo é, agora, apenas local/visual (feedback) — a autoridade de
> `paymentConfirmed = true` é exclusiva do motorista. Ver também bloqueio por não pagamento e detalhe da viagem.

## Pagamento atual

- Forma canônica (domínio): `PaymentOption = "pix" | "dinheiro"` em `src/lib/mobility/trip/trip-types.ts`.
- Apresentação centralizada: `src/lib/mobility/payment.ts` (`paymentMethodLabel`, `paymentStatusLabel`, `PAYMENT_METHOD_LABELS`, `PAYMENT_STATUS_LABELS`).
- A string persistida continua `"pix"` / `"dinheiro"` — **não** renomear para `"cash"` (dados demo existentes).
  O driver-side usa `"PIX"` / `"CASH"` como **enum de apresentação** próprio, normalizado em um único ponto
  (`src/routes/_app/driver/index.tsx` → `offerToDriverRequest`). Não é um segundo modelo do domínio.

## Persistência

- Local/demo, **sem Supabase**. Fonte única: `connexy_demo_trip` (localStorage) com `{ trip, history }`.
- `history: Trip[]` armazena a Trip concluída/cancelada — a mesma representação do domínio, sem duplicar.
  O histórico é derivado das Trips existentes (não há `TripHistoryStore` paralela).

## PIX

- Pagamento direto ao passageiro → motorista. O Connexy **não** processa PIX.
- Sem QR Code, sem copia-e-cola, sem chave PIX, sem banco, sem gateway.
- Confirmação **explícita** (demo: botão "Simular pagamento" → `paymentConfirmed = true`).

## Dinheiro

- "Pagamento direto ao motorista."
- Confirmação **explícita** (demo: botão "Confirmar pagamento" → `paymentConfirmed = true`).

## Confirmação

- Explícita em ambos os métodos. Nenhum método é marcado como pago automaticamente.
- `paymentMethod` (o que foi escolhido) e `paymentConfirmed` (status) são campos separados por design.
- A máquina de Trip não exige confirmação para chegar a `conclusao`; mas `completeTrip` **nunca** seta
  `paymentConfirmed`. O status "Pagamento confirmado" só é exibido quando houve ação explícita.

## Histórico

- Rota: `/ride/history`. Lê `useTripHistory()` → `connexy_demo_trip.history` (Trip[]).
- Ordenado do mais recente para o mais antigo por timestamp (`completedAt ?? cancelledAt ?? createdAt`).
- Cada cartão exibe: data, origem → destino, valor (`finalFare ?? estimatedFare`), método e estado.
- Estado vazio: "Suas viagens aparecerão aqui." Sem dados fake.

## Futuro

Uma fase futura poderá introduzir (não implementado agora):

- Supabase / migration;
- gateway de pagamento;
- PIX integrado (QR Code, chave PIX, copia-e-cola);
- transaction ID / payment provider;
- confirmação automática;
- confirmação de recebimento pelo motorista.