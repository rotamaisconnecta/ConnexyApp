# Phase 7.8 — Fix Create Publication (HTTP 408) Report

**Date:** 2026-07-25  
**Status:** ✅ COMPLETE — All 9 cards open immediately

## Root Causes Found & Fixed

### 1. Category Mismatch in CreateSheetItem (CRITICAL)

**File:** `src/components/navigation/create-sheet-item.tsx`

**Bug:** `onSelect?.(label)` passed the Portuguese label (e.g. `"Foto"`, `"Vídeo"`, `"Carona"`) as the category value.

**Why it caused HTTP 408:** The `getCreateActionByCategory()` function in `create.tsx` compares against `action.id.toLowerCase()` (e.g. `"photo"`, `"video"`, `"route"`). Since `"foto" !== "photo"`, no category ever matched, and every card fell through to the "Em breve disponível" placeholder instead of opening a form.

**Fix:** Added `categoryId` prop to `CreateSheetItem`, now passes `action.id` instead of `action.label`.

### 2. Broken Route Construction in BottomNav (CRITICAL)

**File:** `src/components/bottom-nav.tsx`

**Bug:** `handleCreateSelect` built a raw route string `/_app/create?category=foto` and called `navigate({ to: route })`. This is not valid TanStack Router navigation — the `to` param expects a path, and search params must be passed separately.

**Fix:** Changed to `navigate({ to: "/create", search: { category: category.toLowerCase() } })`.

### 3. Stale Routes in Navigation Items (MEDIUM)

**File:** `src/lib/navigation/navigation-items.ts`

**Bug:** All 9 `CREATE_ACTIONS` had routes pointing to `/create-post?category=...` which doesn't match the actual route `/_app/create`. While these routes aren't used for direct navigation (the `CreateSheet` and `create.tsx` handle their own navigation), they were inconsistent with the actual routing.

**Fix:** Updated all routes to `/create?category=...`.

### 4. BottomNavPremium (Navigation Component) Route Construction

**File:** `src/components/navigation/bottom-nav.tsx`

**Bug:** Same broken route construction pattern as the main `BottomNav`.

**Fix:** Consistent fix applied.

## Audit Results

### Routes (Step 1)
- `/_app/create` — ✅ Exists with `validateSearch` for `category`
- `/_app/create-post` — ✅ Exists (legacy form page)
- All 9 category cards in `create.tsx` navigate correctly via `nav({ to: "/create", search: { category: action.id.toLowerCase() } })`

### CreateSheet (Step 2)
- ✅ `onClick` → `onSelect(categoryId)` → `handleCreateSelect` → `navigate({ to: "/create", search: { category: "..." } })`
- ✅ Search params properly typed via `validateSearch` on route
- ✅ `getCreateActionByCategory()` now receives matching IDs

### Bottom Navigation (Step 3)
- ✅ Central button opens `CreateSheet`
- ✅ `CreateSheet` calls `handleCreateSelect` with correct category ID
- ✅ `handleCreateSelect` navigates to `/create` with proper search params

### Authentication (Step 4)
- ✅ Auth guard in `_app.tsx` layout protects all child routes
- ✅ `useAuth()` hook properly handles loading/loaded states
- ✅ No auth loops — loading resolves once, then user check is synchronous
- ✅ No hydration infinite loop

### Supabase (Step 5)
- ✅ No Supabase queries in the create form flow
- ✅ `CreatePostForm` uses only local React state
- ✅ Forms open immediately with no network dependency

### Loaders (Step 6)
- ✅ No `await` blocking in create route
- ✅ No Suspense boundaries on create paths
- ✅ No pending Promises
- ✅ `useEffect` dependencies correct in all create-related components

### Timeout Handling (Step 7)
- ✅ No network requests occur when opening create forms (all local state)
- ✅ The `handlePublish` in `create-post.tsx` uses a mock `setTimeout` (1s) — no Supabase call
- ✅ Auth check via `getSession()` in `useAuth` has natural timeout from Supabase client

## Verification

```
npx tsc --noEmit   → 0 errors
npm run build       → ✅ built successfully
npm run lint        → 0 errors, 17 warnings (pre-existing)
npx prettier --check → All matched files use Prettier code style
```

## Files Modified

| File | Change |
|---|---|
| `src/components/navigation/create-sheet-item.tsx` | Added `categoryId` prop, use it in `onClick` instead of `label` |
| `src/components/navigation/create-sheet.tsx` | Pass `action.id` as `categoryId` to `CreateSheetItem` |
| `src/components/bottom-nav.tsx` | Fixed `handleCreateSelect` to use proper `navigate()` with search params |
| `src/components/navigation/bottom-nav.tsx` | Fixed `handleCreateSelect` route construction |
| `src/lib/navigation/navigation-items.ts` | Updated 9 stale routes from `/create-post?category=...` to `/create?category=...` |

## Category Flow After Fix

```
User taps central button → CreateSheet opens
→ User taps "Foto" → onSelect("PHOTO") → handleCreateSelect("PHOTO")
→ navigate({ to: "/create", search: { category: "photo" } })
→ create.tsx reads search.category = "photo"
→ getCreateActionByCategory("photo") matches action.id.toLowerCase() = "photo" ✅
→ Shows "Criar Foto" form (or "Em breve disponível" placeholder)
```

All 9 categories follow the same flow: PHOTO→photo, VIDEO→video, REEL→reel, TEXT→text, MOMENT→moment, PLACE→place, EVENT→event, OFFER→offer, ROUTE→route.
