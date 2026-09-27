# 1H-4 — Fechamento dos gaps funcionais locais restantes

- **Data:** 2026-09-23
- **Status:** PASS
- **Modo:** evolução mínima sobre fontes já auditadas (1H-3).
  Sem Supabase. Sem commit/push. Sem próxima fase automática.
- **Baseline anterior:** 1H-3 (`docs/audits/product-gap-final-1h-3.md`).

Quatro gaps locais, sem backend, GPS, mapas, pagamento, WebRTC ou IA.

---

## 1. Status

**PASS**

| Gap | Resultado |
| --- | --- |
| Fixar conversa | PASS |
| Ouvir / Confirmar / Retomar na lista | PASS |
| Remover paradas sugeridas | PASS |
| Persistência mínima de Settings | PASS |

---

## 2. O que foi auditado

Antes de implementar:

- Conversas: `StoredConversation` em IndexedDB `connexy-app-local-db`
  (`conversations` + `messages`), facade
  `local-chat-persistence.ts`, `ConversationRepository`, lista
  funcional `listFunctionalDemoConversations`. Campo `isPinned` existia
  só no mock; o caminho demo forçava `false`. Menu `...` da lista era
  no-op.
- Gestos: `nextGesture` + chips em `conversation-row` /
  `ContinueCard`. `CONFIRM` já resolvia com toast; `LISTEN`/`RESUME`
  abriam o thread. A lista funcional não preenchia `nextGesture`.
- Corrida: chips `STOP_SUGGESTIONS` em `RouteEditorPanel` (“Sua rota”).
  Origem/destino e `MapCanvas`/`RideMap` já existiam. Dispatcher e
  Trip não precisavam mudar.
- Settings: presença já em `connexy.presence.preference`. Sheets de
  Segurança / Pagamentos / Idioma só davam toast. Sem chave de
  preferências no namespace `connexy:demo:`.

---

## 3. Fonte de verdade utilizada

| Gap | Fonte |
| --- | --- |
| Pin / gestos | IndexedDB `connexy-app-local-db` store `conversations` |
| Identidade | `getDemoIdentity().id` |
| Settings | `connexy:demo:settings` (mapa por identidade) |
| Presença (já existia) | `connexy.presence.preference` — não migrada |
| Corrida | Mesmo `connexy_demo_trip` + `connexy_demo_dispatcher` |
| Menu Mais | `MORE_MENU_ITEMS` intacto |

Não foram criados `PinnedConversationRepository`,
`ConversationSettingsStore` nem banco/store IndexedDB novos.

---

## 4. O que foi implementado

### GAP 1 — Fixar conversa

Campo mínimo `pinnedByUserIds: string[]` em `StoredConversation`.
`setLocalConversationPinned` na facade existente. Lista e menu do
thread (`Fixar` / `Desafixar`). Isolamento: A fixa, B não herda.

### GAP 2 — Ações na lista

`deriveListGesture` sobre a última mensagem persistida:

- **Ouvir** — último recado de áudio (kind `audio` ou texto “áudio”);
- **Confirmar** — recado do outro com dica de horário/reunião;
- **Retomar** — recado antigo do outro (≥ 8 h).

Ação na lista **não navega**. Grava `gestureHandledAt` no mesmo
agregado. Chip só quando o gesto se aplica.

### GAP 3 — Paradas sugeridas

Removidos `STOP_SUGGESTIONS` e os chips mock de “Sua rota”. Origem,
destino, rota visual e “Adicionar parada” (ação do usuário)
permanecem. Dispatcher/Trip não alterados.

### GAP 4 — Settings

`src/lib/demo/demo-settings.ts`: `twoFactor`, `payment`, `language`
por `getDemoIdentity().id`. Sheets de Segurança / Pagamentos / Idioma
gravam e sobrevivem ao reload. Ajuda continua toast (sem estado).
Privacidade/Notificações continuam nas rotas já existentes.

---

## 5. O que não foi implementado

- 2FA real, cartão/gateway, i18n completo do app, push.
- MediaRecorder / playback real de áudio (Ouvir marca o gesto e
  toasta “Áudio reproduzido”).
- WebRTC, GPS, mapas, pagamento, IA, delivery, retirada.
- Bloquear contato (continua toast).
- Silenciar persistente (continua `useState` da sessão).
- Novo IndexedDB / repository / store de pin.

---

## 6. Persistência utilizada

```text
conversations.pinnedByUserIds     → IndexedDB connexy-app-local-db
conversations.gestureHandledAt    → IndexedDB connexy-app-local-db
connexy:demo:settings             → localStorage { [userId]: prefs }
connexy.presence.preference       → intacto
connexy_demo_trip                 → intacto
connexy_demo_dispatcher           → intacto
```

Kind `audio` adicionado a `StoredMessageKind` só para derivar Ouvir.
Sem store nova. Teste 1F-10 atualizado para incluir o valor no enum
(ainda sem WebRTC).

---

## 7. Testes

```bash
bun test
bunx tsc --noEmit
bun run build
```

```text
346 pass
0 fail
2087 expect() calls
Ran 346 tests across 52 files. [19.27s]
```

Antes da 1H-4: 335 / 2025 / 50 files.

Novos: `persist-phase-1h-4.test.ts`,
`persist-phase-1h-4-browser.test.ts` (reload real, `networkCalls = 0`).

**Typecheck:** PASS  
**Build:** PASS (nitro ✔)  
**Lint:** PASS nos arquivos tocados desta fase (`bunx eslint --fix`
prettier). Lint global permanece o baseline.

---

## 8. Regressão

Verificado por suíte + fonte + browser:

| Módulo | Resultado |
| --- | --- |
| Identity / Profile | Intactos |
| Conversations / Messages | Mesmo IndexedDB |
| Calls demo | 1F-10 PASS (enum audio só no kind) |
| Pulse / Perto de você / Reserva / Carona | Não tocados |
| Trip / Dispatcher | Chaves originais; 1F-9 PASS |
| Agora / Momento / Saves / Catalog | Não tocados |
| Menu Mais | Locais, Eventos, Negócios, Agora, Ofertas, Gerenciar |

Browser: `/profile` Menu Mais com os seis itens. Home/Create
inalterados nesta fase.

Live `/chat` estava bloqueado por **Modo Motorista + corrida
ativa** residual da auditoria 1H-3; pin/gestos cobertos pelo
harness CDP com IndexedDB real.

---

## 9. Rede

Harness 1H-4:

```text
networkCalls = 0
```

Supabase:

```text
0 chamadas
```

Sem API nova. Sem dependência npm nova.

---

## 10. Gaps restantes

### Produto local (ainda possível sem infra)

- Bloquear contato de verdade.
- Silenciar persistente (mesmo agregado `conversations`).
- Gravação de áudio (MediaRecorder) se Ouvir precisar de mídia real.

### Infraestrutura futura

- IA / modelo.
- WebRTC.
- GPS / mapas reais.
- Pagamentos (PIX/gateway).
- Backend / RLS / realtime.
- Delivery e retirada.

Não iniciar automaticamente a próxima fase. Não commit. Não push.
