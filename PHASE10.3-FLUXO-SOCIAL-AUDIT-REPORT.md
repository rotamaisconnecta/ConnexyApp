# Phase 10.3 — Relatório Final: Auditoria do Fluxo Social (Home → Perfil → Convite → Solicitação → Chat)

**Projeto:** ConnexyApp
**Data:** 07/08/2026
**Viewports testados:** 390×844 e 320×700 (dropdown)
**Método:** Puppeteer (chromium real) + inspeção de código; verificações `tsc`, `build` e ESLint
**Constraints:** sem novas telas/features, sem conexão com Supabase/banco, sem edição de `routeTree.gen.ts`, sem novas dependências, sem git ops

---

## Resumo Executivo

O fluxo social completo foi auditado por automação Puppeteer com sessão autenticada fake e
estado mock em `localStorage`. **49 verificações de fluxo passaram** (38 + 11) e o dropdown de
notificações em 320px ficou dentro da tela. Foram encontrados e corrigidos **5 problemas comprovados**,
sendo 1 deles um erro de tipagem que quebrava o build (`tsc`).

| # | Bug | Causa raiz | Correção | Verificação |
|---|-----|-----------|----------|-------------|
| 1 | Perfil continua "Convidar para conversar" após aceitar convite | `getConversationInviteStatus` descartava o status `connected` vindo do storage | aceitar `connected` no retorno | `B12`, `C1`, `B13` |
| 2 | Voltar do chat retorna à rota anterior (perfil/solicitação), não à lista `/chat` | `handleBack` usava `history.back()` | navegar direto para `/chat` | `X5`, `B7` |
| 3 | Footer do perfil com `from=solicitacao` em modo send mostrava "Aceitar conversa" | footer não respeitava o status do convite | footer reage a `invited/connected/rejected/available` | `S3` |
| 4 | "Aceitar conversa" pelo footer do perfil não gravava `connected` | navegava direto ao chat sem `writeStoredInvite` | gravar `connected` antes de navegar | `S5`, `S6` |
| 5 | Dropdown de notificações estourava a tela em 320px | `w-80` fixo, âncora `right-0` | `max-w-[calc(100vw-2.25rem)]` | bell-test |
| 6 | `not-found.tsx` com erro TS2322 | `fallbackTo: string` incompatível com `FallbackRoute` | exportar e tipar como `FallbackRoute` | `tsc --noEmit` = 0 erros |

---

## Cobertura dos Testes Automatizados

### Flow A — Enviar convite (F1–F19, 19/19 PASS)
- Home carrega; card de Carlos abrível → perfil público com "Convidar para conversar".
- "Convidar" → `/solicitacao/carlos?mode=send` com "Agora não"/"Enviar convite".
- "Agora não" volta ao perfil sem alterar estado (`{}`).
- "Enviar convite" → volta ao perfil, estado `invited`, botão vira "Convite enviado".
- Reabrir solicitação não mostra mais botão de envio; mostra "Aguardando uma resposta".
- Estado persiste após `reload`; perfil mantém "Convite enviado".

### Flow B — Receber convite (B1–B13, 13/13 PASS)
- `/solicitacao/marina?mode=receive` mostra "Aceitar conversa"/"Recusar".
- Aceitar → `/chat/marina`, estado `connected`, header correto.
- Enviar mensagem aparece no chat.
- **Voltar → lista `/chat`** com a conversa visível; reabre e reload funcionam.
- Perfil de Marina mostra "Abrir conversa" e navega ao chat correto (bug #1 corrigido).

### Flow S — Perfil vindo da solicitação (S1–S6, 6/6 PASS)
- Preview da bio clicável; perfil abre com `from=solicitacao`.
- Modo send: footer mostra "Convite enviado" e **não** "Aceitar conversa" (bug #3).
- Modo receive: footer mostra "Aceitar conversa" + "Voltar".
- Aceitar pelo perfil grava `connected` e abre o chat (bug #4).

### Flow X — Canal connected (X1–X11, 11/11 PASS)
- Beatriz (MOCK_CONNECTED) → perfil "Abrir conversa" → chat abre, envia mensagem.
- Voltar → `/chat` (bug #2), Beatriz visível na lista, linha clicável, reabre, voltar de novo → `/chat`.
- Home mostra status corretos por card.

### Bell / Notificações (320×700)
- Dropdown abre; **totalmente dentro da tela** após correção (`left:3 right:287 w:284` em 320px).
- `/notificacoes` renderiza com abas e itens (ex.: "Juliana aceitou sua solicitação de chat").
- Sem overflow horizontal (`scrollWidth == innerWidth == 320`).

---

## Bugs Comprovados — Detalhes e Correções

### 1. `getConversationInviteStatus` descartava `connected` persistido
- **Onde:** `src/lib/chat/mock-conversation-invites.ts:52-53`
- **Prova:** gravar `marina: "connected"` no storage e abrir `/perfil/marina` mostrava "Convidar para
  conversar" (esperado "Abrir conversa").
- **Correção:** aceitar `connected` junto de `invited/rejected` vindo do storage.

### 2. Voltar do chat ia para a rota anterior
- **Onde:** `src/components/chat/ConnexyChatScreen.tsx:183-189`
- **Prova:** `perfil/beatriz → chat → Voltar` resultava em `/perfil/beatriz` (X5 FAIL), e
  `solicitacao → chat → Voltar` em `/solicitacao/marina`, nunca na lista `/chat`.
- **Correção:** `handleBack` navega sempre para `/chat` (spec item: "voltar deve retornar para a lista
  de conversas /chat").

### 3. Footer do perfil (`from=solicitacao`) ignorava o status do convite
- **Onde:** `src/routes/_app.perfil.$id.tsx:326-344`
- **Prova:** modo send (invited) mostrava "Aceitar conversa" (S3 FAIL).
- **Correção:** footer condicional por status — `invited` → "Convite enviado"; `connected` →
  "Abrir conversa"; `rejected` → "Enviar novo convite" (mode send); senão → "Aceitar conversa".

### 4. "Aceitar conversa" do perfil não gravava conexão
- **Onde:** `src/routes/_app.perfil.$id.tsx:335-340` (antes)
- **Prova:** aceitar pelo perfil abria `/chat/marina` mas `localStorage` continuava `null`.
- **Correção:** `writeStoredInvite(p.id, "connected")` antes de navegar.

### 5. Dropdown de notificações fora da tela em 320px
- **Onde:** `src/components/notifications/NotificationBell.tsx:166`
- **Prova:** `w:320, left:-33, right:287` (extrapola em 33px).
- **Correção:** `max-w-[calc(100vw-2.25rem)]` (280px na prática) → `left:3 right:287` (dentro).

### 6. Erro de tipo `TS2322` em `not-found.tsx`
- **Onde:** `src/components/navigation/not-found.tsx:24` + `back-button.tsx`
- **Prova:** `npx tsc --noEmit` apontava `Type 'string' is not assignable to type 'FallbackRoute'`.
- **Correção:** exportar `FallbackRoute` de `back-button.tsx` e tipar `fallbackTo` no componente.

---

## Verificações de Qualidade

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 erros |
| `npm run build` | ✅ build ok (1.93s) |
| ESLint (6 arquivos alterados) | ✅ sem erros |
| flow-test (38 checks) | ✅ 38 PASS / 0 FAIL |
| flow3-test (11 checks) | ✅ 11 PASS / 0 FAIL |
| bell-test (dropdown 320px) | ✅ dentro da tela, sem overflow |

## Arquivos Alterados

- `src/lib/chat/mock-conversation-invites.ts` (bug #1)
- `src/components/chat/ConnexyChatScreen.tsx` (bug #2)
- `src/routes/_app.perfil.$id.tsx` (bugs #3 e #4)
- `src/components/notifications/NotificationBell.tsx` (bug #5)
- `src/components/navigation/back-button.tsx` + `src/components/navigation/not-found.tsx` (bug #6)

## Observações (não corrigidas — fora do escopo)

- Mensagens do chat são geradas por `buildMockMessages()` a cada montagem e não persistem entre
  navegações (o spec pede apenas reabrir a conversa; sem exigência de histórico persistido).
- Aceitar em modo receive não cria a conversa em `MOCK_CONVERSATIONS` (o chat usa fallback
  `findPerson`; não quebra, mas não há histórico). Documentado em `AUDITORIA_IMPLEMENTACAO_MVP.md` §6.9.
- `/chat` (lista) não possui botão "Voltar" próprio — a navegação para `/home` ocorre pela tab
  inferior (comportamento existente, mantido).
