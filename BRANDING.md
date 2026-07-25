# CONNEXY — Branding System

> Visão completa do sistema de branding oficial do Connexy.

---

## Arquitetura

```
src/theme/                    → Tokens puros (TypeScript, sem React)
src/lib/branding/             → Barrel re-export + config de marca
src/components/ui/brand-*     → Componentes React oficiais
src/components/ui/app-icon.tsx→ Ícone oficial do app
```

### Camadas

| Camada | Local | Responsabilidade |
|--------|-------|-----------------|
| Tokens | `src/theme/` | Cores, gradientes, tipografia, espaçamentos, radius, sombras, animações, ícones |
| Config | `src/lib/branding/brand-config.ts` | Re-export barrel + objetos `Brand`, `Logo`, `Theme` |
| Tokens centralizados | `src/lib/branding/brand-tokens.ts` | `BRAND_TOKENS` unificado |
| Regras | `src/lib/branding/branding-rules.ts` | Documentação do que é proibido/permitido |
| Provider | `src/components/ui/brand-provider.tsx` | Context React com tokens + logo + tema |
| Componentes | `src/components/ui/brand-*.tsx` | Componentes visuais oficiais |

---

## Logo e Ícone

| Arquivo | Uso |
|---------|-----|
| `src/assets/connexy-logo.png` | Logo principal (wordmark) |
| `src/assets/connexy-icon.png` | Ícone do app |

### Componentes para renderizar

```tsx
import { BrandLogo } from "@/components/ui/brand-logo";
import { AppIcon } from "@/components/ui/app-icon";

// Logo full
<BrandLogo size="lg" variant="full" />

// Ícone do app
<AppIcon size="lg" animated />

// Ícone com prioridade de carregamento
<AppIcon size="xl" priority />
```

### Regras

- **NUNCA** usar "Connexa" (nome antigo)
- **NUNCA** usar "C" ou "+" como placeholder de ícone
- **NUNCA** usar SVG temporário ou imagem de placeholder
- **SEMPRE** usar `<AppIcon />` ou `<BrandLogo />`
- **NUNCA** importar diretamente de `@/assets/connexy-*.png`

---

## Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `Colors.brand.primary` | `#6C3BFF` | Cor principal da marca |
| `Colors.brand.secondary` | `#8B5CFF` | Cor secundária |
| `Colors.brand.light` | `#A88DFF` | Versão clara |
| `Colors.brand.dark` | `#4B21D6` | Versão escura |
| `Colors.background` | `#FFFFFF` | Fundo geral |
| `Colors.surface` | `#F8F8FC` | Superfície elevada |
| `Colors.card` | `#FFFFFF` | Fundo de cards |
| `Colors.border` | `#E7E7F2` | Bordas |
| `Colors.text.primary` | `#18181B` | Texto principal |
| `Colors.text.secondary` | `#71717A` | Texto secundário |
| `Colors.success` | `#22C55E` | Sucesso |
| `Colors.warning` | `#F59E0B` | Aviso |
| `Colors.danger` | `#EF4444` | Erro/perigo |

### Uso

```tsx
import { Colors } from "@/theme";

// Em style prop
<div style={{ color: Colors.text.primary }}>

// Em classes Tailwind (via CSS variables)
className="text-foreground"
```

---

## Gradientes

| Token | Valor |
|-------|-------|
| `Gradients.primary` | `linear-gradient(135deg, #6C3BFF, #8B5CFF)` |
| `Gradients.premium` | `linear-gradient(135deg, #7C3AED, #A855F7)` |
| `Gradients.cta` | `linear-gradient(135deg, #5B2EFF, #A855F7)` |
| `Gradients.soft` | `linear-gradient(180deg, #F4F1FF, #FFFFFF)` |

### Uso

```tsx
import { Gradients } from "@/theme";

// Em style prop
<div style={{ background: Gradients.primary }}>

// Ou usando o componente
import { BrandGradient } from "@/components/ui/brand-gradient";
<BrandGradient variant="primary">...</BrandGradient>
```

### Utility classes

```css
.bg-gradient-brand   /* primary */
.bg-gradient-social  /* social/premium */
```

---

## Tipografia

| Token | Peso | Classe |
|-------|------|--------|
| `Typography.display` | 700 | `font-display font-bold` |
| `Typography.title` | 600 | `font-semibold` |
| `Typography.headline` | 600 | `font-semibold` |
| `Typography.body` | 400 | `font-normal` |
| `Typography.caption` | 500 | `font-medium` |
| `Typography.button` | 600 | `font-semibold` |

### Fontes

- Display: **Space Grotesk**
- Body: **Inter**

---

## Espaçamentos

| Token | Valor |
|-------|-------|
| `Spacing.xs` | `4px` |
| `Spacing.sm` | `8px` |
| `Spacing.md` | `12px` |
| `Spacing.lg` | `16px` |
| `Spacing.xl` | `20px` |
| `Spacing["2xl"]` | `24px` |
| `Spacing["3xl"]` | `32px` |
| `Spacing["4xl"]` | `40px` |
| `Spacing["5xl"]` | `48px` |
| `Spacing["6xl"]` | `64px` |

---

## Border Radius

| Token | Valor |
|-------|-------|
| `Radius.sm` | `12px` |
| `Radius.md` | `18px` |
| `Radius.lg` | `24px` |
| `Radius.xl` | `32px` |
| `Radius.floating` | `9999px` |

---

## Sombras

| Token | Valor |
|-------|-------|
| `Shadows.soft` | `0 2px 8px rgba(0,0,0,0.04)` |
| `Shadows.medium` | `0 4px 16px rgba(0,0,0,0.08)` |
| `Shadows.large` | `0 8px 32px rgba(0,0,0,0.12)` |
| `Shadows.floatingButton` | `0 8px 24px rgba(108,59,255,0.35)` |
| `Shadows.premiumCard` | `0 8px 32px rgba(108,59,255,0.15)` |
| `Shadows.glow` | `0 0 26px rgba(108,59,255,0.2)` |

---

## Animações

| Token | Descrição |
|-------|-----------|
| `Animations.fade` | Fade in/out |
| `Animations.slideUp` | Slide de baixo para cima |
| `Animations.slideDown` | Slide de cima para baixo |
| `Animations.scale` | Scale com fade |
| `Animations.hero` | Animação de destaque |
| `Animations.bottomSheet` | Bottom sheet spring |
| `Animations.cardHover` | Hover de card |
| `Animations.floatingButton` | Botão flutuante |
| `Animations.buttonPress` | Efeito de press |

---

## Componentes Oficiais

### Layout

| Componente | Descrição |
|------------|-----------|
| `BrandScreen` | Container de tela com safe area |
| `BrandBackground` | Fundo com variantes (default/surface/gradient) |
| `BrandHeader` | Header com logo/título |
| `BrandFooter` | Footer com borda |
| `BrandSection` | Seção com título |
| `BrandDivider` | Divisor horizontal |

### Conteúdo

| Componente | Descrição |
|------------|-----------|
| `BrandLogo` | Logo oficial (full/icon) |
| `AppIcon` | Ícone oficial do app |
| `BrandIcon` | Ícone genérico |
| `BrandCard` | Card com sombra |
| `BrandPageTitle` | Título + subtítulo |

### Input

| Componente | Descrição |
|------------|-----------|
| `BrandButton` | Botão com variantes |
| `BrandInput` | Input com label/erro |
| `BrandAvatar` | Avatar com status online |
| `BrandBadge` | Badge com variantes |

### Visual

| Componente | Descrição |
|------------|-----------|
| `BrandGradient` | Container com gradiente |

---

## Boas Práticas

1. **Sempre importar tokens de `@/theme`** ou `@/lib/branding/brand-config`
2. **Nunca usar hex hardcoded** em componentes — usar tokens
3. **Nunca usar `rgba()` inline** — usar shadows/tokens
4. **Nunca importar imagens diretamente** — usar `<BrandLogo>` ou `<AppIcon>`
5. **Preferir componentes brand** em vez de HTML raw
6. **Usar `style` props** para valores dinâmicos dos tokens
7. **Usar utility classes** do Tailwind quando possível

---

## Exemplo: Criando uma Nova Tela

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { BrandScreen, BrandCard, BrandButton, BrandAvatar, BrandBadge } from "@/components/ui";
import { AppIcon } from "@/components/ui/app-icon";
import { Colors, Gradients, Radius } from "@/theme";

export const Route = createFileRoute("/nova-tela")({
  component: NovaTela,
});

function NovaTela() {
  return (
    <BrandScreen>
      <AppIcon size="lg" />

      <BrandCard shadow="medium">
        <BrandAvatar src={user.photo} alt={user.name} size="lg" online />
        <BrandBadge variant="success">Ativo</BrandBadge>
      </BrandCard>

      <BrandButton variant="primary" size="lg">
        Ação Principal
      </BrandButton>
    </BrandScreen>
  );
}
```

---

## Fluxo para Novas Telas

1. Usar `<BrandScreen>` como container
2. Usar `<BrandCard>` para cards
3. Usar `<BrandButton>` para botões
4. Usar `<BrandInput>` para inputs
5. Usar `<BrandAvatar>` para avatares
6. Usar `<BrandBadge>` para badges
7. Usar `<AppIcon>` ou `<BrandLogo>` para ícones/logos
8. Importar cores de `Colors` do `@/theme`
9. Importar gradientes de `Gradients` do `@/theme`
10. Importar sombras de `Shadows` do `@/theme`
