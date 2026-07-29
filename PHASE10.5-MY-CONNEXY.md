# PHASE 10.5 — MY CONNEXY EXPERIENCE

## Objetivo
Eliminar todos os conceitos visíveis de "Ativar", "Role" e "Perfil Empresa". O sistema ativa funções automaticamente quando o usuário cria recursos (negócio, evento, local, oferta, corrida). O usuário vê apenas uma experiência natural de "Meu Connexy".

## O que mudou

### 1. Renomeações globais
- `"Expandir meu Connexy"` → `"Meu Connexy"` em todos os lugares
- `"Funcionalidades"` → `"Meu Connexy"` (título da página)
- Botão `"Ativar"` → `"Criar"` / `"Criar Negócio"` / `"Criar Evento"` etc.
- `"Ativar agora"` → `"Criar agora"` / `"Começar a dirigir"`

### 2. RoleSelector (`src/components/roles/RoleSelector.tsx`)
- Removeu `toggleRole()` — agora navega diretamente para rotas de criação
- Mantém `roleChanged` listener para sincronizar estado
- Rotas de criação mapeadas:
  - `BUSINESS` → `/create/place-business`
  - `EVENT_CREATOR` → `/create/event`
  - `PLACE_OWNER` → `/create/place`
  - `DRIVER` → `/driver`
  - `REELS_CREATOR` → `/create/reel`

### 3. RoleCard (`src/components/roles/RoleCard.tsx`)
- Botão `"Ativar"` → `"Criar Negócio"` / `"Criar Evento"` / `"Criar Local"` / `"Começar a Dirigir"` / `"Criar Reel"`
- Removeu botão `"Desativar"` — se ativo, mostra `"Gerenciar"`
- Removeu lógica de toggle; onClick apenas navega

### 4. RoleActivationModal (`src/components/roles/RoleActivationModal.tsx`)
- Removeu `addRole()` + `setActiveMode()` — agora navega para criação
- Títulos mudaram: `"Quero ser Motorista"` → `"Vamos começar a dirigir"`, `"Cadastrar Negócio"` → `"Vamos criar seu negócio"`, etc.
- Botão `"Ativar agora"` → `"Começar a dirigir"` / `"Criar negócio"` / etc.
- `"Cancelar"` → `"Agora não"`

### 5. RoleHeader (`src/components/roles/RoleHeader.tsx`)
- Título default: `"MEU CONNEXY"`
- Subtítulo: `"Crie e gerencie seus negócios, eventos e locais."`

### 6. Página Meu Connexy (`src/routes/_app/profile/roles.tsx`)
- Título: `"Meu Connexy"` (antes `"Funcionalidades"`)
- Removeu `RoleSwitcher`, `RoleBadge`, tabela de permissões
- Removeu info box de "ativar funções"
- Mostra apenas `RoleHeader` + `RoleSelector`

### 7. Perfil (`src/routes/_app.profile.tsx`)
- Link `"Expandir meu Connexy"` → `"Meu Connexy"`
- Subtítulo: `"Crie e gerencie seus negócios, eventos e locais"`

### 8. Home (`src/routes/_app.home.tsx`)
- Banner `"Expandir meu Connexy"` → `"🚀 Meu Connexy"`
- Subtítulo: `"Crie seu negócio, publique ofertas e muito mais"`

### 9. Gerenciar → Meu Connexy Dashboard (`src/routes/_app.gerenciar.tsx`)
- Substituído por dashboard com seções:
  - Negócios / Eventos / Locais / Promoções / Mobilidade
  - Cada seção: se ativa → "Gerenciar", se inativa → "Criar" (com fundo colorido)
  - Badges mostrando recursos ativos
  - Grid de criação rápida (Foto, Vídeo, Texto, Reel)
- Child routes (`/gerenciar/novo-*`) preservadas via `<Outlet />`

### 10. Página de Criação (`src/routes/_app/create.tsx`)
- Badge `"Ativar"` em itens bloqueados → `"Criar"`

### 11. Roles Engine (`src/lib/roles/roles-engine.ts`)
- Locked reasons atualizados para mensagens de criação:
  - `"Ative a função Organizador"` → `"Crie seu primeiro evento"`
  - `"Cadastre-se como motorista para oferecer caronas"` → `"para oferecer corridas"`
  - `"Ative a função Proprietário"` → `"Cadastre seu primeiro local"`

### 12. Roles Utils (`src/lib/roles/roles-utils.ts`)
- `getBlockedCategoryMessage` — todas as mensagens e CTAs atualizados:
  - CTA `"Ativar Negócio"` → `"Criar Negócio"` (rota: `/create/place-business`)
  - CTA `"Ativar Organizador"` → `"Criar Evento"` (rota: `/create/event`)
  - CTA `"Ativar Proprietário"` → `"Cadastrar Local"` (rota: `/create/place`)
  - CTA `"Ativar Motorista"` → `"Ser Motorista"` (rota: `/driver`)

## Arquivos modificados
1. `src/components/roles/RoleCard.tsx` — botões "Criar" / "Gerenciar"
2. `src/components/roles/RoleSelector.tsx` — navegação direta, sem toggle
3. `src/components/roles/RoleActivationModal.tsx` — criação-first
4. `src/components/roles/RoleHeader.tsx` — título "MEU CONNEXY"
5. `src/routes/_app.profile.tsx` — link "Meu Connexy"
6. `src/routes/_app/profile/roles.tsx` — página simplificada
7. `src/routes/_app.home.tsx` — banner "🚀 Meu Connexy"
8. `src/routes/_app.gerenciar.tsx` — dashboard Meu Connexy
9. `src/routes/_app/create.tsx` — badge "Criar"
10. `src/lib/roles/roles-engine.ts` — locked reasons
11. `src/lib/roles/roles-utils.ts` — blocked messages + CTAs

## Não alterado
- AI Engine, Live Engine, Context Engine, Orchestrator, Publisher Engine, Feed Engine
- Sistema interno de roles (UserRole, roles-storage, addRole, toggleRole) — continua igual, apenas invisível para o usuário
- BottomNav — já limpo no Phase 10.4

## Verificação
- `npx tsc --noEmit` — sem erros
- `npm run lint` — 0 erros, warnings pré-existentes
