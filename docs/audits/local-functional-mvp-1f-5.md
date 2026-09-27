# Fase 1F-5 — Social residual: Connecta, Conversas e Notificações

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-4 (276 testes / 1191 assertions).

## 1. Problema

A auditoria 1E classificou o núcleo social como FUNCIONAL, mas três
superfícies residuais ainda misturavam fixture com estado real:

1. `/connecta` — a aba Solicitações só mutava React; o filtro não tinha
   `onClick`.
2. `/chat` (Conversas) — a lista funcional era inicializada com
   `MOCK_CONVERSATIONS` e depois mesclava conexões persistidas.
3. `/notificacoes` — `listLocalInboxItems()` coexistia com o catálogo
   morto `notifications` de `mock-data.ts` (`n1`–`n4`).

## 2. Classificação

| Superfície | Código encontrado | Classificação | Comportamento final |
| --- | --- | --- | --- |
| Connecta Solicitações | `tab` sem render | D morto | Lista `getPendingRequests()` / `useDemoPendingRequests` |
| Connecta filtro | botão sem `onClick` | D morto | Online / perto de você, mesmo critério de 2000 m |
| Connecta Pessoas | catálogo `people` | B fixture aceitável | Preservado como descoberta |
| Conversas lista | `MOCK_CONVERSATIONS` + conexões | C mistura | Só conexões + grupos aceitos + IndexedDB |
| Conversas Solicitações | já usava demo-db | A funcional | Preservado; resolve também a identidade canônica |
| Inbox `/notificacoes` | inbox + `notifications` | C mistura | Somente `listLocalInboxItems()` |
| Fixture `notifications` | `mock-data.ts` | B catálogo | Arquivo preservado; fora da inbox funcional |
| `MOCK_CONVERSATIONS` | `mock-conversations.ts` | B catálogo | Módulo preservado; fora da lista funcional |

## 3. Alteração aplicada

- `/connecta` renderiza Solicitações a partir de `getPendingRequests()`.
  Aceitar/recusar continua em `/solicitacao/$id`. O filtro passa a
  restringir pessoas e solicitações.
- A lista de Conversas usa `listFunctionalDemoConversations()`, que lê
  `getConnectionsForUser`, `getDemoGroupsForUser` e
  `getLocalConversations()` (ConversationRepository via facade).
- `/notificacoes` remove o mapeamento do catálogo `n1`–`n4`. Viagens e
  Promoções mostram estado vazio honesto. Sem read/unread.
- `resolveDemoCatalogPerson()` inclui `currentUser` para o remetente
  Lucas, identidade canônica já validada na 1D-1.

Não foram criados stores, repositories nem chaves novas.

## 4. Persistência

Nenhuma nova persistência.

Fontes reutilizadas:

- `connexy:demo:db` — requests, connections, groups
- IndexedDB `connexy-app-local-db` — stores `conversations` e `messages`

## 5. Testes

Focados: `tests/persist-phase-1f-5.test.ts`,
`tests/persist-phase-1f-5-browser.test.ts`,
`tests/fixtures/mvp-1f-5-browser.ts`.

Suíte completa: **284 pass / 1293 assertions / 0 fail**.

## 6. Browser E2E

| Cenário | Resultado |
| --- | --- |
| `/chat` sem conexão | vazio honesto; sem “Encontrei um café novo” |
| `/connecta` Solicitações vazia | “Nenhuma solicitação agora.” |
| Filtro Perto de você | oculta Marina/Diego/João Pedro |
| Lucas envia convite a Beatriz | solicitacao send → enviada |
| Beatriz `/connecta` Solicitações | mostra Lucas + mensagem |
| `/notificacoes` | só o convite; sem Sunset/Café/Juliana |
| Viagens/Promoções | “Nenhuma notificação neste filtro.” |
| Aceitar | abre `/chat/demo-direct-beatriz--lucas` |
| Mensagem + voltar | lista só Lucas Almeida / Conexão local |
| Após aceite | inbox e Solicitações vazias |
| Harness CDP | `networkCalls === 0` |

## 7. Residual

- Ligar / vídeo / bloquear / mute no chat continuam toast.
- Read/unread não implementado.
- Pessoas em `/connecta` ainda é catálogo de descoberta (inclui a
  identidade corrente quando ela está em `people`).
- Ir juntos permanece o próximo P1 (`connexy:demo:outing-invites`).

## 8. Validação

- Typecheck PASS
- Build PASS
- Lint dos arquivos alterados PASS
- Browser/E2E PASS
- Supabase não alterado
- Ir juntos não alterado
