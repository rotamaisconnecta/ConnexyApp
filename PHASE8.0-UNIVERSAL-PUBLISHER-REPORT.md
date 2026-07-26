# Phase 8.0 — Universal Publisher

**Status:** ✅ COMPLETED

## Objective
Replace all "Em breve disponível" placeholders in the create flow with 9 real creation form pages and 12 shared Publisher components.

## What Was Built

### 12 Shared Publisher Components

| Component | File | Purpose |
|-----------|------|---------|
| `PublisherLayout` | `src/components/publisher/PublisherLayout.tsx` | Shared form wrapper using BrandScreen |
| `PublisherHeader` | `src/components/publisher/PublisherHeader.tsx` | Back button + title + publish button + close |
| `PublisherFooter` | `src/components/publisher/PublisherFooter.tsx` | Submit button pinned at bottom |
| `PublisherGalleryPicker` | `src/components/publisher/PublisherGalleryPicker.tsx` | Image/video picker placeholder with dashed border |
| `PublisherCameraButton` | `src/components/publisher/PublisherCameraButton.tsx` | Floating camera button with gradient |
| `PublisherLocationPicker` | `src/components/publisher/PublisherLocationPicker.tsx` | Location input using BrandInput |
| `PublisherVisibility` | `src/components/publisher/PublisherVisibility.tsx` | Public/followers/private selector with expand/collapse |
| `PublisherCategory` | `src/components/publisher/PublisherCategory.tsx` | Category badge (emoji + label) |
| `PublisherHashtags` | `src/components/publisher/PublisherHashtags.tsx` | Hashtag chips with add/remove + Enter key |
| `PublisherMentions` | `src/components/publisher/PublisherMentions.tsx` | @user mentions with add/remove |
| `PublisherPreview` | `src/components/publisher/PublisherPreview.tsx` | Live preview card showing text/location/hashtags |
| `PublisherSubmitButton` | `src/components/publisher/PublisherSubmitButton.tsx` | Submit button with loading spinner |

### Custom Hook
| Hook | File | Purpose |
|------|------|---------|
| `usePublisherForm` | `src/components/publisher/usePublisherForm.ts` | Manages publishing state + 800ms mock delay + toast + navigate to /feed |

### 9 Form Route Pages

| Route | File | Fields |
|-------|------|--------|
| `/_app/create/photo` | `src/routes/_app/create/photo.tsx` | Image picker, caption, location, hashtags, mentions, visibility, preview |
| `/_app/create/video` | `src/routes/_app/create/video.tsx` | Video picker, caption, location, hashtags, visibility, preview |
| `/_app/create/reel` | `src/routes/_app/create/reel.tsx` | Video picker, music search, caption, location, hashtags, mentions, visibility |
| `/_app/create/text` | `src/routes/_app/create/text.tsx` | Large textarea (500 char limit), location, hashtags, mentions, visibility, preview |
| `/_app/create/moment` | `src/routes/_app/create/moment.tsx` | Text, mood emoji selector (10 options), optional photo, location, visibility |
| `/_app/create/place` | `src/routes/_app/create/place.tsx` | Name, category chips (8 options), description, address, phone, website, photos, visibility |
| `/_app/create/event` | `src/routes/_app/create/event.tsx` | Banner, name, category chips (7 options), description, date range, location, max attendees, visibility |
| `/_app/create/offer` | `src/routes/_app/create/offer.tsx` | Image, title, description, price, discount, validity, business, location, coupon code, visibility |
| `/_app/create/route` | `src/routes/_app/create/ride.tsx` | Origin, destination, datetime, seats, price, preferences (pets/luggage/AC), notes, visibility |

### Modified Files
| File | Change |
|------|--------|
| `src/routes/_app/create.tsx` | Removed `validateSearch` + "Em breve disponível" placeholder. Cards now navigate to `/create/{category}` sub-routes directly. Removed unused imports. |

## Validation Results
- **TypeScript:** 0 errors (`npx tsc --noEmit` clean)
- **ESLint:** 0 errors, 17 warnings (all pre-existing `react-refresh/only-export-components`)
- **Build:** `npm run build` succeeds (1.92s)
- **Prettier:** All formatting auto-fixed

## Design Decisions
1. **Route-based forms** — Each category is a separate TanStack Router file-based route under `_app/create/`, not a single dynamic page. This keeps code organized and avoids one massive component.
2. **Local state only** — All forms use `useState`. No Supabase integration yet. Publishing simulates an 800ms delay then shows a toast and navigates to `/feed`.
3. **Shared components** — 12 reusable Publisher components avoid duplication across the 9 forms.
4. **`usePublisherForm` hook** — Centralizes the publish logic (loading state + mock delay + toast + navigation).
5. **BottomNav visible on forms** — The `_app` layout always renders BottomNav. Forms scroll within the available space above it.

## Files Created (22)
```
src/components/publisher/PublisherLayout.tsx
src/components/publisher/PublisherHeader.tsx
src/components/publisher/PublisherFooter.tsx
src/components/publisher/PublisherGalleryPicker.tsx
src/components/publisher/PublisherCameraButton.tsx
src/components/publisher/PublisherLocationPicker.tsx
src/components/publisher/PublisherVisibility.tsx
src/components/publisher/PublisherCategory.tsx
src/components/publisher/PublisherHashtags.tsx
src/components/publisher/PublisherMentions.tsx
src/components/publisher/PublisherPreview.tsx
src/components/publisher/PublisherSubmitButton.tsx
src/components/publisher/usePublisherForm.ts
src/routes/_app/create/photo.tsx
src/routes/_app/create/video.tsx
src/routes/_app/create/reel.tsx
src/routes/_app/create/text.tsx
src/routes/_app/create/moment.tsx
src/routes/_app/create/place.tsx
src/routes/_app/create/event.tsx
src/routes/_app/create/offer.tsx
src/routes/_app/create/ride.tsx
```

## Files Modified (1)
```
src/routes/_app/create.tsx
```
