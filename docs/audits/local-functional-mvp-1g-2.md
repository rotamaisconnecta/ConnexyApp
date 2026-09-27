# Fase 1G-2 — Auditoria E2E do MVP local

- **Data:** 2026-09-20
- **Status:** PASS PARCIAL
- **Modo:** auditoria. Sem implementação de produto. Sem Supabase.
  Sem commit/push.
- **Baseline anterior:** 1F-13 (324 testes / 1891 assertions).

Nenhuma correção mínima foi necessária: os fluxos principais
sobreviveram à experiência contínua. As falhas de integração
encontradas são limitações já conhecidas ou o switcher demo de
identidade (não é multiusuário).

## 1. STATUS

**PASS PARCIAL**

Os módulos aprovados nas fases 1D–1F continuam coerentes quando
usados em sequência. Persistência sobrevive a reload. Sources of
truth permanecem canônicos. Não há infraestrutura duplicada nova.

O status não é PASS pleno porque:

- o switcher “Simulação demo” não reescreve `own-profile`;
- o overlay de catálogo é por dispositivo, enquanto Gerenciar filtra
  por `ownerId`;
- outing/mobilidade e videochamada desta sessão reutilizaram
  evidência CDP das fases 1F-6 / 1F-9 / 1F-10, sem um A/B live
  completo;
- limitações BLOCKED já documentadas (WebRTC, GPS, `/ofertas`,
  Edit/Delete, publicação remota) continuam de pé.

## 2. IMPLEMENTAÇÃO

```text
FILES CHANGED: 0
```

Nenhum componente, store, rota ou persistência foi criado ou
alterado. Apenas este relatório e o baseline.

## 3. FLUXOS E2E

| Fluxo                    | Resultado | Persistência | Reload | Observação |
| ------------------------ | --------- | ------------ | ------ | ---------- |
| Identity/Profile/Home    | PASS      | own-profile  | PASS   | Home “Boa noite, Lucas.” → `/perfil` Lucas Auditoria. Avatar não troca o usuário. |
| Pessoas/Conexão/Conversa | PASS      | demo-db + IDB | PASS | Conexão lucas↔beatriz; thread `demo-direct-beatriz--lucas`; mensagem 1F-5 após reload. |
| Conversa/Call            | PASS (voz live; vídeo 1F-10) | mensagem TEXT | PASS | Overlay demo; outgoing → connected → ended; histórico “Ligação de voz (demo) · encerrada”. |
| Explorar/Catálogo        | PASS      | catalog      | PASS   | Discover, `/locais`, `/events`, `/marketplace` misturam fixtures + persistidos. |
| Menu Mais                | PASS      | —            | —      | Exatos 6 itens. Create Hub permanece a criação. |
| Criar/Catálogo           | PASS      | catalog      | PASS   | Entidades 1F-12/1F-13 ainda no blob; detalhe e listas após reload. |
| Reels                    | PASS      | IndexedDB + saved-details + demo-db | PASS (1F-7) | Feed carrega. `MOCK_REELS` só catálogo. Follow em `demo-db`. |
| Saves                    | PASS      | saved-details | PASS | Café Central → `["cafe-central"]`; botão Salvo após reload. |
| Outing/Mobility          | PASS (CDP 1F-6/1F-9) | outing-invites + trip | PASS nos testes | Live: convites pending residual; Trip ausente nesta sessão. |
| Momento/Profile          | PASS      | posts        | —      | `/create/moment` → `/create-post?category=MOMENT`. Catálogo não é post. |

## 4. SOURCE OF TRUTH

Confirmado no código e no storage da sessão:

```text
Identity     → getDemoIdentity()            connexy:demo:identity
Profile      → connexy:demo:own-profile
Social       → connexy:demo:db
Posts        → connexy:demo:posts
Catalog      → connexy:demo:catalog
Messages     → IndexedDB connexy-app-local-db
Reels        → IndexedDB connexy-reels-data-local-db
Saves        → connexy:demo:saved-details
Outing       → connexy:demo:outing-invites
Trip         → connexy_demo_trip
Dispatcher   → config connexy_demo_dispatcher; estado deriva do Trip
Calls        → sessão em memória; histórico via sendLocalMessage
```

Chaves extras já existentes (não criadas nesta fase):
`connexy:demo:saved-profile-media` (favoritos da galeria de `/perfil`),
`connexy.presence.*`, `connexy_roles`, carrossel/hint. Não são um
segundo catálogo nem um segundo social.

`isPublicSupabaseConfigured()` retorna false em demo. Home não chama
`ProfileRepository` nesse modo.

## 5. TESTES

```text
anteriores: 324 pass / 1891 assertions
novos: 0
total: 324 pass
assertions: 1891
failures: 0
```

Nenhum teste novo: a lacuna era de integração contínua, coberta
pela suíte por fase + browser desta auditoria. Não inflar a
contagem.

## 6. TYPECHECK

PASS (`bunx tsc --noEmit`)

## 7. BUILD

PASS (`bun run build`)

## 8. LINT

Não executado em arquivos de produto: `FILES CHANGED: 0`.
Lint global permanece o baseline preexistente (não limpo).

## 9. BROWSER/CDP

Vite `:8080`, `VITE_APP_DEMO_MODE=true`.

Executado ao vivo:

- Home → avatar → `/perfil` → reload
- `/perfil/beatriz` (catálogo de pessoa, não own-profile)
- Restaurar identidade default `lucas`
- Café Central salvar → reload (Salvo)
- Discover (Mapa) com overlay Ateliê / Padaria / Sarau + fixtures
- Conversas → `demo-direct-beatriz--lucas` → Ligar demo →
  Simular atendimento → Encerrar → reload
- Create Hub (Foto…Reel)
- Gerenciar como Lucas (sem lista Catálogo local das entidades
  `ownerId=beatriz`)
- Menu Mais: Locais, Eventos, Negócios, Reel, Ofertas, Gerenciar
- `/events` → Sarau 1F-12 → detalhe
- `/marketplace` → Padaria 1F-13 + promoção Café 12% → detalhe
- `/create/moment` → create-post MOMENT

CDP das fases anteriores (não reescritos): 1D-1, 1D-2, 1F-5, 1F-6,
1F-7, 1F-9, 1F-10, 1F-12, 1F-13 — todos `networkCalls = 0`.

## 10. NETWORK

Harness CDP existente: `networkCalls = 0`.

Browser ao vivo: recursos `performance` = módulos Vite em
`localhost:8080`. Nenhuma URL `/rest/v1`, `/auth/v1` ou
`/functions/v1`. Matches “supabase” foram **arquivos locais**
(`src/lib/supabase/*.ts`, deps Vite), não chamadas remotas.

```text
networkCalls (API/app) = 0
```

## 11. SUPABASE

```text
Supabase calls = 0
```

Cliente em Proxy lazy; demo trata Supabase como unconfigured.

## 12. REGRESSÕES

Nenhuma regressão encontrada.

## 13. LIMITAÇÕES

### Reais (coerência E2E, sem correção nesta fase)

- Switcher “Simulação demo” grava `connexy:demo:identity` e não
  troca `own-profile`. Home/Perfil continuam o perfil onboarding
  (Lucas). Catálogo criado com identidade Beatriz fica com
  `ownerId=beatriz`. Gerenciar respeita o owner; listas públicas
  do dispositivo mostram o overlay. Não é multiusuário real.
- Header do chat (`aria-label="Perfil de …"`) não tem `onClick`.
  O atalho funcional está no menu “Mais opções” da conversa.
- `connexy:demo:saved-profile-media` é um store paralelo só da
  galeria de `/perfil`, distinto de `saved-details`.

### BLOCKED intencional

- WebRTC real; GPS real; pagamento online; matching remoto;
  publicação remota; Edit/Delete de catálogo; rota `/ofertas`.

### P2 futuro

- Perfis por identidade no switcher demo, se o switcher continuar.
- Listagem dedicada de ofertas.
- Header do chat navegar para `/perfil/$id`.
- Unificar ou documentar na UI os dois stores de “salvo”.

## 14. DECISÃO

**PASS PARCIAL**

O MVP local está coerente ponta a ponta para a próxima decisão de
infraestrutura. Não há quebra nova que justifique uma fase de
refatoração agora.

Causa das ressalvas: limitações já conhecidas + switcher demo vs
um único `own-profile`. Menor correção, se um dia for desejada:
ao mudar identidade, ou recarregar o perfil canônico daquela
identidade, ou deixar explícito na UI que o switcher só afeta
social/inbox — **não implementar nesta auditoria**.
