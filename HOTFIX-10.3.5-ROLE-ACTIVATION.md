# HOTFIX 10.3.5 — ROLE ACTIVATION BUG

## Resultado

| Status | Item |
|--------|------|
| ✓ | `RoleActivationModal.handleActivate` agora chama `setActiveMode` |
| ✓ | `RolesPage` escuta `roleChanged` e atualiza UI |
| ✓ | `ProfilePage` escuta `roleChanged` e atualiza estado |
| ✓ | `RoleSwitcher` reflete mudanças sem reload |
| ✓ | Build OK |
| ✓ | TypeScript OK |
| ✓ | ESLint OK |

---

## 1 — RoleActivationModal (funcional)

**`src/components/roles/RoleActivationModal.tsx`**

**Antes:** `handleActivate()` chamava `addRole(role)` para adicionar a role à lista, mas **nunca atualizava o `activeMode`**. Com isso:
- Role ficava salva em `localStorage.roles`
- `activeMode` permanecia `USER`
- Nenhum módulo da UI reagia (BottomNav, Home, Feed) pois liam `getActiveMode()` que ainda retornava `USER`

**Depois:** Adicionada chamada `setActiveMode(role as RoleMode)` entre `addRole(role)` e `dispatchEvent`.

```typescript
function handleActivate() {
    addRole(role);
    setActiveMode(role as RoleMode);  // ← fix
    onClose();
    window.dispatchEvent(new Event("roleChanged"));
}
```

Isso alinha o comportamento com `RoleSelector.tsx:25-27`, que já fazia `setActiveMode` corretamente.

## 2 — RolesPage (reatividade)

**`src/routes/_app/profile/roles.tsx`**

**Antes:** `RolesPage` definia `handleRoleChanged()` mas **nunca registrava um listener** no evento `roleChanged`. O `RoleSelector` disparava o evento, mas a página não reagia:
- `RoleBadge` badges não apareciam
- `activeCount` não atualizava
- Seção de permissões não aparecia
- `RoleSwitcher` não refletia o novo modo ativo

**Depois:** Adicionado `useEffect` com event listener:

```typescript
useEffect(() => {
    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
}, []);
```

## 3 — ProfilePage (reatividade)

**`src/routes/_app.profile.tsx`**

**Antes:** Sem listener para `roleChanged`. A página só atualizava `rolesState` no mount inicial (`useState(getStoredRoles)`). Se uma role fosse ativada/desativada externamente enquanto o usuário estava na página, o `RoleSwitcher` e o `DriverProfileCard` ficavam desatualizados.

**Depois:** Adicionado `useEffect` que sincroniza `rolesState` com `localStorage` sempre que `roleChanged` dispara:

```typescript
useEffect(() => {
    function syncRoles() {
        setRolesState(getStoredRoles());
    }
    window.addEventListener("roleChanged", syncRoles);
    return () => window.removeEventListener("roleChanged", syncRoles);
}, []);
```

---

## Arquivos Modificados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `src/components/roles/RoleActivationModal.tsx` | Component | `setActiveMode(role)` adicionado |
| `src/routes/_app/profile/roles.tsx` | Route | `useEffect` listener adicionado |
| `src/routes/_app.profile.tsx` | Route | `useEffect` listener adicionado |

## Validação

```bash
npm run lint    → 0 errors, 16 warnings (pre-existing)
npx tsc --noEmit → OK
npm run build   → ✓ built
```
