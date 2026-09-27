# Fase 1F-6 — Ir juntos: aceite local e habilitação da corrida

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-5 (284 testes / 1293 assertions).

## 1. Problema

A 1F-1 gravava o convite de “Ir juntos” em `connexy:demo:outing-invites`
com `status: "pending"`, mas o aceite era só React (`setAccepted`) e a
corrida nunca era habilitada. Pessoa B não recebia o convite na inbox
funcional da 1F-5.

## 2. Auditoria

Fonte única já existente: `localStorage` `connexy:demo:outing-invites`.

Formato anterior:

```json
{
  "id": "outing-<timestamp>-<personId>",
  "targetId": "...",
  "personId": "<destinatário>",
  "message": "...",
  "status": "pending",
  "createdAt": 0
}
```

Não havia `fromUserId`, snapshot do destino, parada do convidado nem
`accepted`/`declined`. A UI do remetente marcava todos como Pendente em
memória. `listLocalInboxItems()` projetava só friend requests e group
invites. `/ride/request?source=invite` e `RideFlow`/`createTrip` já
existiam.

## 3. Solução aplicada

A chave permanece `connexy:demo:outing-invites`. Extensão mínima:

- `fromUserId`
- `status`: `pending` | `accepted` | `declined` (legado sem status = `pending`)
- snapshot de destino e parada
- `respondedAt`

`sendOutingInvite` é idempotente para o mesmo par remetente/destinatário/alvo
pendente. `respondToOutingInvite` só aceita o destinatário, recusa o
remetente e estranhos, e é idempotente em estado terminal.

A inbox funcional passa a projetar outing invites recebidos. Pessoa B
aceita/recusa em `/notificacoes`. Pessoa A vê “Convite aceito / Corrida
disponível” só após o aceite e navega para `/ride/request` com o search
já existente (`source: "invite"`). `createTrip` continua dentro de
`RideFlow` (`seedInitial`). Não há Trip no aceite.

O teto de 3 convidados da UI atual foi preservado. Os testes focam A→B.

## 4. Persistência

Nenhuma chave nova.

- Convites: `connexy:demo:outing-invites`
- Corrida: `connexy_demo_trip` (Trip store existente, só após o CTA)
- Inbox: projeção, sem store próprio
- Identidade: `getDemoIdentity()` / `setDemoIdentity()`

## 5. Testes

Focados: `tests/persist-phase-1f-6.test.ts`,
`tests/persist-phase-1f-6-browser.test.ts`,
`tests/fixtures/mvp-1f-6-browser.ts`.

- 10 testes / 122 assertions nos arquivos da fase
- Suíte completa: **294 pass / 1415 assertions / 0 fail**

## 6. Browser E2E

Harness CDP (mesmo padrão 1F-5):

| Cenário | Resultado |
| --- | --- |
| Lucas envia outing para Beatriz | persistido em `connexy:demo:outing-invites`, pending |
| Inbox de Lucas | vazia para outing |
| Inbox de Beatriz | `outing_invite` real |
| Beatriz aceita duas vezes | um registro `accepted` |
| Rafael tenta recusar | permanece `accepted` |
| Lucas abre corrida duas vezes | um `createTrip`, `source: "invite"`, `companionLabel: "Ir juntos"` |
| Reload | convite aceito + mesma Trip |
| Recusa | `declined`, corrida indisponível, Trip nula |
| Friend request | continua na inbox; n1–n4 ausentes |
| `networkCalls` | 0 |

O browser embutido do Cursor não alcançou `localhost:8080`. O harness CDP
já exercita persistência, troca de identidade, aceite, recusa e Trip.

## 7. Residual

- Read/unread de notificações não implementado.
- Matching remoto, GPS real, pagamento online e QR fora de escopo.
- Dispatcher continua em memória.
- Seguir/guardar/conectar em Reels permanecem P1.
- Ligar/vídeo/bloquear no chat continuam toast.
- Cadastro persistido de negócio/evento/local/oferta continua indisponível.

## 8. Validação

- Typecheck PASS
- Build PASS
- Lint dos arquivos alterados PASS
- Lint global: 499 problemas (479 erros e 20 warnings) — baseline
  preexistente (1F-5 era 498/478/20); não corrigido
- Browser/E2E harness PASS
- Supabase não alterado
- 1D-1 … 1F-5 intactas
