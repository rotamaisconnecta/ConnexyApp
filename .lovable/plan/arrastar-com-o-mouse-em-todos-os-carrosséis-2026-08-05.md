# Arrastar com o mouse em todos os carrosséis

Hoje só o carrossel premium da Home responde a arrastar. Todas as outras faixas horizontais (filtros, galerias, promoções, abas roláveis, etc.) só rolam com trackpad, roda ou toque — clicar e arrastar com o mouse não faz nada.

## O que vai mudar

- Criar um comportamento único de "clicar e arrastar para rolar" e aplicá-lo a todas as faixas horizontais do app.
- Cursor muda para mãozinha (grab / grabbing) enquanto arrasta.
- Arrastar não dispara clique acidental: se o ponteiro se moveu além de um pequeno limite, o clique no card/filtro é cancelado.
- Rolagem vertical da página continua normal; toque no celular segue como já é hoje.
- No carrossel premium, o arrastar existente ganha a mesma proteção contra clique acidental (hoje arrastar sobre um card pode abrir o perfil/local).

## Onde se aplica

Faixas horizontais em: filtros e categorias (locais, marketplace, notificações, feed), abas roláveis, promoções, galeria de negócios, destinos favoritos, seletor de tipo de corrida, hashtags de reels, sheet de pessoa, seletor de emoji, scroller genérico do sistema e o carrossel base do sistema.

## Detalhes técnicos

- Novo hook `src/hooks/system/use-drag-scroll.ts`: retorna uma `ref` e handlers de `pointerdown/move/up/cancel`, usando `setPointerCapture`, ajuste de `scrollLeft`, limite de 6px para distinguir clique de arraste e `click` capture-phase para bloquear o clique após arraste. Ignora `pointerType === "touch"` (rolagem nativa) e alvos de input/range.
- Aplicar o hook dentro de `src/components/system/horizontal-scroller.tsx` (cobre os usos que já passam por ele) e nos componentes que declaram `overflow-x-auto` diretamente — os 24 locais mapeados nos arquivos de rota e componentes listados acima.
- `PremiumCarousel`: usar `onDragStart`/`onDragEnd` do Framer Motion para marcar um flag e cancelar o `click` na fase de captura do container quando houve arraste; sem mudanças na física atual (spring, snap, setas, persistência).
- Nenhuma alteração de dados, rotas ou regras de negócio.
