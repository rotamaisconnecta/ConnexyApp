# Fase 1D-5 — Notifications / History / Settings

- **Data:** 2026-09-17
- **Status:** PASS
- **Escopo:** tornar funcionais, localmente, o inbox de notificações, o
  histórico geral e as configurações já consumidas pelo MVP, sem nova
  arquitetura e sem reabrir os P0 aprovados.
- **Supabase:** não acessado nem alterado.

## Auditoria

### Notifications

- **Fonte atual:** `/notificacoes` já listava `useDemoPendingRequests()` e
  abria `/solicitacao/$id?mode=receive`. `/notifications` misturava mocks,
  presença e convites de grupo. `NotificationRepository` e
  `use-notifications` falam com Supabase e permaneceram dormentes.
- **Estado:** convite social já era acionável; havia duas centrais; o sino
  `NotificationBell` não é usado na Home (o badge usa o mesmo
  `getPendingRequests`).
- **Persistência:** nenhuma store própria de notificação. O convite vive em
  `connexy:demo:db`.
- **Read/unread:** só existia em `useState` no `NotificationCenter`. Não foi
  implementado — exigiria chave nova.

### History

- **Fonte atual:** `/ride/history` e `/ride/history/$tripId` já liam
  `getHistorySnapshot()`. `/driver/history` e o painel “Meu Connexy”
  preenchiam a tela com corridas fictícias.
- **Decisão:** o histórico geral consome o histórico de Mobilidade
  existente. Não foi criado outro store.

### Settings

| Controle                         | Classe | Ação 1D-5                                      |
| -------------------------------- | ------ | ---------------------------------------------- |
| Presença / modo invisível        | A      | já persistia em `/privacidade`                 |
| Logout                           | A      | já encerrava a sessão demo                     |
| Modo motorista/passageiro        | A      | já persistia em `connexy_roles`                |
| Privacidade no `/profile`        | B      | passou a abrir `/privacidade`                  |
| Notificações no `/profile`       | B      | passou a abrir `/notificacoes`                 |
| Ver histórico (pagamentos)       | B      | passou a abrir `/ride/history`                 |
| Segurança, idioma, ajuda, 2FA    | D      | permanecem mock                                |
| Método padrão “Cartão”           | D      | fora do MVP (só Dinheiro/Pix na mobilidade)    |
| Som de Reels                     | D      | chave existente, mas sem controle em Settings  |

`connexy.presence.preference` e `connexy.presence.visibility` não são a
mesma preferência: a primeira é status online/invisível; a segunda é
visibilidade de check-in. Não foram fundidas.

## Fontes canônicas

- **NOTIFICATIONS:** `getPendingRequests()` e
  `getDemoGroupInvitesForUser()` em `src/lib/demo/demo-db.ts`, projetados
  por `src/lib/notifications/local-invite-inbox.ts`. Rota:
  `/notificacoes`. `/notifications` redireciona para essa rota.
- **HISTORY:** `getHistorySnapshot()` / `useTripHistory()`, chave
  `connexy_demo_trip`. Rotas: `/ride/history`, `/ride/history/$tripId` e
  `/driver/history`.
- **SETTINGS:** `src/lib/presence/presence-preference.ts`
  (`connexy.presence.preference`) e `src/lib/roles/roles-storage.ts`
  (`connexy_roles`).

## Implementação

- Inbox de convite continua sendo uma **projeção** do convite 1D-2. Aceitar
  ou recusar não cria segundo convite; a notificação some quando o pedido
  deixa de estar `pending`.
- Convites de grupo passaram a aparecer na mesma inbox, ainda derivados de
  `demo-db`.
- `/driver/history` deixou de inserir corridas falsas e passou a listar a
  Trip persistida, com estado vazio e detalhe existentes.
- Settings só ligou controles mortos a destinos já funcionais. Nenhuma
  chave nova foi criada.

## Persistência e reload

- Notificações de convite sobrevivem porque o pedido sobrevive em
  `connexy:demo:db`.
- Viagens concluídas sobrevivem no `history` de `connexy_demo_trip`.
- Presença e modo sobrevivem nas chaves já usadas por `/privacidade` e
  `ModeSwitcher`.
- Read/unread: **não implementado**.

## Testes

- `tests/persist-phase-1d-5.test.ts` e
  `tests/persist-phase-1d-5-browser.test.ts`.
- Focados: **8 testes / 98 assertions / 0 falhas**.
- Suíte: **245 testes / 941 assertions / 0 falhas**.
- Typecheck: PASS. Build: PASS.
- Lint focado: 0 erros. Lint global: baseline 498 problemas, não corrigido.

## Limitações

- Fixtures de catálogo em `/notificacoes` continuam visuais.
- Push, Firebase, realtime e `NotificationRepository` remoto continuam
  fora.
- Segurança, idioma, ajuda e cartão no sheet de Settings continuam mock.
- Não há histórico consolidado de conexões ou atividade de “Meu Connexy”.

## Arquivos alterados

- `src/lib/notifications/local-invite-inbox.ts`
- `src/lib/presence/presence-preference.ts`
- `src/providers/presence/presence-context.tsx`
- `src/hooks/use-user-presence-control.ts`
- `src/lib/roles/roles-storage.ts`
- `src/routes/_app.notificacoes.tsx`
- `src/routes/_app/notifications.tsx`
- `src/routes/_app.profile.tsx`
- `src/routes/_app.privacidade.tsx`
- `src/routes/_app/driver/history.tsx`
- `src/routes/_app/my-connexy.tsx`
- `tests/persist-phase-1d-5.test.ts`
- `tests/persist-phase-1d-5-browser.test.ts`
- `tests/fixtures/mvp-1d-5-browser.ts`
- `docs/audits/local-functional-mvp-baseline.md`
- `docs/audits/local-functional-mvp-1d-5.md`
