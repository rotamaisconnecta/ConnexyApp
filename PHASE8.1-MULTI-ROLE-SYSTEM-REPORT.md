# Phase 8.1 — Multi Role System

**Status:** ✅ COMPLETED

## Objective
Eliminate the concept of "user type". Every user has ONE account with multiple simultaneous roles. Roles control BottomNav tabs, create action permissions, and feature visibility.

## Architecture

### Roles Layer (`src/lib/roles/`)

| File | Lines | Purpose |
|------|-------|---------|
| `roles-types.ts` | 42 | `UserRole` enum (6 values), `RoleMode`, `UserPermissions` (11 fields), `RoleDefinition`, `RolesStorage` |
| `roles-utils.ts` | 180 | `getPermissionsForRoles()`, `canUserCreateCategory()`, `getBlockedCategoryMessage()`, `getRoleDefinition()`, `getActivatableRoles()` |
| `roles-storage.ts` | 102 | localStorage CRUD: `getStoredRoles()`, `setStoredRoles()`, `addRole()`, `removeRole()`, `setActiveMode()`, `hasRole()`, `resetRoles()` |
| `roles-guards.ts` | 57 | Convenience guard functions: `canDrive()`, `canCreateOffer()`, `canCreateEvent()`, `canCreatePlace()`, etc. |
| `roles-engine.ts` | 126 | Maps roles → UI configs: `getBottomNavConfig()`, `getCreateActionsForRoles()`, `getMapFiltersForRole()` |
| `roles-mocks.ts` | 62 | 7 mock states: commonUser, driver, business, driverBusiness, businessEvents, contentCreator, allRoles |

### UI Layer (`src/components/roles/`)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `RoleSwitcher` | 53 | Segmented pill control (Usuário/Motorista/Empresa) for profile header |
| `RoleCard` | 54 | Individual role activation card with icon, label, toggle button |
| `RoleBadge` | 31 | Inline badge showing role name + emoji |
| `RolePermission` | 21 | `<RolePermission requires="canCreateOffer">` — renders children or nothing |
| `RoleSelector` | 25 | Grid of RoleCards for the activation section |
| `RoleActivationModal` | 79 | Modal: "Cadastre sua empresa" with CTA button |
| `RoleGrid` | 9 | Grid layout wrapper |
| `RoleHeader` | 16 | Section header: "Ativar Funcionalidades" |
| `RoleEmpty` | 18 | Empty state for no extra roles |

### Route

| File | Lines | Route |
|------|-------|-------|
| `src/routes/_app/profile/roles.tsx` | 88 | `/_app/profile/roles` — Full role management page |

## Modified Files

| File | Change |
|------|--------|
| `src/routes/_app.tsx` | Reads `activeMode` from roles storage, passes it to `<BottomNav mode={activeMode} />`. Listens for storage events. |
| `src/components/bottom-nav.tsx` | Accepts `RoleMode` prop. Added `businessLeftItems`/`businessRightItems`. Permission-checks create actions before navigation. Shows `RoleActivationModal` when blocked. |
| `src/routes/_app.profile.tsx` | Added `RoleSwitcher` in header. Added "Ativar Funcionalidades" section linking to `/profile/roles`. Wired `DriverProfileCard` to roles state. |
| `src/routes/_app/create.tsx` | Added permission check via `canUserCreateCategory()` before navigating to form. Shows `RoleActivationModal` when blocked. |

## UserRole Enum

```ts
export enum UserRole {
  USER = "USER",           // Base — always active
  DRIVER = "DRIVER",       // Can drive, publish rides
  BUSINESS = "BUSINESS",   // Can create offers
  EVENT_CREATOR = "EVENT_CREATOR", // Can create events
  PLACE_OWNER = "PLACE_OWNER",     // Can create places
  REELS_CREATOR = "REELS_CREATOR", // Can create reels
}
```

## Permission Matrix

| Action | USER | DRIVER | BUSINESS | EVENT | PLACE | REELS |
|--------|------|--------|----------|-------|-------|-------|
| Photo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Video | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Text | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Moment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ride | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offer | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Event | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Place | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## BottomNav Configs

| Mode | Left | Center | Right |
|------|------|--------|-------|
| USER | Home `/feed`, Map `/discover` | Create | Chat `/chat`, Profile `/profile` |
| DRIVER | Dashboard `/driver`, Map `/discover` | Create | Corridas `/driver`, Profile `/profile` |
| BUSINESS | Home `/feed`, Market `/marketplace` | Create | Chat `/chat`, Profile `/profile` |

## Validation Results
- **TypeScript:** 0 errors (`npx tsc --noEmit` clean)
- **ESLint:** 0 errors, 17 warnings (all pre-existing)
- **Build:** `npm run build` succeeds
- **Prettier:** All formatting auto-fixed

## Files Created (16)
```
src/lib/roles/roles-types.ts
src/lib/roles/roles-utils.ts
src/lib/roles/roles-storage.ts
src/lib/roles/roles-guards.ts
src/lib/roles/roles-engine.ts
src/lib/roles/roles-mocks.ts
src/components/roles/RoleSwitcher.tsx
src/components/roles/RoleCard.tsx
src/components/roles/RoleBadge.tsx
src/components/roles/RolePermission.tsx
src/components/roles/RoleSelector.tsx
src/components/roles/RoleActivationModal.tsx
src/components/roles/RoleGrid.tsx
src/components/roles/RoleHeader.tsx
src/components/roles/RoleEmpty.tsx
src/routes/_app/profile/roles.tsx
```

## Files Modified (4)
```
src/routes/_app.tsx
src/components/bottom-nav.tsx
src/routes/_app.profile.tsx
src/routes/_app/create.tsx
```

## Totals
- **16 new files** + **4 modified files** = **20 files touched**
- **963 new lines** (lib + components + route)
- **1 enum** (UserRole)
- **2 interfaces** (UserPermissions, RoleDefinition)
- **1 type alias** (RoleMode, RolesStorage, PermissionsMap)
- **6 lib functions** (getPermissionsForRoles, canUserCreateCategory, getBlockedCategoryMessage, getRoleDefinition, getActivatableRoles, getCurrentRolesAndMode)
- **12 storage functions** (getStoredRoles, setStoredRoles, addRole, removeRole, setActiveMode, getActiveMode, hasRole, resetRoles)
- **10 guard functions** (canDrive, canPublishRide, canCreateOffer, etc.)
- **9 UI components** (RoleSwitcher, RoleCard, RoleBadge, RolePermission, RoleSelector, RoleActivationModal, RoleGrid, RoleHeader, RoleEmpty)
- **1 route** (/profile/roles)
- **7 mock states**
