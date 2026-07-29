# HOTFIX 10.6.3 — DRIVER UX + PROFILE + NOTIFICATIONS + PUBLISHER

## Objetivo
Corrigir os problemas restantes de UX.

## O que mudou

### 1. Home Motorista — Reorganização
**Arquivo**: `src/lib/feed/feed-builder.ts`

Template DRIVER atualizado:
- `NEARBY_PEOPLE` e `NEARBY_DRIVERS` removidos
- Ordem: `HERO → NEARBY_EVENTS → NEARBY_EVENTS_TODAY → TRENDING → NEARBY_PLACES → NEARBY_BUSINESSES → FOOTER`

### 2. Em Alta → PremiumCarousel
**Arquivo**: `src/components/feed/FeedTrending.tsx`

- FeedTrending reescrito para usar `PremiumCarousel` (mesmo comportamento de Pessoas, Eventos, Locais, Negócios)
- Suporte a drag, swipe, touch, trackpad, autoplay, peek

### 3. Perfil — Simplificado
**Arquivo**: `src/routes/_app.profile.tsx`

- Removido `RoleSwitcher` (Usuário, Negócio, Motorista)
- Removido `DriverProfileCard`
- Mostra apenas: Avatar, Nome, Cidade, Bio, Estatísticas, Interesses, Vibe, Locais favoritos, Meu Connexy, Links rápidos
- Adicionados campos `city` e `bio` ao `currentUser` em `src/lib/mock-data.ts`

### 4. Notificações — Sino + Badge + Painel
**Arquivo novo**: `src/components/notifications/NotificationBell.tsx`

- Adicionado ícone 🔔 no canto superior direito (global em `_app.tsx`)
- Badge vermelho com quantidade de notificações não lidas
- Ao clicar, abre painel slide-down
- Cada notificação possui ícone, título, descrição, tempo
- Ao clicar, redireciona baseado no tipo (evento, conversa, negócio, oferta, perfil, mapa)
- Notificações de motorista removidas (`DriverNotifications` removido de `src/routes/_app/driver/index.tsx`)

### 5. Publicador — Botão Publicar visível
**Arquivos**: `src/components/publisher/PublisherFooter.tsx`, `src/components/publisher/PublisherSubmitButton.tsx`

- `PublisherFooter`: adicionado `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]` e `z-10 relative`
- `PublisherSubmitButton`: adicionado `mb-2`
- Botão sempre totalmente visível acima do BottomNav

### 6. Upload — Componente UploadMedia reutilizável
**Arquivo novo**: `src/components/ui/UploadMedia.tsx`

- `input type=file` real com `accept` configurável
- Suporta imagem (`image/*`), vídeo (`video/*`) ou ambos
- Preview da mídia com suporte a vídeo
- Remoção com botão hover
- Troca por clique na preview
- Drag and drop desktop
- Preparado para Supabase Storage

### 7. Upload — Integrado em todas as telas de criação
**Arquivos**: `src/routes/_app/create/{photo,video,reel,offer,event,place}.tsx`

- `PublisherGalleryPicker` substituído por `UploadMedia` em todas as telas:
  - **Foto**: `accept="image/*"`
  - **Vídeo**: `accept="video/*"`
  - **Reel**: `accept="image/*,video/*"`
  - **Oferta**: `accept="image/*"`
  - **Evento**: `accept="image/*"`
  - **Local**: `accept="image/*"` (multiplas fotos, max 5)

## Validação
- `npx tsc --noEmit` — 0 erros
- `npm run lint` — 0 erros
- `npm run build` — OK
