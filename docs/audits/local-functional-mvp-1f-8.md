# Fase 1F-8 — Tipos restantes do catálogo Create

- **Data:** 2026-09-19
- **Status:** PASS parcial. Momento ligado. Evento/local/oferta/negócio **BLOCKED**.
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-7 (299 testes / 1491 assertions).

## 1. Auditoria

### MOMENTO

- **Encontrado:** rota `/create/moment` com tela honesta. CTA de contexto
  “Compartilhar momento”. Aba Momentos do perfil próprio filtra
  `demoPosts` com `category === "MOMENT"`. `PostCategory.MOMENT` já existe
  em `/create-post`.
- **Arquivos:** `create/moment.tsx`, `create-post.tsx`, `demo-posts.ts`,
  `_app.perfil.index.tsx`, `lib/types/post.ts`.
- **Store/repository:** `saveDemoPost` / `connexy:demo:posts`.
- **Persistência:** a mesma de Foto/Vídeo/Texto (1F-3).
- **Estado atual (antes):** A — persistência reutilizável, rota desconectada.
- **Reutilização:** sim.

### EVENTO

- **Encontrado:** catálogo de leitura `listLocalEvents()` /
  `resolveLocalEventById` (`MOCK_EVENTS`, `HOME_EVENTS`, engine, locais
  categoria Eventos). Detalhe `/event/$id`. Sem escrita de usuário.
- **Live events:** `connexy_live_events` é anel de atividade (máx. 50),
  não catálogo de entidades.
- **Supabase:** `ProfileRepository` / MCP fora do escopo local.
- **Estado:** D — infraestrutura de cadastro inexistente.
- **Reutilização:** não, sem criar store nova.

### LOCAL

- **Encontrado:** `places` em `mock-data.ts`; `/locais` e `/local/$id`
  só leem o array. Sem overlay persistido.
- **Estado:** D.

### OFERTA

- **Encontrado:** `Promotion` no detalhe de negócio (`MOCK_PROMOTIONS`).
  Sem escrita de usuário.
- **Estado:** D.

### NEGÓCIO

- **Encontrado:** `getAllBusinesses()` / `MOCK_BUSINESSES`. Marketplace e
  `/business/$id` só leem o catálogo.
- **Estado:** D.

## 2. Classificação

| Tipo     | Infraestrutura              | Persistência              | Origem | Reutilizável? | Ação |
| -------- | --------------------------- | ------------------------- | ------ | ------------- | ---- |
| Momento  | `/create-post` + aba perfil | `connexy:demo:posts`      | 1F-3   | Sim           | Redirect com categoria MOMENT |
| Evento   | catálogo de leitura         | nenhuma de usuário        | mocks  | Não           | BLOCKED |
| Local    | `places[]`                  | nenhuma de usuário        | mocks  | Não           | BLOCKED |
| Oferta   | promoções do negócio        | nenhuma de usuário        | mocks  | Não           | BLOCKED |
| Negócio  | `MOCK_BUSINESSES`           | nenhuma de usuário        | mocks  | Não           | BLOCKED |

## 3. Decisão

Não criar EventRepository, PlaceRepository, OfferRepository,
BusinessRepository, chave `connexy:demo:events|places|moments` nem store
IndexedDB.

- **Momento:** menor ligação ao publicador já persistente.
- **Evento/local/oferta/negócio:** permanecem com a mensagem honesta da
  1F-3. Cadastro real exige persistência nova, fora desta fase.

Não mapear post `EVENT`/`PLACE`/`OFFER` para o catálogo: o formulário de
post não coleta data, capacidade, horário, desconto nem geolocalização.
Isso seria cadastro falso.

## 4. Implementação

```text
/create → Momento → /create/moment
                 → /create-post?category=MOMENT
                 → saveDemoPost
                 → connexy:demo:posts
                 → aba Momentos em /perfil
```

Evento/local/oferta/negócio continuam em `CreateTypeUnavailable`.

## 5. Arquivos

- `src/lib/create/create-hub-destinations.ts` — `CANONICAL_MOMENT_CATEGORY`
- `src/routes/_app/create/moment.tsx` — redirect canônico
- `src/routes/_app/create-post.tsx` — search `category=MOMENT`
- `src/components/post/create-post-form.tsx` — `initialCategory`
- `src/routes/_app/create.tsx` — item Momento no hub
- `tests/persist-phase-1f-8.test.ts`
- `tests/persist-phase-1f-8-browser.test.ts`
- `tests/fixtures/mvp-1f-8-browser.ts`
- `tests/persist-phase-1f-3.test.ts` — momento deixa de ser “indisponível”

## 6. Testes

Focados 1F-8: 4 testes. 1F-3 atualizado.

Suíte completa: **304 pass / 1558 assertions / 0 fail**.

Harness CDP: momento em `connexy:demo:posts`, reload, sem overlay em
evento/local/negócio, `networkCalls = 0`.

## 7. Validação

- Typecheck PASS
- Build PASS
- Lint dos arquivos alterados PASS
- Supabase não alterado
- 1D-1 … 1F-7 intactas
