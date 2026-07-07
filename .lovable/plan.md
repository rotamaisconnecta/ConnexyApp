# Plano: privacidade de proximidade para pessoas até 2 km

## Objetivo
Aplicar a regra de segurança: **pessoas dentro de 2 km não devem exibir sua distância exata**. Em vez das categorias atuais ("Bem pertinho", "Muito perto", "Perto", "Nas redondezas"), esses usuários verão um texto genérico. A distância continua visível normalmente para lugares, eventos e motoristas.

## Decisões já confirmadas
- **Texto substituto:** label genérico (proposta: "Próximo de você" — pode ser ajustado).
- **Escopo:** todas as telas que mostram pessoas (Home, Connecta, Solicitação de chat).
- **Corte:** 2 km (tiers `here`, `veryClose`, `close`, `around` do `proximity.ts`).

## Mudanças

### 1. `src/lib/proximity.ts` — novo helper para pessoas
Criar funções específicas para exibição de proximidade de pessoas:
- `personProximityLabel(meters)`
  - Até 2 km → `"Próximo de você"`
  - Acima de 2 km → mantém o label atual (`proximityLabel`).
- `personProximityRadius(meters)`
  - Até 2 km → retorna `null` (não exibe raio)
  - Acima de 2 km → mantém o raio atual (`proximityRadius`).
- Manter `proximityLabel`, `proximityRadius`, `proximityTone` e `isNearby` inalterados para locais, eventos e motoristas.

### 2. `src/routes/_app.home.tsx` — carrossel "Pessoas próximas"
Substituir `proximityLabel(p.distanceMeters)` por `personProximityLabel(p.distanceMeters)` no carrossel de pessoas.
Resultado: cards de pessoas até 2 km mostram apenas "Próximo de você".

### 3. `src/routes/_app.connecta.tsx` — lista de pessoas
- Usar `personProximityLabel` no badge de proximidade.
- Usar `personProximityRadius` no texto secundário; quando retornar `null`, omitir o "· até X m/km".
- Manter o tom visual (`proximityTone`) para não perder a identificação de cor.

### 4. `src/routes/_app.solicitacao.$id.tsx` — tela de solicitação de chat
- Substituir `proximityLabel` e `proximityRadius` pelos helpers de pessoa.
- Quando a pessoa estiver até 2 km, exibir apenas "Próximo de você" (sem "· até 2 km de você").

### 5. `src/routes/_app.matching.tsx` — motoristas
**Não alterar.** A tela mostra motoristas do RotaMais, não pessoas da rede social. A distância/ETA dos motoristas continua visível para a experiência de corrida.

## Fora do escopo
- Locais, eventos e promoções continuam mostrando a categoria de proximidade normalmente.
- O sistema de tiers e cores em `proximity.ts` não é removido, apenas encapsulado por um helper de privacidade para pessoas.

## Validação
Após implementação:
1. Abrir **Home** → carrossel de pessoas: usuários até 2 km exibem "Próximo de você".
2. Abrir **Connecta** → lista: usuários até 2 km exibem "Próximo de você" sem raio; acima de 2 km mantêm as categorias.
3. Abrir **Solicitação de chat** para uma pessoa até 2 km → header mostra "Próximo de você" sem distância.
4. Confirmar que **Locais** e **Matching** (motoristas) ainda mostram distância normalmente.