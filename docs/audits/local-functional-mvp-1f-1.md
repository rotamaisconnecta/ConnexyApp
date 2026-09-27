# Fase 1F-1 — Explore / Locais, fechamento do fluxo local

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1E (245 testes / 941 assertions).

## 1. Problema original (1E)

P1 de Explore / Locais:

1. A busca visual de `/locais` aceitava texto, mas **não filtrava** (`<input>` sem `value`/`onChange`). “Burger” não alterava a lista.
2. O filtro de Eventos no Discover funcionava, mas clicar em **Sunset no Parque** permanecia em `/discover`.
3. Favorito no detalhe de local persistia em `connexy:demo:saved-details`. Favorito de negócio (♥) era só estado React.
4. Ir juntos gravava o convite e deixava o usuário preso em **Aguardando aceites** (`disabled`), como se a corrida pudesse avançar.

## 2. Causa encontrada

- `/locais` filtrava só por categoria. O campo de busca era decorativo.
- Os cards de Discover navegavam pessoas, locais e negócios. O ramo `eventos` não existia. Os itens usavam `id: evt-${place.id}` (`evt-sunset-parque`), sem `targetId`.
- A rota `/event/$eventId` já existia e o Feed já abria `/event/ev1`. O Discover lia o catálogo `places` (`sunset-parque`), que **não estava** no lookup do detalhe de evento.
- `business.$businessId.tsx` fazia `setBusiness({ isFavorite })` sem gravar. O “Salvar” de `DetailActionBar` já usava `connexy:demo:saved-details`.
- Após enviar o convite, o CTA de corrida ficava `disabled` com `companions: []`. Não há aceite local nesta fase.

## 3. Solução aplicada

Alterações mínimas sobre o catálogo e a persistência já existentes.

### Busca `/locais`

`filterNearbyPlaces()` no catálogo `places`: trim, case-insensitive, nome/categoria/descrição/promo/endereço. Combina com o filtro de categoria. Busca vazia restaura o filtro atual. Lista vazia mostra “Nenhum local encontrado”.

### Eventos do Discover

`getDiscoverItemNavigation()` passa a tratar `eventos` → `/event/$eventId` com o id do lugar (`sunset-parque`). `resolveLocalEventById()` reutiliza o lookup já usado pelo detalhe (`MOCK_EVENTS`, extras, `HOME_EVENTS`, engine) **e** os `places` com categoria `Eventos`, sem criar catálogo novo. Voltar usa `history.back()`.

### Favorito de negócio

Uma fonte: `connexy:demo:saved-details`. Helpers extraídos para `saved-details.ts` (mesma chave). O ♥ do negócio e o “Salvar” do detalhe leem/gravam essa lista. IDs existentes (`b1`, `cafe-central`, …). Sem duplicar no reload.

### Ir juntos

Não foi implementado aceite nem corrida. O convite continua em `connexy:demo:outing-invites`. O CTA morto “Aguardando aceites” foi trocado por **Convite enviado**, com o texto “Aguardando resposta. A corrida só fica disponível depois do aceite.” O usuário consegue fechar o sheet.

## 4. Fonte canônica utilizada

| Dado | Fonte |
| --- | --- |
| Locais / busca | `places` em `src/lib/mock-data.ts` |
| Eventos Discover | mesmos `places` com `category === "Eventos"` |
| Detalhe de evento | lookup existente + lugares-evento, rota `/event/$eventId` |
| Favoritos | `connexy:demo:saved-details` |
| Outing invites | `connexy:demo:outing-invites` (inalterada) |

## 5. Persistência utilizada

Nenhuma chave nova. Nenhuma store/IndexedDB/repository novos.

- Favoritos: `localStorage` `connexy:demo:saved-details`
- Convites Ir juntos: `localStorage` `connexy:demo:outing-invites`

## 6. Testes

Focados: `tests/persist-phase-1f-1.test.ts` e `tests/persist-phase-1f-1-browser.test.ts`.

Cobertura: busca por nome, case-insensitive, vazia, busca+filtro, vazio; Sunset no Discover, navegação, detalhe, voltar; favoritar/desfavoritar/reload/sem duplicar.

Suíte completa: **257 pass / 995 assertions / 0 fail**.

## 7. Browser validation

Vite em `http://localhost:8080` com sessão demo (Lucas).

| Cenário | Resultado |
| --- | --- |
| `/locais` → “Burger” | só Burger House |
| Filtro Cafés + busca Burger | empty state honesto |
| Limpar busca com Cafés | só Café Central |
| Discover → Eventos → Sunset | `/event/sunset-parque` com nome, imagem, local, Pedir corrida |
| Voltar | `/discover` |
| Café Central → Salvar → Home → voltar → reload | Salvo / `["cafe-central"]` |
| Desfavoritar local → reload | Salvar / `[]` |
| `/business/b1` ♥ | mesma chave; Salvar acompanha; sobrevive reload; desfavoritar permanece |
| Ir juntos → Beatriz → enviar | Convite enviado; Pendente; sem CTA de corrida ativo |

## 8. Pendências

- Aceite social de Ir juntos e habilitação da corrida: fase própria.
- Seguir negócio e Participar de evento continuam React (fora do escopo).
- Duplicidade residual de nome: `sunset-parque` (Discover/`places`) e `ev1` (Feed/`HOME_EVENTS`) são fixtures distintas com o mesmo título. Não foram fundidas.

## 9. Duplicidade residual

Nenhuma fonte paralela criada. O flag `isFavorite` do catálogo `MOCK_BUSINESSES` não é mais a verdade do usuário; o estado canônico é `saved-details`.

## 10. Validação

- Typecheck: PASS
- Build: PASS
- Lint dos arquivos alterados: PASS
- Lint global: não corrigido (baseline 1E)
- Supabase: não acessado nem alterado
- 1D-1…1D-5: intactos
- Commit/push: não realizados
