# HOTFIX 10.3.2 — PREMIUM SMART CAROUSELS

## Summary

Created a reusable `PremiumCarousel` component and applied it to all relevant home feed sections. Added a new "Locais Próximos" section. Updated feed order.

## Files Created

- `src/components/carousel/PremiumCarousel.tsx` — Generic reusable carousel

## Files Modified

- `src/components/feed/FeedNearbyPeople.tsx` — Now uses `PremiumCarousel`
- `src/components/feed/FeedNearbyEvents.tsx` — Now uses `PremiumCarousel`
- `src/components/feed/FeedNearbyBusinesses.tsx` — Now uses `PremiumCarousel`
- `src/components/feed/FeedNearbyDrivers.tsx` — Now uses `PremiumCarousel`
- `src/components/feed/FeedNearbyPlaces.tsx` — **New** section component
- `src/components/feed/SmartFeed.tsx` — Added `FeedNearbyPlaces` import + `NEARBY_PLACES` case
- `src/lib/feed/feed-types.ts` — Added `NEARBY_PLACES` to `SmartSectionType`, `NearbyPlacesSectionData`, optional `compatibility` field on person
- `src/lib/feed/feed-sections.ts` — Added `MOCK_PLACES` (10 items), `createNearbyPlacesSection`, compatibility values on people
- `src/lib/feed/feed-priority.ts` — Base score for `NEARBY_PLACES`
- `src/lib/feed/feed-builder.ts` — Added `NEARBY_PLACES` to CITY template + `SECTION_CREATORS`

## PremiumCarousel Features

- **Generic** — `<PremiumCarousel<T> items={...} renderCard={...} />`
- **Responsive** — 4 cards desktop, 3 tablet, 2 mobile
- **Partial peek** — Next card partially visible
- **Snap** — Spring animation to card position
- **Drag/swipe** — Mouse, touch, trackpad via Framer Motion `drag="x"`
- **Arrow buttons** — Desktop only, floating left/right
- **Progress bar** — Gradient bar + counter (e.g. "3/7")
- **Autoplay** — Every 5s, pauses on interaction, resumes after 5s idle
- **Infinite loop** — Tripled array with seamless wrap
- **Animations** — Entry stagger (50ms), hover scale 1.03, tap scale 0.97, active card opacity 1 vs 0.7

## Section Card Features

| Section | Emoji | Card Content |
|---------|-------|-------------|
| Pessoas | 👥 | Photo, name, age, compatibility %, interests, online/offline, distance (color-coded), "Visualizar Perfil" button, gradient border if online |
| Locais | 📍 | Photo, rating, name, category, hours, open/closed, distance (color-coded), "Ver Local" button |
| Eventos Hoje | 🎉 | Banner, name, date/time, participants, distance, "Ver Evento" button |
| Eventos Próximos | 📅 | Same as above |
| Negócios | 🏢 | Cover, rating, name, category, distance, "Ver Negócio" button |
| Motoristas | 🚗 | Photo, name, car, rating, distance, availability dot, "Solicitar" button |

## Distance Color Coding

| Distance | Color |
|----------|-------|
| ≤ 100m | 🟢 Green |
| ≤ 500m | 🟡 Yellow |
| ≤ 2km | 🟠 Orange |
| > 2km | 🔴 Red |

## Home Feed Order

1. Hero
2. Área em Alta
3. 👥 Pessoas Próximas
4. 📍 Locais Próximos
5. 🎉 Eventos Hoje
6. 📅 Eventos Próximos
7. 🏢 Negócios Próximos
8. 🔥 Em Alta
9. Footer

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | 0 errors (16 pre-existing warnings) |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | ✅ Succeeds |
