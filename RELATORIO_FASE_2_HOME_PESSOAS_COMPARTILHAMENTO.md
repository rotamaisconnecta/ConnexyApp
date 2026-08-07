# RELATÓRIO — FASE 2: Home compacta, Pessoas Próximas com afinidades e compartilhamento

> ConnexyApp · Implementado sem migrations, sem RPCs, sem RLS, sem ativar Orchestrator/Live Engine/IA e sem instalar novas dependências. Todos os dados continuam simulados (`src/lib/mock-data.ts` e estado local em `localStorage`).

## Resumo

1. **Pessoas Próximas** agora exibe apenas pessoas elegíveis para descoberta e mostra afinidades reais com o `currentUser` (chips de interesses/lugares/vibe + badge de compatibilidade).
2. **Home compactada**: cards de pessoas (~160 px) e de eventos/locais (~220 px) com imagem de 112 px, mantendo responsividade e `prefers-reduced-motion`.
3. **Compartilhamento do Connexy**: card "Convidar para o Connexy" com WhatsApp (codificado), copiar link e share nativo, na Home e no Perfil.
4. **Tagline institucional** "Seu ecossistema digital" uma única vez na Home.

## Arquivos novos

| Arquivo | Papel |
|---|---|
| `src/lib/feed/commonalities.ts` | `getCommonalities()` (afinidades ordenadas) + `shouldShowNearbyPerson()` (regra de exclusão de descoberta). Pure TS, SSR-safe. |
| `src/lib/share/share-connexy.ts` | `getConnexyAppUrl()` (env → origin), `getWhatsAppShareUrl()`, `copyConnexyLink()`, `shareConnexy()`, `supportsNativeShare()`. |
| `src/components/share/connexy-invite-card.tsx` | Card "Convidar para o Connexy" (WhatsApp/copiar/nativo) com `aria-label` e feedback via `sonner`. |

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/feed/home-premium.ts` | `PremiumCard` ganha `commonalities`; `buildNearbyPeople()` e `peopleToCards()` filtram por `shouldShowNearbyPerson` e anexam `getCommonalities`. |
| `src/lib/feed/feed-types.ts` | `NearbyPeopleSectionData.people` ganha `commonalities?: { labels; total }`. |
| `src/components/carousel/PremiumCarousel.tsx` | Novas props opcionais `cardWidths` (por breakpoint) e `cardHeight` por seção; defaults preservados. |
| `src/components/feed/FeedNearbyPeople.tsx` | Card compacto (160–176 px × 252 px), imagem 112 px, badge de compatibilidade com `aria-label`, chips de afinidades (máx. 3 + "+N"). |
| `src/components/feed/FeedNearbyEvents.tsx` | Card compacto (216–232 px × 240 px), imagem 112 px, paddings/CTAs reduzidos. |
| `src/components/feed/FeedNearbyPlaces.tsx` | Card compacto (216–232 px × 240 px), imagem 112 px, paddings/CTAs reduzidos. |
| `src/components/feed/FeedTrending.tsx` | Carrossel 240–256 px × 380 px com `PremiumCardView compact`. |
| `src/components/feed/FeedRecommendations.tsx` | Carrossel 240–256 px × 380 px com `PremiumCardView compact`. |
| `src/components/feed/cards/premium-card.tsx` | Variante `compact` (padding/CTA menores) e linha "N coisas em comum" para cards `person`. |
| `src/routes/_app.home.tsx` | Tagline "Seu ecossistema digital" sob o logo + `<ConnexyInviteCard />` após a busca. |
| `src/routes/_app.profile.tsx` | `<ConnexyInviteCard compact />` na seção "Meu Connexy". |

## Regras de afinidades (`getCommonalities`)

Ordem de exibição (nada vazio é renderizado):

1. **Interesses** em comum (`person.interests ∩ currentUser.interests`);
2. **Categorias favoritas** em comum (categoria dos `favoritePlaceIds` do usuário que também aparece nos favoritos da pessoa);
3. **Lugares favoritos** em comum (mesmo `favoritePlaceIds`);
4. **Vibe** em comum (`vibeTags`);
5. **Conexão ativa** (se já conectado).

O card da Home mostra até 3 chips + "+N" (quantos afinidades além dos 3). Cards de pessoa em `/people` e "Em Alta" mostram "N coisa(s) em comum". Exemplo real do mock: Beatriz ≈ 8 afinidades (Música, Viagens, Cafés, Lojas, Café Central, Vinil & Cia, explorador de bairro, Conexão ativa); Marina 0 (nenhum chip).

## Regra de exclusão de descoberta (`shouldShowNearbyPerson`)

Exclui da "Pessoas Próximas" (Home, `/people`, carrossel, "Em Alta"):

- o próprio usuário (`currentUser.id`);
- perfis **conectados** (`getConversationId` / `MOCK_CONNECTED` e status armazenado `connected`);
- **pendentes** de convite (`MOCK_INVITED` e status armazenado `invited`);
- **bloqueados** e **ocultados** (chaves de reserva `connexy.mock.blocked-person-ids` / `connexy.mock.hidden-person-ids` no `localStorage`, vazias hoje — nenhum mecanismo de bloqueio existe ainda no produto);
- convites **recusados** permanecem visíveis (podem ser reenviados pelo botão).

**Resultado com o mock atual:** Pessoas Próximas exibe Carlos (1,4 km), Marina (3,2 km) e Diego (9,8 km). Beatriz/Rafael (conectados) e Juliana (convite pendente) saem das descobertas. *Observação:* a `MOCK_CONVERSATIONS` representa a lista de conversas existentes e é mais ampla que o modelo de conexões/convites; a filtragem usa o estado de conexão/convite como fonte de verdade ("fios de conexão"), para não esvaziar a seção.

## Tamanhos compactados

| Seção | Largura (mobile/tablet/desktop) | Altura | Imagem |
|---|---|---|---|
| Pessoas Próximas | 160 / 168 / 176 px | 252 px | 112 px |
| Eventos / Locais | 216 / 224 / 232 px | 240 px | 112 px |
| Em Alta / Recomendações | 240 / 248 / 256 px | 380 px | 57% (compact) |

O carrossel continua respeitando `prefers-reduced-motion` (`@/lib/carousel/hint`) — navegação sem animação quando `reduce` está ativo.

## Compartilhamento

- **URL base**: `import.meta.env.VITE_APP_URL` (não definido no `.env` hoje) → fallback `window.location.origin` → `https://connexy.app` (SSR).
- **Mensagem**: "Vem fazer parte do Connexy comigo — o ecossistema que conecta pessoas, lugares e momentos ao redor de você." + URL.
- **WhatsApp**: `https://wa.me/?text=<encodeURIComponent(...)>`, link aberto com `target="_blank"` e `rel="noopener noreferrer"`.
- **Copiar link**: `navigator.clipboard` com fallback `document.execCommand("copy")`; feedback de sucesso/falha via toast.
- **Share nativo**: `navigator.share` quando disponível; cancelamento (`AbortError`) não gera erro.
- Acessibilidade: botões nativos com `aria-label`; feedback claro de sucesso/falha/cancelamento.

## Validação

- `npx tsc --noEmit` → **sem erros**.
- `npm run build` → **sucesso** (client + nitro/SSR).
- `npm run lint` → nenhum erro novo nos arquivos tocados (repositório já possuía erros `prettier/prettier` pré-existentes em arquivos não relacionados; os 3 introduzidos foram corrigidos com `prettier --write`).
- Teste de runtime dos dados (módulos reais carregados com alias `@/`): filtragem correta (3 pessoas), afinidades verdadeiras, badge de compatibilidade presente, `wa.me/?text=` codificado, transformação Vite dos novos módulos servida sem erros.

## Pendências / observações

- Não existe mecanismo de bloqueio/ocultação no produto; as chaves `connexy.mock.blocked-person-ids` / `connexy.mock.hidden-person-ids` foram previstas e são lidas de forma defensiva.
- Dimensão "eventos" de afinidades mapeia para o interesse compartilhado "Eventos" (não há dados de participação de eventos por pessoa no mock).
- Sem git ops realizados (nada commitado/pushado).
