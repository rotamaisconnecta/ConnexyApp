# PHASE 10.7.1 — SISTEMA DE PRIVACIDADE DA PRESENÇA

## Objetivo
Permitir que antes de confirmar um 📍 Presença (check-in), o usuário escolha a visibilidade: 🌍 Público, 👥 Apenas amigos ou 🙈 Anônimo — com opção de salvar a preferência para os próximos check-ins e alterar depois. A presença privada nunca expõe a identidade em listas, mapas, feed ou notificações, mas continua alimentando o Context Engine, AI Engine, ranking, heatmap e analytics.

## Regras de negócio (spec 20-25)

### 1. Escolha de visibilidade no check-in
**Arquivos**: `src/components/event-checkin/presence-privacy-picker.tsx`, `src/components/event-checkin/checkin-modal.tsx`

- 3 opções: 🌍 Público, 👥 Apenas amigos, 🙈 Anônimo (emoji, label, descrição).
- Switch "Salvar preferência para os próximos check-ins" persiste em `localStorage` (`connexy.presence.visibility`).
- Check-in confirmado com `savePreference` → atualiza a preferência global; senão, a visibilidade vale só para aquele check-in (override).
- Check-in existente pode ser alterado depois ("Alterar") sem sair do local.

### 2. Lista "Presentes" (spec 21)
**Arquivo**: `src/components/event-checkin/present-list.tsx`

- Linhas com foto, nome, "Check-in há X min/h" e badge de tipo (Público / Amigos).
- Usuários anônimos NUNCA aparecem pelo nome/foto: apenas o rodapé agregado "🙈 N usuário(s) anônimo(s) — Presença privada — nome não exibido".
- Regras no domínio: `getPresentList` em `src/lib/presence/presence-privacy.ts` filtra por target e anonimiza (`anonymizePresenceList`).

### 3. Mapa (spec 22)
**Arquivo**: `src/lib/integration/integration-checkin.ts` + `src/routes/_app/discover.tsx`

- Público → aparece no mapa para todos.
- Apenas amigos → aparece apenas para amigos.
- Anônimo → nunca aparece (só contagem agregada 🙈 no rodapé do mapa).
- `createCheckinMapUpdate` agora retorna `CheckinMapPlaceUpdate` com `checkinCount` + `anonymousCount`; identidade nunca é mapeada para anônimos.

### 4. Feed (spec 23)
**Arquivos**: `src/lib/integration/integration-feed.ts`, `src/components/presence/presence-live-feed.tsx`

- Público → "João fez check-in no Restaurante XPTO" publicado.
- Amigos → só para amigos.
- Anônimo → `createFeedItemFromCheckin` retorna `null`; nunca aparece no feed. Rodapé do feed ao vivo: "Presenças anônimas contam para o movimento, mas nunca aparecem no feed."

### 5. Notificações
**Arquivos**: `src/lib/integration/integration-notifications.ts`, `src/routes/_app/notifications.tsx`

- Organizador (alvo em `ORGANIZER_TARGET_IDS`): "✔ Novo check-in", "🔥 Local movimentado", "🎉 Evento lotando", "🏷️ Promoção gerando visitas" (geradas com ≥3 presentes e thresholds de status).
- Usuário: "👥 Amigos chegaram" quando amigos fazem check-in.
- Anônimo → `generateCheckinNotifications` retorna `[]`; `generateCheckinNotification` retorna `null`.
- Página de notificações mescla as notificações geradas com as mock existentes (dedupe + sort por data).

### 6. Analytics do organizador (spec 25)
**Arquivo**: `src/components/event-checkin/presence-analytics.tsx` + `src/routes/_app.gerenciar.tsx`

- Cards: 👥 Presentes, ⏳ Chegando, ⭐ Já estiveram, 🙈 Anônimos, Tempo médio, Pico de visitas (HH:00).
- Mapa de calor 6x6 (`heatmap` com 36 células `heat-row-col`), cores vermelho ≥0.66, laranja ≥0.33, âmbar >0, muted 0.
- Status de movimento por local via `PlaceStatusMeta` (tiers 0.3/0.55/0.8).
- `computeMovementMetrics` e `computeHeatmap` em `src/lib/presence/presence-privacy.ts`.

### 7. Context Engine / AI Engine
**Arquivo**: `src/providers/presence/presence-provider.tsx` montado dentro do `ContextEngineProvider` em `src/routes/_app.tsx`

- Check-ins anônimos continuam alimentando Context/AI/ranking/heatmap/analytics sem revelar identidade.
- `CheckinUser.visibility` opcional; `metadata` carrega `userId`/`targetId`/`visibility`.

## Arquivos criados
- `src/lib/presence/presence-privacy.ts` — domínio puro: persistência, guards, anonimização, métricas, heatmap.
- `src/providers/presence/presence-provider.tsx` — estado global, live dispatch, seeds, feed/notificações/placeUpdates/heatmap, `checkIn`/`leave`/`updateVisibility`/`getPresentList`/`getMetrics`.
- `src/components/event-checkin/presence-privacy-picker.tsx`
- `src/components/event-checkin/presence-checkin.tsx` — trigger do check-in (modal + sucesso).
- `src/components/event-checkin/present-list.tsx`
- `src/components/event-checkin/presence-analytics.tsx`
- `src/components/presence/presence-live-feed.tsx`

## Arquivos alterados
- `src/lib/event-checkin/checkin-types.ts` — `PresenceVisibilityValue`, `PresenceRecord`, `CheckinUser.visibility`.
- `src/lib/integration/integration-types.ts` — `CheckinPayload.visibility` obrigatório, `CheckinMapPlaceUpdate`.
- `src/lib/integration/integration-checkin.ts`, `integration-feed.ts`, `integration-notifications.ts` — regras por visibilidade.
- `src/lib/live/live-events.ts`, `live-dispatcher.ts` — `CheckinCreatedPayload.visibility`.
- `src/lib/mock-data.ts` — `currentUser.id = "lucas"`.
- `src/components/event-checkin/checkin-modal.tsx` — reescrito com privacy picker.
- Rotas: `_app.tsx`, `event.$eventId.tsx`, `local.$id.tsx`, `discover.tsx`, `gerenciar.tsx`, `notifications.tsx`, `home.tsx`.

## Seeds
9 registros: Cafe Central (Beatriz Público 8m, Maria Anônima 5m, anon-2 Anônimo 3m, Carlos Público saiu 60m), Vinil Store (João Amigos 20m, Ana Público 40m), Evt-1 "Noite de Jazz" (Pedro Público 12m, Júlia Público 25m, Rafael Amigos 30m). Fotos `https://i.pravatar.cc/200?img=...`.

## Validação
- `npx tsc --noEmit` — limpo.
- `npm run lint` — limpo (só erros de prettier pré-existentes em arquivos não tocados).
- `npm run build` — ok.
