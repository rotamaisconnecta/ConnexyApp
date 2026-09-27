# Fase 1F-13 — Fechamento do catálogo local + menu "Mais"

- **Data:** 2026-09-19
- **Status:** PASS (cadastro local/demo). Publicação remota, catálogo
  compartilhado, edição e exclusão **BLOCKED**.
- **Modo:** validação com implementação mínima. Sem Supabase. Sem
  commit/push.
- **Baseline anterior:** 1F-12 (319 testes / 1818 assertions).

## 1. STATUS

**PASS** para o fechamento local dos quatro tipos e para o menu
"Mais" com exatamente seis itens.

Edit/Delete e listagem dedicada de Ofertas não existem na
infraestrutura e não foram inventados.

## 2. CATÁLOGO

| Tipo    | Create | Read | List | Detail | Reload | Edit | Delete |
| ------- | ------ | ---- | ---- | ------ | ------ | ---- | ------ |
| Evento  | PASS   | PASS | PASS | PASS   | PASS   | BLOCKED | BLOCKED |
| Local   | PASS   | PASS | PASS | PASS   | PASS   | BLOCKED | BLOCKED |
| Negócio | PASS   | PASS | PASS | PASS   | PASS   | BLOCKED | BLOCKED |
| Oferta  | PASS   | PASS | LIMITAÇÃO | PASS (detalhe do negócio) | PASS | BLOCKED | BLOCKED |

Evidência de código: `createCatalog{Event,Place,Business,Offer}` em
`src/lib/catalog/local-catalog.ts`. Não há `updateCatalog` nem
`deleteCatalog`. Overlay via `mergeCatalogPlaces` /
`mergeCatalogEvents` / `mergeCatalogBusinesses` (persistido vence
fixture de mesmo id).

Evidência ao vivo (`:8080`, identidade `beatriz` =
`getDemoIdentity().id` nesta sessão):

- Evento `event-1789870032858-8nyw0` Sarau 1F-12 → detalhe 1F-12 +
  lista `/events` (Próximos) nesta fase.
- Local `place-1789873381474-m2ds4` Ateliê 1F-13 → `/local/$id` →
  reload → `/locais` (antes dos fixtures).
- Negócio `business-1789873452616-g14u1` Padaria 1F-13 →
  `/business/$id` → reload → `/marketplace`.
- Oferta `offer-1789873506695-whjd4` Café 12% com
  `businessId=business-1789873452616-g14u1` → promoções do negócio →
  reload.

`saved-details` permanece chave própria (`[]` nesta sessão); o
cadastro de local não a substituiu.

## 3. SOURCE OF TRUTH

```text
Events
→ connexy:demo:catalog

Places
→ connexy:demo:catalog

Businesses
→ connexy:demo:catalog

Offers
→ connexy:demo:catalog

Posts
→ connexy:demo:posts
```

`ownerId` = `getDemoIdentity().id`. Nesta sessão de browser:
`beatriz`. Nos testes isolados: `lucas` (default) e lista vazia para
`beatriz`.

Não há `connexy:demo:events|places|offers|businesses`.
Não há IndexedDB de catálogo.
Não há Event/Place/Offer/Business repository.

## 4. MENU "MAIS"

Overflow de Configurações (`aria-label="Mais opções"` / menu
`aria-label="Mais"`). Não é BottomNav.

```text
Locais      → /locais
Eventos     → /events
Negócios    → /marketplace
Reel        → /reels
Ofertas     → /marketplace
Gerenciar   → /gerenciar
```

Confirmado visualmente: somente esses seis itens, nesta ordem.
Fecha após o clique. BottomNav e Create Hub intactos.

Não contém Pessoas, Conversas, Perfil, Configurações, Notificações,
Criar, Mapa, Home, Ajuda nem Compartilhar.

O cartão "Meu Connexy" no corpo de `/profile` permanece (não é o
menu Mais).

## 5. TESTES

```text
anteriores: 319 pass / 1818 assertions
novos: 5 (4 unitários + 1 CDP)
  tests/persist-phase-1f-13.test.ts (4)
  tests/persist-phase-1f-13-browser.test.ts (1)
total: 324 pass
assertions: 1891
failures: 0
```

+5 testes / +73 assertions em relação à 1F-12, só pelos testes
desta fase.

## 6. TYPECHECK

PASS (`bunx tsc --noEmit`).

## 7. BUILD

PASS (`bun run build`, nitro wrangler output).

## 8. LINT

PASS nos arquivos alterados desta fase.

## 9. BROWSER/CDP

CDP harness 1F-13: create dos quatro kinds + menu labels + reload +
`networkCalls = 0`.

Browser ao vivo:

- Menu Mais aberto em `/profile`.
- Navegação Locais, Eventos, Negócios/Ofertas (`/marketplace`),
  Reel, Gerenciar.
- Create Local / Negócio / Oferta com formulário real e
  "Salvar no catálogo local".
- Create Evento já confirmado na 1F-12 (Sarau ainda listado).
- Gerenciar: contagens "1 no catálogo local" + lista Catálogo local
  com Oferta, Negócio, Local e Evento.

## 10. NETWORK

CDP: `networkCalls = 0`.

CRUD do catálogo não chama `fetch` / axios / API. O browser ao vivo
carrega o bundle Vite local; isso não é rede de catálogo.

## 11. SUPABASE

`Supabase calls = 0`

## 12. REGRESSÕES

Nenhuma regressão encontrada.

## 13. LIMITAÇÕES

### Locais (MVP)

- Cadastro local/demo; copy honesta; sem catálogo compartilhado.
- Ofertas do menu Mais reutilizam `/marketplace` (não existe
  `/ofertas`). A oferta do usuário aparece no detalhe do negócio e
  em Gerenciar; o carrossel de promoções do marketplace continua
  fixture.
- Edit/Delete ausentes no store. Não foram criadas telas.
- Identidade da sessão ao vivo era `beatriz` (valor persistido em
  `connexy:demo:identity`); os testes usam `lucas` por default.

### P2 futuro

- Listagem dedicada de ofertas.
- Edição e exclusão de entidades de catálogo.
- Publicação remota / sincronização.

### BLOCKED

- Backend / Supabase / API.
- GPS / geolocalização remota.
- Checkout / pagamento.
- Repositories por tipo / IndexedDB de catálogo.
- CMS / permissões.

## 14. SOURCE OF TRUTH FINAL

```text
Identity
→ getDemoIdentity()

Profile
→ connexy:demo:own-profile

Posts
→ connexy:demo:posts

Catalog
→ connexy:demo:catalog

Messages
→ IndexedDB

Reels
→ IndexedDB

Saves
→ connexy:demo:saved-details

Trips
→ connexy_demo_trip
```

## Arquivos desta fase

- `src/lib/navigation/more-menu.ts` (novo)
- `src/routes/_app.profile.tsx` (menu Mais)
- `src/routes/_app.gerenciar.tsx` (lista Catálogo local)
- `src/lib/catalog/local-catalog.ts` (`catalogEntityLabel`)
- `tests/persist-phase-1f-13.test.ts`
- `tests/persist-phase-1f-13-browser.test.ts`
- `tests/fixtures/mvp-1f-13-browser.ts`

Create Hub permanece em `/create`. O menu Mais não duplica Criar
Evento/Local/Negócio/Oferta.
