# HOTFIX 10.6.1 — CAROUSEL UX + DRIVER HOME

## Objetivo
Corrigir a experiência dos carrosséis (drag/swipe/snap) e ajustar a home do motorista.

## O que mudou

### 1. Smart Feed — DRIVER: esconder FeedNearbyDrivers
**Arquivo**: `src/lib/feed/feed-builder.ts`

Template DRIVER atualizado:
- **Antes**: `HERO → NEARBY_EVENTS_TODAY → NEARBY_EVENTS_UPCOMING → NEARBY_PEOPLE → NEARBY_DRIVERS → TRENDING → FOOTER`
- **Depois**: `HERO → NEARBY_EVENTS → NEARBY_EVENTS_TODAY → TRENDING → NEARBY_PEOPLE → NEARBY_PLACES → NEARBY_BUSINESSES → FOOTER`

Mudanças:
- `NEARBY_DRIVERS` removido (motorista não precisa ver outros motoristas)
- `NEARBY_EVENTS` adicionado antes de `NEARBY_EVENTS_TODAY`
- `NEARBY_PLACES` + `NEARBY_BUSINESSES` adicionados depois de `NEARBY_PEOPLE`

### 2. PremiumCarousel — Drag/Swipe/Snap overhaul
**Arquivo**: `src/components/carousel/PremiumCarousel.tsx`

#### Correções de drag:
- `dragConstraints={containerRef}` removido — impedia drag além da largura do container
- `dragElastic` aumentado: `0.05 → 0.15`
- `dragMomentum` adicionado (true)
- `whileDrag={{ scale: 0.98, cursor: "grabbing" }}` adicionado
- Classe `cursor-grab active:cursor-grabbing` via Tailwind
- Threshold reduzido: `0.2 → 0.15`, velocity reduzido: `400 → 300`

#### Autoplay:
- `AUTOPLAY_RESUME_MS`: `5000 → 8000` (retoma após 8 segundos)
- Pausa automaticamente durante drag/swipe/hover
- Retoma automaticamente após inatividade

### 3. Aplicado a todos os carrosséis
As correções no `PremiumCarousel` aplicam-se automaticamente a:
- `FeedNearbyPeople`
- `FeedNearbyEvents`
- `FeedNearbyPlaces`
- `FeedNearbyBusinesses`

## Validação
- `npx tsc --noEmit` — 0 erros
- `npm run lint` — 0 erros
- `npm run build` — OK
