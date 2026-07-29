# HOTFIX 10.3.1 — HOME PEOPLE CAROUSEL PREMIUM

## Summary

Replaced the static horizontal scroll of "Pessoas Próximas" with a premium infinite carousel with autoplay, indicators, arrows, drag/swipe, and Framer Motion animations.

## Files Modified

- `src/components/feed/FeedNearbyPeople.tsx` — Full rewrite

## What Changed

### Layout
- Title `👥 Pessoas Próximas` with "Ver todas" link right-aligned
- Horizontal carousel below (replaces old `overflow-x-auto` list)

### Carousel Behavior
- **4 cards** desktop (≥1024px), **3 cards** tablet (640–1023px), **2 cards** mobile (<640px)
- **Infinite loop** via tripled array + seamless wrap-around
- **Drag/swipe** (mouse, touch, trackpad) via Framer Motion `drag="x"`
- **Arrow buttons** (← →) floating on desktop only
- **Dot indicators** below, clickable to jump to any slide
- **Autoplay** every 5s, pauses on interaction, resumes after 5s idle

### Cards
- Photo with gradient overlay, distance badge, online status dot
- Name, age, interests (up to 3), online/offline text
- "Visualizar" button linking to `/perfil/$id`

### Animations
- **Entry**: fade + slide up with stagger (50ms per card)
- **Hover**: scale 1.03 + elevated shadow
- **Click**: scale 0.97
- **Slide transition**: spring animation (stiffness 300, damping 30)

### Responsive
- Full responsive: 4→3→2 cards via resize observer
- Layout never breaks
- Scrollbar hidden (`overflow: hidden`)

### Data
- Uses same `NearbyPeopleSectionData` — no changes to feed-types or mock data

## Compatibility
- SmartFeed: unchanged — imports `FeedNearbyPeople` as before
- Feed Builder: unchanged
- AI Ranking / Context Engine / Roles / Live Engine / Orchestrator: untouched

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | 0 errors (16 pre-existing warnings) |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | ✅ Succeeds |
