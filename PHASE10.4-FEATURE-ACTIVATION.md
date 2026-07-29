# PHASE 10.4 — FEATURE ACTIVATION

## Resultado

| Status | Item |
|--------|------|
| ✓ | Perfil único (sem "Perfil Empresa") |
| ✓ | "Empresa" → "Negócio" na interface |
| ✓ | "Ativar Funcionalidades" → "Expandir meu Connexy" |
| ✓ | Home: banner "Expandir meu Connexy" quando vazio |
| ✓ | Gerenciar: "Painel Administrativo" → "Meus Negócios" |
| ✓ | RoleSwitcher: "Negócio" no lugar de "Empresa" |
| ✓ | RoleHeader: título e subtítulo atualizados |
| ✓ | RoleActivationModal: "Cadastrar Negócio" |
| ✓ | ROLE_BUSINESS mantido internamente |
| ✓ | Build OK |
| ✓ | TypeScript OK |
| ✓ | ESLint OK |

---

## Arquivos Modificados (11)

### 1. `src/lib/roles/roles-utils.ts`

**ROLE_DEFINITIONS** — rótulo e descrição de BUSINESS:

```
Antes:  label: "Empresa",        description: "Publique ofertas e gerencie seu negócio"
Depois: label: "Negócio",        description: "Cadastre sua empresa ou estabelecimento"
```

**getBlockedCategoryMessage** — oferta:

```
Antes:  title: "Cadastre sua empresa",        ctaLabel: "Ativar Empresa"
Depois: title: "Cadastre seu negócio",        ctaLabel: "Ativar Negócio"
```

### 2. `src/components/roles/RoleSwitcher.tsx`

```
Antes:  [UserRole.BUSINESS]: "Empresa"
Depois: [UserRole.BUSINESS]: "Negócio"
```

### 3. `src/components/roles/RoleHeader.tsx`

```
Antes:  title = "ATIVAR FUNCIONALIDADES",               subtitle = "Escolha quais recursos deseja utilizar."
Depois: title = "EXPANDIR MEU CONNEXY",                 subtitle = "Ative novas funcionalidades para sua conta."
```

### 4. `src/components/roles/RoleEmpty.tsx`

```
Antes:  "Ative funcionalidades como Motorista, Empresa ou Organizador..."
        "Ativar funcionalidades"
Depois: "Ative funcionalidades como Negócio, Motorista ou Organizador..."
        "Expandir meu Connexy"
```

### 5. `src/components/roles/RoleActivationModal.tsx`

```
Antes:  title: "Cadastrar Empresa"
        description: "Cadastre sua empresa para publicar ofertas, promoções e divulgar seus serviços."
Depois: title: "Cadastrar Negócio"
        description: "Cadastre sua empresa ou estabelecimento para publicar ofertas e divulgar seus serviços."
```

### 6. `src/routes/_app.profile.tsx`

Card de atalho no perfil:

```
Antes:  "Ativar Funcionalidades" / "Motorista, Empresa, Organizador e mais"
Depois: "Expandir meu Connexy" / "Ative novas funcionalidades para sua conta"
```

### 7. `src/routes/_app/profile/roles.tsx`

Labels de permissão:

```
Antes:  canCreateBusiness: "Criar empresa"
Depois: canCreateBusiness: "Cadastrar negócio"
```

```
Antes:  canAccessBusinessDashboard: "Dashboard empresa"
Depois: canAccessBusinessDashboard: "Dashboard negócio"
```

Texto informativo:

```
Antes:  (Usuário, Motorista ou Empresa) controla a navegação...
Depois: (Usuário, Motorista ou Negócio) controla a navegação...
```

### 8. `src/routes/_app.gerenciar.tsx`

Título e subtítulo:

```
Antes:  "Painel Administrativo" / "Gerencie seu conteudo no Connexy"
Depois: "Meus Negócios" / "Gerencie seus negócios e anúncios no Connexy"
```

### 9. `src/routes/_app.home.tsx`

Categoria de busca:

```
Antes:  { label: "Empresas", ... }
Depois: { label: "Negócios", ... }
```

Banner condicional adicionado entre a busca e o SmartFeed quando nenhuma funcionalidade extra está ativa:

```
hasExtraRoles = stored.roles.some((r) => r !== UserRole.USER)

Se false → renderiza "Expandir meu Connexy" → /profile/roles
Se true  → não renderiza (já tem funcionalidades ativas)
```

---

## Fluxo

### Antes
```
Perfil
  └── Ativar Funcionalidades
        ├── 🚗 Motorista
        ├── 🏢 Empresa        ← "Empresa" como perfil visível
        ├── 🎉 Organizador
        ├── 📍 Local
        └── 🎬 Criador

BottomNav
  └── mostra "Empresa" como modo

Gerenciar
  └── "Painel Administrativo"
```

### Depois
```
Perfil
  └── Expandir meu Connexy
        ├── 🚗 Oferecer Corridas
        ├── 🏢 Cadastrar Negócio   ← "Negócio" (não "Empresa")
        ├── 🎉 Organizar Eventos
        ├── 📍 Cadastrar Local
        └── 🎬 Criador (mantido)

BottomNav
  └── mostra "Negócio" como modo   ← sem "Empresa"

Gerenciar
  └── "Meus Negócios"

Home (quando vazio)
  └── "Expandir meu Connexy" banner → /profile/roles
```

### Internamente
```
ROLE_BUSINESS continua usado em:
  - roles-types.ts (enum)
  - roles-utils.ts (permissions)
  - roles-engine.ts (config)
  - roles-guards.ts (guards)
  - roles-mocks.ts (mock data)
```

---

## Validação

```bash
npm run lint    → 0 errors, 16 warnings (pre-existing)
npx tsc --noEmit → exit 0 (OK)
npm run build   → ✓ built
```
