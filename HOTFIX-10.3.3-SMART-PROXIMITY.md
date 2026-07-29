# HOTFIX 10.3.3 — SMART PROXIMITY + PREMIUM CAROUSELS V2

## Resultado

| Status | Item |
|--------|------|
| ✓ | Pessoas até 2 km não exibem distância real |
| ✓ | Pessoas usam categorias inteligentes |
| ✓ | Eventos continuam mostrando distância |
| ✓ | Locais continuam mostrando distância |
| ✓ | Negócios continuam mostrando distância |
| ✓ | Carrosséis premium mantidos |
| ✓ | Build OK |
| ✓ | TypeScript OK |
| ✓ | ESLint OK |

---

## 1 — Pessoas Próximas

**`src/lib/proximity.ts`** — Nova função `formatPersonDistance(meters)`:

| Distância | Exibição |
|-----------|----------|
| 0–100 m | `📍 Muito perto` |
| 100–300 m | `📍 Bem próximo` |
| 300–700 m | `📍 Na sua região` |
| 700 m–2 km | `📍 Perto de você` |
| > 2 km | `2,3 km` / `5,1 km` / `12 km` |

**`src/components/feed/FeedNearbyPeople.tsx`** — Removeu funções inline `distanceColor`/`distanceLabel`. Agora usa `formatPersonDistance(person.distanceMeters)`.

**`src/lib/feed/feed-types.ts`** — Adicionado `distanceMeters: number` ao tipo `NearbyPeopleSectionData.people`.

**`src/lib/feed/feed-sections.ts`** — Mock data atualizado com `distanceMeters`.

## 2 — Eventos

**`src/components/feed/FeedNearbyEvents.tsx`**:
- 📍 Nome do local (via novo campo `location`)
- 🕐 Horário (já existia)
- 👥 Participantes (já existia)
- Distância mantida (ex: `320 m`, `1,4 km`, `7 km`)

**`src/lib/feed/feed-types.ts`** — Adicionado `location: string` ao tipo `NearbyEventsSectionData.events`.

## 3 — Locais

**`src/components/feed/FeedNearbyPlaces.tsx`**:
- ⭐ Avaliação (já existia)
- Aberto / Fecha às 22h (já existia)
- Categoria (já existia)
- Distância mantida

## 4 — Negócios

**`src/components/feed/FeedNearbyBusinesses.tsx`**:
- Oferta principal (`offer`) exibida como badge gradiente no canto superior esquerdo
- Exemplos: `20% OFF`, `Frete grátis`, `Promoção hoje`

**`src/lib/feed/feed-types.ts`** — Adicionado `offer?: string` ao tipo `NearbyBusinessesSectionData.businesses`.

## 5 — Premium Carousel

**`src/components/carousel/PremiumCarousel.tsx`**:
- ✅ Snap perfeito (spring mais firme: stiffness 300, damping 30)
- ✅ Autoplay (5s, pausa ao interagir, retoma após 5s)
- ✅ Loop infinito (triplica items, jump reset)
- ✅ Swipe (drag com framer-motion)
- ✅ Desktop: setas visíveis no hover (`group` adicionado ao container)
- ✅ Mobile: swipe apenas

## 6 — Cards Padronizados

| Propriedade | Valor |
|-------------|-------|
| Altura | `h-full` com `flex flex-col` |
| Bordas | `border border-border/50 rounded-2xl` |
| Sombra | `shadow-soft` no estado normal |
| Sombra hover | `hover:shadow-elegant` |
| Padding | `p-2.5` |
| Transição | `transition-all duration-200` |

## 7 — Animações

- **Hover:** `hover:shadow-elegant`, `hover:scale-105` (icones)
- **Click:** `active:scale-[0.98]` em cards, `active:scale-[0.97]` em CTAs
- **Entrada:** `motion.div` com `initial={{ opacity: 0, y: 14 }}` + stagger via `PremiumCarousel`

## 8 — Home (ordem mantida)

```
1. Hero
2. Área em Alta
3. 👥 Pessoas Próximas
4. 📍 Locais Próximos
5. 🎉 Eventos Hoje
6. 📅 Eventos Próximos
7. 🏢 Negócios Próximos
8. 🔥 Em Alta
9. Footer
```

Ordem definida em `src/lib/feed/feed-builder.ts` (template CITY).

## 9 — Ver Todas (rotas)

| Seção | Rota |
|-------|------|
| Pessoas | `/pessoas` |
| Locais | `/locais` |
| Eventos Hoje | `/feed`* |
| Eventos Próximos | `/feed`* |
| Negócios | `/marketplace` |

_* Rotas `/events/today` e `/events` serão criadas em PR futura._

## 10 — Preparação para Supabase

**`formatPersonDistance(meters: number): string`** em `src/lib/proximity.ts`:

```typescript
export function formatPersonDistance(meters: number): string {
  for (const cat of PERSON_DISTANCE_CATEGORIES) {
    if (meters <= cat.max) {
      return `📍 ${cat.label}`;
    }
  }
  return formatDistance(meters);
}
```

Quando a distância real vier do banco (Supabase), **nenhuma tela precisará ser alterada** — basta passar o valor em metros.

---

## Arquivos Modificados

| Arquivo | Tipo |
|---------|------|
| `src/lib/proximity.ts` | Helper |
| `src/lib/feed/feed-types.ts` | Types |
| `src/lib/feed/feed-sections.ts` | Mock data |
| `src/components/feed/FeedNearbyPeople.tsx` | UI |
| `src/components/feed/FeedNearbyPlaces.tsx` | UI |
| `src/components/feed/FeedNearbyEvents.tsx` | UI |
| `src/components/feed/FeedNearbyBusinesses.tsx` | UI |
| `src/components/feed/FeedNearbyDrivers.tsx` | UI |
| `src/components/carousel/PremiumCarousel.tsx` | UI |

## Validação

```bash
npm run lint    → 0 errors, 16 warnings (pre-existing)
npx tsc --noEmit → OK
npm run build   → ✓ built
```
