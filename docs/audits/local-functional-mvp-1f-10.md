# Fase 1F-10 — Chamada de voz/vídeo no Chat

- **Data:** 2026-09-19
- **Status:** PASS (fluxo local/demo). WebRTC/signaling real **BLOCKED**.
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-9 (310 testes / 1632 assertions).

## 1. Achados

### VOZ

```text
arquivos:
  src/lib/chat/demo-call.ts
  src/components/chat/chat-header.tsx (aria-label Ligar)
  src/components/chat/ConnexyChatScreen.tsx
  src/components/chat/demo-call-overlay.tsx
  tests/phase-1a-chat-call.test.ts
componentes:
  ChatHeader onCall; DemoCallOverlay (media=voice)
hooks:
  useSyncExternalStore(subscribeDemoCall) na tela de chat
store/repository:
  nenhum CallRepository; MessageRepository / sendLocalMessage
persistência:
  registro final = mensagem TEXT na conversa (IndexedDB messages)
estado:
  sessão em memória outgoing|connected; desfechos ended|declined|missed
```

Antes desta fase: toast honesto `DEMO_CALL_FEEDBACK` (1A). Sem
`RTCPeerConnection`, sem signaling, sem tipo `call`.

### VÍDEO

```text
arquivos:
  os mesmos de voz (media=video)
  menu Videocall em ConnexyChatScreen
componentes:
  ChatHeader onVideoCall; DemoCallOverlay (media=video)
hooks:
  o mesmo subscribeDemoCall
store/repository:
  o mesmo MessageRepository
persistência:
  "Videochamada (demo) · encerrada|recusada|perdida"
estado:
  idêntico ao de voz, com rótulo de vídeo
```

Antes: toast `"Videocall em breve"`. `getUserMedia` no chat existe só
para anexo de câmera (foto), não para chamada. Ride `CallModal` é SOS
de mobilidade, fora de escopo.

### CHAT

```text
infraestrutura existente:
  ConnexyChatScreen, use-chat, demo-db, local-chat-persistence,
  ConversationRepository, MessageRepository
persistência:
  IndexedDB connexy-app-local-db stores conversations + messages
message types:
  StoredMessageKind: text|event|location|image|video
  UI MessageKind: + audio|file
  nenhum call / call_started / missed_call
identidade:
  conversationId da conexão 1D-2
  callerId / calleeId = getDemoIdentity().id e participant.id
```

## 2. Classificação

| Comportamento | Estado anterior | Infraestrutura | Persistência | Ação |
| ------------- | --------------- | -------------- | ------------ | ---- |
| Voz           | C (toast 1A)    | Chat + `sendLocalMessage` | IndexedDB `messages` | Reutilizar TEXT + overlay demo |
| Vídeo         | C (toast “em breve”) | a mesma | a mesma | Reutilizar TEXT + overlay demo |

WebRTC / `RTCPeerConnection` / STUN / TURN / signaling: **D — inexistente**.
Não foi inventado.

## 3. Plano

```text
src/lib/chat/demo-call.ts
  → sessão em memória + desfecho via sendLocalMessage
  → motivo: sem CallStore, sem kind novo, 1A permanece honesta
src/components/chat/demo-call-overlay.tsx
  → UI outgoing/connected com aviso DEMO_CALL_FEEDBACK
src/components/chat/ConnexyChatScreen.tsx
  → Ligar/Videocall 1:1 iniciam o fluxo; grupos mantêm toast
tests/persist-phase-1f-10.test.ts
tests/persist-phase-1f-10-browser.test.ts
tests/fixtures/mvp-1f-10-browser.ts
  → voz, vídeo, conversa, reload, networkCalls=0
```

NÃO CRIAR NOVA INFRAESTRUTURA (repository, IndexedDB store, chave
localStorage, tipo de mensagem, identidade).

## 4. Implementação

- `demo-call.ts`: `startDemoCall` / `connectDemoCall` / `finishDemoCall` /
  `missDemoCall`. IDs canônicos. Sessão não é serializada.
- Overlay demo cobre a conversa 1:1. “Simular atendimento” ≠ chamada
  recebida de outro dispositivo.
- Encerrar em `outgoing` → `declined`. Encerrar em `connected` → `ended`.
  Perdida só via `missDemoCall` (sem timeout de UI).
- Histórico: `Ligação de voz (demo) · …` / `Videochamada (demo) · …`.
- Grupos e Supabase configurado: `triggerDemoCallFeedback`.
- Reload: sessão some; registros TEXT permanecem. Chamada ao vivo não
  é reconstruída.

## 5. Testes

```text
focados: 5 (4 unitários + 1 CDP)
suíte completa: 315 pass
assertions: 1709
falhas: 0
typecheck: PASS (bunx tsc --noEmit)
build: PASS
lint: PASS nos arquivos alterados
CDP: PASS
networkCalls: 0
```

1A (`phase-1a-chat-call.test.ts`) continua PASS. 1D-2 / 1F-5 cobertos
pela suíte.

## 6. Regressões

Nenhuma. 1A–1E e 1F-1…1F-9 permanecem PASS. Schema de chat, Trip,
dispatcher, Reels e identidade não foram alterados.

## 7. Limitações

```text
PASS
  Voz 1:1 local/demo (iniciar, simular atendimento, recusar, perder, encerrar, histórico, reload do desfecho)
  Vídeo 1:1 local/demo (o mesmo fluxo, sem câmera/microfone)
  Vínculo à conversa existente por conversationId / callerId / calleeId

BLOCKED
  WebRTC, signaling, STUN/TURN, mídia real entre usuários
  Chamada recebida em outro dispositivo / outra identidade
  Persistência da sessão ao vivo após reload
  Chamadas em grupo
```

Não afirmar que existe comunicação real de áudio/vídeo.

## 8. Documentação

- `docs/audits/local-functional-mvp-1f-10.md` (este arquivo)
- `docs/audits/local-functional-mvp-baseline.md`
