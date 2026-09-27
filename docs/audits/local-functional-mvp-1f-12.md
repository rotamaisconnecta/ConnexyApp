# Fase 1F-12 — Catálogo local persistente

- **Data:** 2026-09-19
- **Status:** PASS (cadastro local/demo). Publicação remota e catálogo
  compartilhado **BLOCKED**.
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-10 (315 testes / 1709 assertions).

## 1. Auditoria

| Tipo    | Antes (1F-8/1F-11)                         | Depois |
| ------- | ------------------------------------------ | ------ |
| Evento  | leitura de fixtures; Create BLOCKED        | store + `/create/event` → `/event/$id` |
| Local   | `places[]`; Create BLOCKED                 | overlay em `/locais` e `/local/$id` |
| Negócio | `MOCK_BUSINESSES`; Create BLOCKED          | overlay em marketplace e `/business/$id` |
| Oferta  | promoções de fixture; Create BLOCKED       | ligada a `businessId` canônico |

Não mapear esses tipos para `connexy:demo:posts`. O formulário de post
não coleta data, capacidade, horário, desconto nem host de negócio.

Não criar `EventRepository` / `PlaceRepository` / `OfferRepository` /
`BusinessRepository`, nem chaves `connexy:demo:events|places|offers|businesses`.

## 2. Decisão

Um único blob em `localStorage`:

```text
chave: connexy:demo:catalog  (demoStorageKey("catalog"))
evento: connexy:demo:catalog
ownerId: getDemoIdentity().id
id: `${kind}-${Date.now()}-${rand}`
```

Leitura = entidades do usuário **sobre** fixtures existentes
(`mergeCatalogPlaces` / `mergeCatalogEvents` / `mergeCatalogBusinesses`).
Oferta exige `businessId` não vazio; se o id já está no catálogo, o
kind tem de ser `business` (fixtures como `b1` continuam válidas).

Detalhes `/event/$id`, `/local/$id` e `/business/$id` usam `ssr: false`
para o loader ler o catálogo após reload.

## 3. Implementação

```text
/create → Evento|Local|Negócio|Oferta
       → CatalogCreateForm
       → createCatalog{Event,Place,Business,Offer}
       → connexy:demo:catalog
       → detalhe canônico
```

Copy honesta: “Cadastro local/demo. Não há publicação remota nem
catálogo compartilhado entre dispositivos.”

## 4. Arquivos

- `src/lib/catalog/local-catalog.ts`
- `src/components/catalog/catalog-create-form.tsx`
- `src/routes/_app/create/{event,place,offer,place-business}.tsx`
- `src/routes/_app/create.tsx`, `my-connexy.tsx`, `_app.gerenciar.tsx`
- overlays: `mock-businesses.ts`, `local-event-lookup.ts`,
  `_app.locais.tsx`, `_app.local.$id.tsx`, `event.$eventId.tsx`,
  `business.$businessId.tsx`, `marketplace.tsx`, `discover.tsx`,
  `_app.events.tsx`, `discover-navigation.ts`
- `tests/persist-phase-1f-12.test.ts`
- `tests/persist-phase-1f-12-browser.test.ts`
- `tests/fixtures/mvp-1f-12-browser.ts`
- 1F-3 / 1F-4 / 1F-8 atualizados (deixam de exigir BLOCKED nesses tipos)

## 5. Testes

```text
focados: 4 (3 unitários + 1 CDP)
suíte completa: 319 pass
assertions: 1818
falhas: 0
typecheck: PASS (bunx tsc --noEmit)
build: PASS
lint: PASS nos arquivos alterados
CDP: PASS
networkCalls: 0
```

Browser ao vivo (`:8080`, sessão demo): Create Evento persiste
`Sarau 1F-12` em `/event/event-…`, sobrevive ao reload e aparece em
`/events` (Próximos). Hub `/create` oferece Evento/Local/Negócio/Oferta
sem tela de indisponibilidade.

## 6. Limitações

```text
PASS
  Cadastro local dos quatro kinds
  Overlay nas listas/detalhes existentes
  Reload do detalhe (ssr: false)
  Identidade canônica (ownerId = getDemoIdentity().id)

BLOCKED
  Backend / publicação remota
  Catálogo compartilhado entre dispositivos
  Repositories por tipo / IndexedDB de catálogo
  Analytics de presença de locais/eventos próprios
```

Não afirmar que o cadastro é público ou sincronizado.

## 7. Documentação

- `docs/audits/local-functional-mvp-1f-12.md` (este arquivo)
- `docs/audits/local-functional-mvp-baseline.md`
