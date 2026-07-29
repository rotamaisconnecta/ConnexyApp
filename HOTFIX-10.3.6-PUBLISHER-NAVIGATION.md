# HOTFIX 10.3.6 — PUBLISHER NAVIGATION BUG

## Resultado

| Status | Item |
|--------|------|
| ✓ | Foto → `/create/photo` abre editor |
| ✓ | Vídeo → `/create/video` abre editor |
| ✓ | Reel → `/create/reel` abre editor |
| ✓ | Texto → `/create/text` abre editor |
| ✓ | Evento → `/create/event` abre editor |
| ✓ | Oferta → `/create/offer` abre editor |
| ✓ | Local → `/create/place` abre editor |
| ✓ | Carona → `/create/ride` abre editor |
| ✓ | Build OK |
| ✓ | TypeScript OK |
| ✓ | ESLint OK |

---

## Bug

**`src/routes/_app/create.tsx`** — CreatePage não possuía `<Outlet />`.

Todas as rotas filhas (`/create/photo`, `/create/video`, etc.) estavam corretamente registradas no route tree gerado (`routeTree.gen.ts`), mas **o componente pai nunca renderizava um `<Outlet />`** para que TanStack Router pudesse montar os componentes filhos.

### Fluxo quebrado (antes)

```
BottomNav (+)
  → navigate("/create")
  → CreatePage renderiza grid
  → Usuário clica "Foto"
  → nav({ to: "/create/photo" })
  → URL muda para /create/photo  ✓
  → TanStack Router tenta renderizar PhotoForm
    → CreatePage NÃO TEM <Outlet />
    → PhotoForm NUNCA é montado
  → Página não muda visualmente
  → Usuário vê "NADA acontece"
```

### Fluxo corrigido (depois)

```
BottomNav (+)
  → navigate("/create")
  → CreatePage renderiza grid (isRoot = true)
  → Usuário clica "Foto"
  → nav({ to: "/create/photo" })
  → URL muda para /create/photo
  → CreatePage detecta isRoot = false
  → Renderiza <Outlet /> em vez do grid
  → PhotoForm monta dentro do Outlet ✓
```

## Correção

**`src/routes/_app/create.tsx`** — duas alterações:

1. **Import de `Outlet` e `useRouterState`:**

```typescript
import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
```

2. **Renderização condicional baseada em `pathname`:**

```typescript
const pathname = useRouterState({ select: (s) => s.location.pathname });
const isRoot = pathname === "/create" || pathname === "/_app/create";

// ...
{isRoot ? (
  // grid de ações (conteúdo original)
) : (
  <Outlet />  // renderiza o editor da rota filha
)}
```

## Arquivos Auditados

| Arquivo | Status |
|---------|--------|
| `src/components/navigation/create-sheet.tsx` | Auditado — sem bugs (não usado atualmente) |
| `src/components/navigation/create-sheet-item.tsx` | Auditado — sem bugs |
| `src/routes/_app/create.tsx` | **Corrigido** — `<Outlet />` adicionado |
| `src/lib/roles/roles-engine.ts` | Auditado — rotas corretas em `ALL_CREATE_ACTIONS` |
| `src/lib/navigation/navigation-items.ts` | Auditado — sem bugs |
| `src/components/bottom-nav.tsx` | Auditado — sem bugs (navega para `/create`) |
| `src/components/navigation/bottom-nav.tsx` | Auditado — sem bugs (não usado atualmente) |
| `src/routeTree.gen.ts` | Auditado — 9 rotas filhas registradas corretamente |
| `src/routes/_app/create/photo.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/video.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/text.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/reel.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/offer.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/event.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/ride.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/place.tsx` | Auditado — componente existe e renderiza |
| `src/routes/_app/create/moment.tsx` | Auditado — componente existe e renderiza |

## Rotas no Route Tree

Todas as 9 rotas filhas estão registradas em `routeTree.gen.ts`:

| Rota | Arquivo | Status |
|------|---------|--------|
| `/create/photo` | `_app/create/photo.tsx` | Pronta |
| `/create/video` | `_app/create/video.tsx` | Pronta |
| `/create/text` | `_app/create/text.tsx` | Pronta |
| `/create/reel` | `_app/create/reel.tsx` | Pronta |
| `/create/offer` | `_app/create/offer.tsx` | Pronta |
| `/create/event` | `_app/create/event.tsx` | Pronta |
| `/create/ride` | `_app/create/ride.tsx` | Pronta |
| `/create/place` | `_app/create/place.tsx` | Pronta |
| `/create/moment` | `_app/create/moment.tsx` | Pronta |

Nenhuma rota precisou ser criada. Nenhum componente precisou ser criado.

## Arquivos Corrigidos

| Arquivo | Mudança |
|---------|---------|
| `src/routes/_app/create.tsx` | Adicionado `Outlet` + `useRouterState` + renderização condicional |

## Validação

```bash
npm run lint    → 0 errors, 16 warnings (pre-existing)
npx tsc --noEmit → OK
npm run build   → ✓ built
```
