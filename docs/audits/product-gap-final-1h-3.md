# 1H-3 — Auditoria final de gaps do produto

- **Data:** 2026-09-23
- **Tipo:** auditoria somente leitura. Sem implementação. Sem commit/push.
- **Baseline anterior:** 1H-2 PASS (`docs/audits/local-functional-mvp-1h-2.md`).
- **Arquivos de produto alterados nesta fase:** 0
- **Arquivo criado:** este relatório.

1H-2 permanece intacta. Não foram tocados Connect Pulse, Perto de
você, Reserva, Carona Amiga, Catálogo, Agora, Momento, Conversas
(persistência), Identidade, Dispatcher nem Trip.

Classificação usada somente:

- 🟢 PASS
- 🟡 PARCIAL / DEMO
- 🔴 NÃO IMPLEMENTADO
- 🔵 DEPENDENTE DE INFRAESTRUTURA

Prioridade somente: **P1** · **P2** · **INFRA**. Sem ranking entre P1.

---

# 1. Resumo executivo

Se o desenvolvimento de funcionalidades novas parar hoje, o Connexy
já opera como **MVP local em modo demo** (`VITE_APP_DEMO_MODE=true`):
identidade canônica, perfil, conexões, conversas/mensagens persistidas,
Momento, Agora, catálogo, Home (Pulse + Perto de você), reserva
genérica, Carona Amiga, jornada de corrida visual e cadastro/financeiro
de motorista em UI local.

O que ainda falta se divide em três famílias objetivas:

1. **Produto ainda não implementado** no caminho funcional: fixar
   conversa; ouvir/confirmar/retornar sem abrir o thread; delivery;
   retirada.
2. **Parcial / demo:** assistente de texto pré-definido (não IA);
   menu `...` da conversa com itens mistos; configurações com persistência
   só em presença; chamadas overlay; mapa SVG; paradas sugeridas ainda
   visíveis; motorista mock; PIX/documentos como UI local.
3. **Infraestrutura:** modelo/API de IA, WebRTC, GPS/mapas reais,
   gateway de pagamento, backend/RLS/realtime, validação real de
   documentos.

Nenhuma chamada Supabase remota foi observada. Fontes de verdade
canônicas da 1H-2 continuam as mesmas.

---

# 2. Gaps auditados

## GAP 01 — IA para criação

**IA REAL:** não existe.

Não há cliente de modelo, SDK (`openai` / Anthropic / Gemini /
`@ai-sdk`), endpoint nem chave. `generate()` no assistente é
`setResult(suggestionFor(mode, input))`.

**O que existe:** FAB global `Assistente Connexy IA` em `_app.tsx`
(oculto em conversa/imersivo). Arquivo
`src/components/ai/connexy-ai-assistant.tsx`.

Modos: `media` (legenda), `invite` (convite), `conversations`
(próximo passo). São **templates** que interpolam o texto do
textarea.

| Caso | Existe IA real? | Onde | Modelo/API | Demo | Sem backend | Persiste |
| --- | --- | --- | --- | --- | --- | --- |
| Anúncio/oferta | Não | Create `/create/offer` sem assistente ligado ao form | — | Template global só | Template sim | Não (React state; copiar clipboard) |
| Local | Não | `/create/place` sem IA | — | idem | idem | Não |
| Negócio | Não | `/create/place-business` sem IA | — | idem | idem | Não |
| Conversa/mensagem | Não | Modo `conversations` / `invite` só sugere string | — | Template no FAB | Sim | Não |

Browser `/create`: abrir FAB → **Criar sugestão** → resultado
exato `Sugestão de legenda: “Um momento especial… quem topa
descobrir comigo?”`. Sem network de modelo.

**Estado:** 🟡 PARCIAL / DEMO (template). IA real = 🔵 INFRA.

---

## GAP 02 — Fixar conversa

Lista funcional (`listFunctionalDemoConversations`) grava
`isPinned: false` em todo item. Não há ação "Fixar", store, ordenação
por pin no caminho demo, persistência nem isolamento.

`conversations-screen` passa `onMenu={() => undefined}` (os três
pontos da **lista** não fazem nada). O catálogo `mock-conversations.ts`
ainda tem `isPinned` e sort — **não é a lista servida em demo**.

Ícone de pin em `conversation-row.tsx` só renderiza se `isPinned`
já viesse true; o caminho funcional nunca liga isso.

**Estado:** 🔴 NÃO IMPLEMENTADO. **Prioridade:** P1.

---

## GAP 03 — Menu de três pontos na conversa

Tela de thread: `ChatHeader` expõe `aria-label="Mais opções"`.
`ConnexyChatScreen` abre o menu.

Opções **efetivamente ligadas** (demo local):

| Opção | Efeito comprovado |
| --- | --- |
| Ver perfil / Meu perfil | Navega `/perfil/$id` ou `/profile` |
| Convidar (1:1, demo sem Supabase) | Abre `GroupInviteSheet` |
| Participantes (grupo) | Toast com nomes/status; sem tela de gestão |
| Sair do grupo | `leaveDemoGroup` + volta `/chat` |
| Videocall | Overlay de chamada **demo** (`beginDemoCall("video")`) |
| Silenciar / Ativar notificações | `useState(muted)` da sessão; toast; **não persiste** |

Opções **não funcionais**:

| Opção | Efeito |
| --- | --- |
| Bloquear | `toast.info("Bloqueio disponível em breve")` |
| Fixar | Ausente |

Header também tem Ligar / Videocall → mesmo overlay demo (GAP 06).

O `...` da **lista** de conversas não substitui este requisito
(handler vazio).

**Estado:** 🟡 PARCIAL / DEMO. **Prioridade:** P2.

---

## GAP 04 — Ações sem abrir a conversa

Labels existem em `GESTURE_LABELS`: Responder, Confirmar, Ouvir,
Ver evento, Retomar. A lista **funcional** não preenche
`nextGesture`. `continueItems` fica vazio.

`handleGesture`: só `CONFIRM` mostra toast "Horário confirmado"
sem abrir o thread; os demais chamam `openConversation`. No caminho
demo atual **CONFIRM nunca aparece**.

Browser `/chat`: nenhuma ação Ouvir / Confirmar / Retomar / Fixar
nos cards.

**Estado:** 🔴 NÃO IMPLEMENTADO (caminho funcional). **Prioridade:** P1.

---

## GAP 05 — Configurações

Rota `/profile`, título **Configurações**.

Estrutura objetiva: uma seção-card com 6 linhas
(ícone + título + descrição + chevron) + cards separados
"Torne-se um motorista" e "Meu Connexy" + "Sair da conta".
Padrão de linha é o mesmo nas 6 opções. Navegação responde.

| Opção | Destino | Persistência |
| --- | --- | --- |
| Privacidade | `/privacidade` | Presença: `connexy.presence.preference` |
| Notificações | `/notificacoes` | Inbox local (convites); **não** é tela de preferências |
| Segurança | sheet | `useState` + toast "atualizado"; some no reload |
| Pagamentos | sheet | Select com **"Cartão final 4821"** hardcoded; toast; sem método real |
| Idioma | sheet | `useState`; toast; sem i18n persistido |
| Ajuda | sheet | Toasts ("FAQ" / "suporte"); sem destino |

Problemas objetivos (não estéticos):

1. Segurança / Pagamentos / Idioma / Ajuda **não gravam** storage.
2. Pagamentos exibe cartão fictício.
3. `SettingsSheet` ainda contém UI de privacy/notifications que **não
   abre**, porque esses IDs navegam para rotas.
4. `/notificacoes` é caixa de entrada (`listLocalInboxItems`), não
   persistência de "o que receber".

**Estado:** 🟡 PARCIAL / DEMO. **Prioridade:** P2.

---

## GAP 06 — Chamadas (voz / vídeo)

### DEMO

Existe. `src/lib/chat/demo-call.ts`: sessão **in-memory**, recado
TEXT via `sendLocalMessage`, overlay aceitar/recusar/encerrar.
Mensagem canônica: `DEMO_CALL_FEEDBACK`. Header Ligar + Videocall.
Testes 1F-10 afirmam ausência de `RTCPeerConnection` / `getUserMedia`
no módulo de chamada.

Corrida: `CallModal` em `ride-overlays.tsx` — "Ligação simulada no
demo — nenhuma chamada real é feita."

`getUserMedia` no app existe só para **anexar câmera no chat** e
upload de cadastro, não para a chamada.

### REAL

```text
Demo = sim (overlay local + registro TEXT)
Real = não
```

Sem WebRTC, signaling, mídia de chamada, microfone/câmera da
ligação, conexão entre dois clientes, encerramento de peer.

**Estado:** 🟡 PARCIAL / DEMO. Real = 🔵 INFRA (WebRTC).

---

## GAP 07 — Detalhe de Local / Negócio (scroll no topo)

`resetGlobalShellScroll` em `_app.tsx` no `pathname`.
`routeOwnsScroll` **não** inclui `/local/` nem `/business/`
(`src/lib/shell/app-shell.ts`).

| Rota | scrollTop | h1 | Deep link | Reload |
| --- | --- | --- | --- | --- |
| `/local/cafe-central` | 0 | Café Central (hero acima, top=260.5) | sim | scrollTop 0 |
| `/business/b1` | 0 | Bistrô Paulista (top=12) | sim | primeira abertura já no topo |

O conteúdo começa no **topo da página** (cover/hero visível, não
meio da seção). CTA Reservar permanece (1H-2). "pedido" no negócio
é texto de cupom ("OFF no pedido acima de R$100"), não fluxo de
pedido.

**Estado Local:** 🟢 PASS.
**Estado Negócio:** 🟢 PASS.

---

## GAP 08 — Corrida: origem / destino / mapa

Jornada `/ride/request` (demo):

- Origem visível: **Sua localização** / **Bela Cintra, 750**
  (`DEMO_ORIGIN`).
- Destino visível após escolha: Casa → **Rua Harmonia, 340 —
  Vila Madalena** (`DEMO_DESTINATIONS`).
- Confirmação de pickup: **Confirme seu local de embarque** +
  chips Entrada principal / Portaria / Esquina / Ponto seguro +
  **Confirmar local**.
- Veículo + **Solicitar Connexy** + matching **Encontrando seu
  motorista**.
- Rota visual: `MapCanvas` (grade SVG + path animado). Não é
  Mapbox/Google/OSRM.
- Trip persiste `connexy_demo_trip`. Dispatcher config
  `connexy_demo_dispatcher`.

```text
visual/demo = sim
mapa/GPS real = não
```

**Mapa corrida:** 🟡 PARCIAL / DEMO + 🔵 GPS/Mapa.
**Origem/Destino:** 🟡 PARCIAL / DEMO (labels/fixtures; sem GPS).

---

## GAP 09 — Paradas sugeridas

**Ainda aparecem.** Requisito anterior de remover **não** foi
cumprido. Esta auditoria não corrige.

- **Tela:** `/ride/request` → após **Escolher destino** → painel
  **Sua rota**.
- **Chips:** `+ Padaria Bella Paulista`, `+ Shopping Cidade São
  Paulo`, `+ Praça Benedito Calixto`.
- Também existe **Adicionar parada**.
- **Dado:** mock `STOP_SUGGESTIONS` em
  `src/components/mobility/ride/ride-data.ts`.
- **Interfere:** sim — `onAddSuggestion` adiciona parada à rota
  do Trip (até 3).

**Estado:** 🟡 PARCIAL / DEMO (mock ainda no fluxo). **Prioridade:** P1.

---

## GAP 10 — Motorista encontrado

Após matching, painel live (`DriverPanel`):

| Campo | Existe? | Evidência ao vivo |
| --- | --- | --- |
| Foto do motorista | Sim | `https://i.pravatar.cc/200?img=68` alt "Foto de Marcos Oliveira" |
| Nome | Sim | Marcos Oliveira |
| Avaliação | Sim | 4.9 |
| Veículo | Sim | Honda City · branco |
| Foto do carro | Não | só texto + placa; sem URL de veículo |
| Identificação / placa | Sim | ABC1D23 |
| Verificado | Sim | "Motorista verificado (simulado)" |
| Dados da viagem | Sim | origem/destino no mapa; ETA "chega em 1 min" |
| Destaque do motorista | Sim | bloco foto+nome+placa |
| Código de embarque | Sim (estado chegou) | `boardingCode` 4281 |
| Ações | Sim | Mensagem, Ligar (modal demo), Segurança, Compartilhar, Cancelar corrida |

Fonte: `MOCK_DRIVER` / frota demo. Não é perfil remoto.

**Estado:** 🟡 PARCIAL / DEMO. **Prioridade:** P2.

---

## GAP 11 — Recebimento do motorista

| Mecanismo | UI | Processamento real |
| --- | --- | --- |
| Cadastrar QR | Não | Não |
| Cadastrar PIX | Display `/driver/finance` chave **ana@email.com** hardcoded | Não |
| Cadastrar conta bancária | Campo no tipo `DriverProfile`; sem tela de cadastro | Não |
| Receber pagamento | "Sacar via PIX" / "Extrato" **sem `onClick`** | Não |
| Verificar corrida realizada | Histórico mock `MOCK_ENTRIES` (Ana Silva, Carlos Souza) | Não |
| Confirmar pagamento | `DriverPaymentPanel`: `confirmDriverPayment()` no Trip local | Flag local, sem PIX/gateway |

`payment.ts`: "sem gateway, sem chave PIX cadastrada, sem QR.
O passageiro paga diretamente ao motorista."

Saldo ao vivo: R$ 542,30.

```text
UI = mock / flags locais
processamento real = não
```

**Estado:** 🟡 PARCIAL / DEMO. Real = 🔵 Pagamento.

---

## GAP 12 — Documentos do motorista

Área: `/driver/cadastro` (wizard 7 passos). Persistência
`connexy_driver_application_v1`.

| Documento | Cadastro | Upload real | Visualização do arquivo | Validade | Status | Atualização |
| --- | --- | --- | --- | --- | --- | --- |
| CNH | Sim (foto nome + número + categoria + validade date) | Não — só `files[0].name` | Mostra filename | Campo date local | draft/pending/approved local | Reabre o draft |
| CRLV | Sim (`vehicleDocumentName`) | Não (filename) | filename | Não específico | idem | idem |
| Comprovante de residência | Sim (`residenceProofName`) | Não | filename | Não | idem | idem |

Selfie obrigatória no passo de identidade; CNH/CRLV/residência
podem seguir vazios. Sem bytes, preview nem backend de análise
(copy: "equipe técnica"; demo auto-approve noutros pontos).

Browser: tela **Boas-vindas / 1 de 7** + **Começar cadastro**.

**Estado:** 🟡 PARCIAL / DEMO. Validação real = 🔵 Backend.

---

## GAP 13 — Delivery / Retirada

Busca por carrinho, checkout, endereço de entrega, método de
recebimento, status de pedido, delivery, retirada: **não há fluxo**.

Ofertas do catálogo e cupons de negócio **não** são pedidos.
Reserva 1H-2 **não** é delivery.

```text
produto → pedido → endereço → entrega     NÃO IMPLEMENTADO
produto → pedido → estabelecimento → retirada   NÃO IMPLEMENTADO
```

**Delivery:** 🔴 NÃO IMPLEMENTADO. Real = 🔵 Backend + GPS + Pagamento.
**Retirada:** 🔴 NÃO IMPLEMENTADO. Real = 🔵 Backend + Pagamento.

---

# 3. Matriz final

| Gap                      | Estado | Evidência | Local/Demo | Backend | GPS/Mapa | Pagamento | WebRTC/IA | Prioridade |
| ------------------------ | ------ | --------- | ---------- | ------- | -------- | --------- | --------- | ---------- |
| IA criação               | 🟡 PARCIAL / DEMO | FAB templates; sem modelo; create offer/place/business sem IA | Sim (string) | API de modelo | Não | Não | 🔵 modelo/API/custo/segurança | INFRA |
| Fixar conversa           | 🔴 NÃO IMPLEMENTADO | `isPinned: false`; sem ação; lista `onMenu` vazio | Não | Opcional depois | Não | Não | Não | P1 |
| Menu 3 pontos            | 🟡 PARCIAL / DEMO | Menu thread existe; bloquear toast; silenciar sessão; sem Fixar | Sim | Bloqueio real | Não | Não | Videocall demo | P2 |
| Ações sem abrir conversa | 🔴 NÃO IMPLEMENTADO | Functional list sem `nextGesture`; /chat sem Ouvir/Confirmar/Retomar | Não | Não para demo | Não | Não | Não | P1 |
| Configurações            | 🟡 PARCIAL / DEMO | Cards + nav; persistência só presença; sheets toast | Parcial | Conta/2FA real | Não | Cartão fake | Não | P2 |
| Chamadas                 | 🟡 PARCIAL / DEMO | Overlay + TEXT; CallModal corrida simulada | Sim | Signaling | Não | Não | 🔵 WebRTC | INFRA |
| Detalhe Local            | 🟢 PASS | `/local/cafe-central` scrollTop=0 deep link e reload | Sim | Não para o gap | Não | Não | Não | — |
| Detalhe Negócio          | 🟢 PASS | `/business/b1` scrollTop=0 | Sim | Não para o gap | Não | Não | Não | — |
| Mapa corrida             | 🟡 PARCIAL / DEMO | MapCanvas SVG; matching visual | Sim | Tracking | 🔵 mapa/GPS | Não | Não | INFRA |
| Origem/Destino           | 🟡 PARCIAL / DEMO | DEMO_ORIGIN + DEMO_DESTINATIONS visíveis | Sim | Não | 🔵 GPS real | Não | Não | INFRA |
| Paradas                  | 🟡 PARCIAL / DEMO | Chips STOP_SUGGESTIONS ainda em Sua rota; mock; alteram Trip | Sim | Não | Não | Não | Não | P1 |
| Motorista                | 🟡 PARCIAL / DEMO | Foto/nome/carro/placa/ETA/ações; sem foto do carro; mock | Sim | Perfil real | Tracking | Não | Ligar demo | P2 |
| Recebimento              | 🟡 PARCIAL / DEMO | PIX display + sacar sem handler; confirm Trip local | UI | Ledger | Não | 🔵 PIX/gateway | Não | INFRA |
| Documentos               | 🟡 PARCIAL / DEMO | Wizard CNH/CRLV/residência; só filename | Sim | 🔵 KYC | Não | Não | Não | INFRA |
| Delivery                 | 🔴 NÃO IMPLEMENTADO | Sem carrinho/pedido/endereço/entrega | Não | 🔵 | 🔵 | 🔵 | Não | INFRA |
| Retirada                 | 🔴 NÃO IMPLEMENTADO | Sem pedido/retirada no estabelecimento | Não | 🔵 | Não | 🔵 | Não | INFRA |

"—" = gap comprovado PASS; sem trabalho restante neste requisito.

---

# 4. O que já está resolvido

Comprovado em fases anteriores e **não reaberto** aqui, mais GAP 07:

- Identidade `getDemoIdentity()` e switcher demo.
- Perfil `connexy:demo:own-profile`.
- Social/conexões `connexy:demo:db`.
- Conversas/mensagens IndexedDB `connexy-app-local-db`.
- Momento `connexy:demo:posts`.
- Agora IndexedDB `connexy-reels-data-local-db` (+ mídia
  `connexy-reels-local-db`).
- Catálogo `connexy:demo:catalog`.
- Saves `connexy:demo:saved-details`.
- Connect Pulse vitrine sem links (1H-2).
- Perto de você 5 → +5 e Ver mais → `/locais` (1H-2).
- Reserva `connexy:demo:reservations` (1H-2).
- Carona Amiga `connexy:demo:carona`, fora do Dispatcher,
  Conversar / Ver ponto de encontro / Cancelar (1H-2).
- Trip `connexy_demo_trip` + Dispatcher `connexy_demo_dispatcher`.
- Jornada de corrida demo (origem/destino visíveis, pickup,
  matching, motorista overlay).
- Detalhe Local e Negócio abrem no topo da página (GAP 07).

---

# 5. O que é parcial/demo

- Assistente Connexy: templates, não modelo.
- Menu `...` do thread: mix de ações locais e placeholders.
- Configurações: cards e navegação; persistência incompleta.
- Chamadas voz/vídeo: overlay + recado TEXT.
- Mapa e origem/destino da corrida: SVG + fixtures.
- Paradas sugeridas: mock ainda no fluxo.
- Tela do motorista: UI completa sobre `MOCK_DRIVER` / pravatar.
- Financeiro motorista: saldo/PIX/histórico hardcoded.
- Documentos: wizard + filename em localStorage.
- Confirmação de pagamento da corrida: flag no Trip, sem money movement.

---

# 6. O que não está implementado

- IA real para oferta, local, negócio ou mensagem.
- Fixar / desafixar conversa (ação, ordem, persistência, isolamento).
- Ouvir / Confirmar / Retornar na lista funcional sem abrir o thread.
- Bloquear contato (toast apenas).
- WebRTC (signaling, mídia, dois usuários).
- GPS / mapa / rota / geofencing reais.
- Cadastro de QR, PIX ou conta pelo motorista com processamento.
- Upload real e validação de CNH/CRLV/comprovante.
- Delivery (carrinho → pedido → endereço → entrega).
- Retirada (carrinho → pedido → estabelecimento → pickup).

---

# 7. Dependências de backend

Exigem Supabase / API / banco remoto / RLS / realtime para deixar
de ser demo:

- Identidade e sessão reais.
- Perfil, conexões, conversas e mensagens multi-dispositivo.
- Catálogo, reservas e carona sincronizados entre usuários.
- Trip / dispatcher com frota real.
- Pin, mute, bloqueio e inbox se forem globais.
- Moderação / KYC de documentos.
- Pedidos de delivery/retirada.
- Presença e notificações push.

Esta auditoria **não** conectou nem alterou Supabase.

---

# 8. Dependências de GPS/mapas

- Origem real do passageiro.
- Destino geocodificado.
- Cálculo de rota e ETA reais.
- Tracking do motorista.
- Geofencing de embarque.
- Mapa de encontro da Carona Amiga (hoje label aproximado).
- Entrega com endereço.

Hoje: `MapCanvas` SVG + coordenadas fixture.

---

# 9. Dependências de pagamento

- PIX (chave cadastrada, QR, confirmação).
- Cartão / gateway.
- Split / comissão.
- Saque.
- Pagamento de pedido delivery/retirada.

Hoje: seletor PIX/dinheiro na corrida, flags `paymentConfirmed`,
tela financeiro mock.

---

# 10. Dependências de WebRTC

- Signaling (oferta/resposta/ICE).
- Mídia (áudio/vídeo).
- Permissão de microfone e câmera **da chamada**.
- Conexão entre dois clientes.
- Encerramento e reconexão.

Hoje: `demo-call.ts` in-memory + `CallModal` "Chamando…".

---

# 11. Dependências de IA

- Modelo e provedor.
- API e autenticação.
- Controle de custo.
- Contexto (anúncio/local/negócio/thread).
- Segurança / revisão humana antes de publicar.

Hoje: `suggestionFor()` com três strings.

---

# 12. Source of Truth

Confirmado no código atual. Nenhuma fonte da lista 1H-3 foi
substituída. Extras registrados, **não corrigidos**.

| Domínio | Fonte confirmada |
| --- | --- |
| Identity | `getDemoIdentity()`; storage `connexy:demo:identity` |
| Profile | `connexy:demo:own-profile` |
| Social | `connexy:demo:db` |
| Conversations/Messages | IndexedDB `connexy-app-local-db` |
| Momento | `connexy:demo:posts` |
| Agora | IndexedDB `connexy-reels-data-local-db` |
| Saves | `connexy:demo:saved-details` |
| Catalog | `connexy:demo:catalog` |
| Reservations | `connexy:demo:reservations` |
| Carona | `connexy:demo:carona` |
| Trip | `connexy_demo_trip` |
| Dispatcher | `connexy_demo_dispatcher` (runtime em memória; hidrata do Trip) |

**Extras (já existentes, fora da lista mínima):**

- Outing: `connexy:demo:outing-invites`
- Auth demo: `connexy:demo:auth` (via `demoStorageKey`)
- Reels mídia: IndexedDB `connexy-reels-local-db`
- Presença: `connexy.presence.preference`
- Cadastro motorista: `connexy_driver_application_v1`
- Ride blocks: `connexy_demo_ride_blocks`
- Promoções resgatadas: `connexy:demo:redeemed-promotions`
- Reviews: `connexy:demo:recent-reviews:*`

Dispatcher **não** é a fonte da Carona Amiga.

---

# 13. Testes

```bash
bun test
```

```text
335 pass
0 fail
2025 expect() calls
Ran 335 tests across 50 files. [27.82s]
```

Nenhum teste criado ou alterado nesta fase. Nenhum código
ajustado para fazer testes passarem.

---

# 14. Typecheck

```bash
bunx tsc --noEmit
```

**PASS** (exit 0).

---

# 15. Build

```bash
bun run build
```

**PASS** (`✓ built in 2.67s`, nitro ✔).

---

# 16. Lint

Padrão atual (1H-2): `bunx eslint` só nos arquivos de produto
tocados.

**N/A** — FILES CHANGED de produto = 0. Lint global não foi
limpo (baseline preexistente). O único arquivo novo é este
Markdown.

---

# 17. Browser/CDP

Vite `:8080`, `VITE_APP_DEMO_MODE=true` (pid 36896).

| Rota | Ação | Resultado |
| --- | --- | --- |
| `/chat` | Inspecionar lista | Sem Ouvir/Confirmar/Retomar/Fixar |
| `/chat/demo-direct-beatriz--lucas` | Menu `...` | Ver perfil, Convidar, Videocall, Silenciar, Bloquear (toast) |
| `/profile` | Ler Configurações | 6 linhas em um card + motorista + Meu Connexy + Sair |
| `/create` | FAB IA → Criar sugestão | Template de legenda; sem API |
| `/local/cafe-central` | Deep link + reload | scrollTop=0, h1 Café Central |
| `/business/b1` | Deep link | scrollTop=0, h1 Bistrô Paulista; Reservar; cupom "pedido" |
| `/ride/request` | Casa → Escolher destino | Origem Bela Cintra; destino Harmonia; chips de parada |
| `/ride/request` | Confirmar local → Solicitar | Matching → Marcos Oliveira, Honda City, ABC1D23 |
| `/driver/cadastro` | Abrir | Wizard 1 de 7, Começar cadastro |
| `/driver/finance` | Abrir | R$ 542,30, PIX ana@email.com, Sacar sem handler |

Console: sem erro de aplicação atribuído aos gaps (toasts
intencionais em Bloquear / sheets). Network detalhado na §18.

---

# 18. Network

Harness das fases anteriores (1H-2):

```text
networkCalls = 0
```

Nesta auditoria **não** houve `fetch` de produto para API Connexy
nem `/rest/v1/`.

Hits externos observados (assets, **não** backend):

| Origem | Arquivo | Destino | Motivo |
| --- | --- | --- | --- |
| CSS app | fonts no documento | `fonts.googleapis.com` / `fonts.gstatic.com` | Space Grotesk / Inter |
| Tela motorista | `ride-data.ts` `MOCK_DRIVER.photo` | `https://i.pravatar.cc/200?img=68` | Avatar mock |
| Vários fixtures | catálogo/home/reels | `images.unsplash.com` (quando a tela pede cover) | Imagem demo |

Módulos Vite `src/lib/supabase/*.ts` e
`node_modules/.vite/deps/@supabase_ssr.js` são **scripts locais**.
Não são round-trip remoto.

Não corrigido.

---

# 19. Supabase

```text
0 chamadas
```

Sem login, link, SQL, migration, bucket ou realtime remoto.
`isPublicSupabaseConfigured()` permanece falso no demo local.

---

# 20. Regressões

Nenhum arquivo de produto foi modificado. Superfícies 1H-2
permanecem:

| Módulo | Resultado |
| --- | --- |
| Identity | Intacta |
| Profile | Intacta |
| Conversas / Messages | Intactas (IndexedDB) |
| Agora / Momento / Saves / Catalog | Intactos |
| Pulse / Perto de você | Não tocados |
| Reserva / Carona | Não tocados |
| Trip / Dispatcher | Não tocados |
| Testes 335 / 2025 | Estáveis |

---

# 21. Mapa final de gaps

## 🟢 JÁ RESOLVIDO

- Identidade, perfil, conexões, chat persistido, Momento, Agora,
  catálogo, saves.
- Connect Pulse (vitrine sem links).
- Perto de você (5 → +5, Ver mais).
- Reserva local.
- Carona Amiga (oferta, aceite, conversa, ponto de encontro,
  cancelar).
- Detalhe de Local começa no topo.
- Detalhe de Negócio começa no topo.
- Jornada de corrida **demo** com origem, destino, pickup,
  matching e painel de motorista visíveis.

## 🟡 PARCIAL / DEMO

- Assistente de criação (template, não IA).
- Menu `...` da conversa (existe; incompleto).
- Configurações (cards/nav; persistência limitada).
- Chamadas (overlay demo).
- Mapa / origem / destino da corrida (visual, fixtures).
- Paradas sugeridas **ainda no fluxo**.
- Tela "motorista encontrado" (mock; sem foto do carro).
- Recebimento do motorista (UI + flags locais).
- Documentos do motorista (filename + wizard).

## 🔴 AINDA NÃO IMPLEMENTADO

- Fixar conversa (ação + persistência + isolamento).
- Ouvir / Confirmar / Retornar sem abrir o thread (lista funcional).
- Delivery (pedido + endereço + entrega).
- Retirada (pedido + pickup no estabelecimento).
- IA real nos fluxos de oferta / local / negócio / mensagem.
- WebRTC real.
- GPS / mapa / rota reais.
- Pagamento real (PIX/cartão/gateway/saque).
- KYC real de documentos.

## 🔵 DEPENDE DE INFRAESTRUTURA

- **IA:** modelo, API, custo, contexto, segurança.
- **WebRTC:** signaling, mídia, mic/câmera da chamada.
- **GPS / mapas:** localização, tracking, rota, geofence.
- **Pagamentos:** PIX, cartão, gateway, split, confirmação.
- **Backend:** Supabase/API/RLS/realtime para qualquer domínio
  deixar o localStorage/IndexedDB.
- Delivery/retirada reais também caem nesta família (pedido +
  pagamento +, no delivery, logística).

---

## O que o Connexy já consegue fazer hoje

Um usuário demo consegue: entrar sem backend; trocar identidade
local; publicar no catálogo; ver Pulse e Perto de você; reservar;
oferecer/solicitar/aceitar Carona Amiga e conversar; persistir
chat; publicar Momento e Agora; percorrer uma corrida visual até
o motorista mock; abrir Local/Negócio no topo da página; rascunhar
cadastro de motorista.

## Blocos que ainda precisam ser desenvolvidos

Produto (podem existir primeiro como demo local, se a decisão for
essa): pin de conversa; gestos da lista; remover paradas
sugeridas; persistir o restante de Configurações; completar menu
da conversa (bloquear de verdade); opcionalmente ligar o
assistente aos forms de create.

Infraestrutura (não são features isoladas): IA, WebRTC, GPS/mapas,
pagamentos, backend, delivery/retirada reais, KYC.

## Frentes tecnicamente disponíveis para a próxima decisão

Sem escolher a próxima fase:

1. **Produto conversas** — Fixar; gestos Ouvir/Confirmar/Retomar na
   lista funcional; bloquear de verdade no menu `...`.
2. **Produto corrida (polimento local)** — remover
   `STOP_SUGGESTIONS`; foto do veículo se a fonte mock existir.
3. **Produto configurações** — persistir Segurança/Idioma; separar
   inbox de preferências de notificação; retirar cartão fictício
   ou marcá-lo explicitamente como demo.
4. **Infra IA** — só com provedor, custo e revisão humana.
5. **Infra WebRTC** — signaling + mídia.
6. **Infra GPS/mapas** — substituir MapCanvas.
7. **Infra pagamentos** — PIX/gateway; cadastro de chave; saque.
8. **Infra backend** — substituir as chaves `connexy:demo:*` e os
   IndexedDB por repositórios remotos.
9. **Comércio** — Delivery e Retirada (produto + backend +
   pagamento; delivery também GPS).

Não iniciar automaticamente a próxima fase. Não commit. Não push.
