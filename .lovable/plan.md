## Reordenar a Home priorizando o social

Reorganizar `src/routes/_app.home.tsx` para que o foco seja descoberta social, e o bloco de mobilidade (mapa + "Para onde você vai?") vá para o final da tela, como uma ação secundária tipo Uber.

### Nova ordem das seções

1. **Header** — localização atual + sino de notificações (sem mudança)
2. **Pessoas próximas** — carrossel horizontal de avatares com PresenceDot e badge de proximidade (movido para o topo, com mais destaque visual)
3. **Eventos perto de você** — card do evento em destaque + link "Ver todos"
4. **Locais próximos** — nova mini-seção (hoje não existe explicitamente): carrossel/lista com 2–3 lugares de `places` (Café Central, Burger House, Vinil & Cia), cada card com capa, nome, categoria e badge de proximidade, linkando para `/local/$id`
5. **Promoções para você** — card gradiente do Café Central (mantido)
6. **Ao seu redor agora** — preview de notificações (mantido)
7. **Para onde você vai? (RotaMais)** — última seção: card com o `MapCanvas` (altura ~140) e a barra "Para onde você vai?" sobreposta, agora agindo como CTA para `/rota`. Rótulo da seção: "Precisa de uma corrida?" para deixar claro que é o módulo de mobilidade.

### Detalhes de UI

- Aumentar levemente o destaque de "Pessoas próximas": título maior, mostrar até 6 avatares no carrossel em vez de 4.
- "Locais próximos" usa o mesmo estilo de card horizontal do evento atual, com badge de proximidade via `proximityLabel`.
- O card de mobilidade no fim recebe um leve destaque (borda + sombra) e o `MapCanvas` continua clicável, envolvido por um `Link to="/rota"`.
- Nenhuma mudança em outras rotas, dados ou componentes compartilhados.

### Arquivos afetados

- `src/routes/_app.home.tsx` (única edição)
