# Fase 1F-9 — Dispatcher persistido

- **Data:** 2026-09-19
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-8 (304 testes / 1558 assertions).

## 1. Auditoria

### DISPATCHER

- **Arquivos:** `dispatcher-store.ts`, `dispatcher.ts`, `dispatch-types.ts`,
  `demo-fleet.ts`, `use-dispatch.ts`, `use-driver-mode.ts`,
  `src/routes/_app/driver/index.tsx`.
- **Componentes:** tela `/driver`, RideFlow via `usePassengerDispatch`.
- **Store:** `LocalDispatcher` em memória (`fleet`, `entries`, `events`).
- **Machine:** não há máquina própria; a autoridade é `trip-machine`.
- **Persistência:** `connexy_demo_dispatcher` só guarda
  `{ autoAccept, delayMs }`. Frota/oferta/atribuição não eram gravadas.
- **Estado atual (antes):** B — política persistida; operação volátil.
  Recovery de `buscando` via `requestRide`; demais estados dependiam de
  `trip.driver` na UI do passageiro. Cancelamento do motorista após reload
  falhava porque a entry assigned desaparecia.

### Trip

- **ID canônico:** `trip.id` (`trip-<timestamp>-<rand>`).
- **Estados reais:** `solicitar → rota → embarque → categoria → buscando →
  encontrado → chegando → chegou → emviagem/parada → chegada → avaliacao →
  conclusao` e `cancelada`.
- **Persistência:** `connexy_demo_trip` `{ trip, history }`.
- **Identidade:** `trip.userId`, `trip.driver.id` (`marcos`/`carla`/`joao`).

### Chaves

| Chave | Schema | Writer | Reader |
| --- | --- | --- | --- |
| `connexy_demo_trip` | `{ trip, history }` | trip-store | load/sanitize |
| `connexy_demo_dispatcher` | `{ autoAccept, delayMs }` | setDemoDispatcherConfig | readConfig |
| `connexy_demo_ride_blocks` | bloqueio por userId | ride-blocks | isRideBlocked |

## 2. Classificação

| Peça | Antes | Depois |
| --- | --- | --- |
| Trip + history | A | A (intocado) |
| Política demo do dispatcher | A | A (intocado) |
| Frota/oferta/atribuição | C (memória) | B — deriva da Trip no boot |

## 3. Decisão

Trip Machine é a autoridade. O dispatcher não ganha store, repository
nem chave nova.

Após reload, `hydrateDispatcherFromTrip()` reconstrói:

- `buscando` → `requestRide` (já existia)
- estados com `trip.driver` → `restoreAssignment` (sem evento
  `DRIVER_ASSIGNED`, para não re-chamar `markDriverFound`)
- `cancelada` / `conclusao` → cancelamento ou liberação da frota

`connexy_demo_dispatcher` continua só a política demo.

## 4. Implementação

```text
UI / RideFlow / /driver
  ↓
dispatcher.ts (hydrateDispatcherFromTrip)
  ↓
LocalDispatcher (memória operacional)
  ↓
Trip store = autoridade persistida (connexy_demo_trip)
```

## 5. Arquivos

- `src/lib/mobility/dispatch/dispatcher-store.ts` → `restoreAssignment`
- `src/lib/mobility/dispatch/dispatcher.ts` → `hydrateDispatcherFromTrip`
- `tests/persist-phase-1f-9.test.ts`
- `tests/persist-phase-1f-9-browser.test.ts`
- `tests/fixtures/mvp-1f-9-browser.ts`

## 6. Testes

Focados 1F-9: 6 testes.

Suíte completa: **310 pass / 1632 assertions / 0 fail**.

Harness CDP: solicitação, aceite, `emviagem`, perda de memória,
hydrate, reload real, cancelamento do motorista, histórico,
`networkCalls = 0`. 1D-4 continua PASS.

## 7. Limitação

Online/offline ocioso da frota demo continua volátil (volta a
`available` no reload, salvo motorista atribuído na Trip). Matching
remoto, GPS e dispatcher backend permanecem P2. Não BLOCKED para o
objetivo desta fase (atribuição e recovery consistentes com a Trip).
