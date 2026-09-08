# App adaptável a qualquer aparelho (com simulação do Galaxy A13)

Objetivo: o app se ajusta sozinho a qualquer tela — de celulares pequenos (largura de 320 pontos) a telas grandes — sem cortes, sem rolagem lateral e sem cards gigantes. No computador, o preview aparece dentro de um aparelho que imita o Samsung Galaxy A13.

Como se faz isso, em resumo: nada de tamanhos fixos em pixels. Tudo passa a usar medidas que crescem e encolhem com a tela (proporções, limites mínimo/máximo e faixas de tamanho de texto), mais regras para o texto encurtar em vez de estourar.

## 1. Moldura do aparelho (simulação A13)

- Proporção 20:9 (tela útil equivalente a 360 x 800 pontos), cantos menos arredondados e borda lateral fina, como o A13.
- Trocar a "ilha" retangular do topo pela gota central (Infinity-V).
- A moldura encolhe junto com a janela: se a janela for baixa, o aparelho é reduzido proporcionalmente em vez de cortar a tela.
- Barra de status simulada em estilo Android: hora à esquerda, sinal/Wi-Fi/bateria à direita.
- No celular real, continua ocupando a tela inteira, como hoje.

## 2. Regras gerais de adaptação (valem para todas as telas)

- Largura mínima de trabalho: 320 pontos. Nada pode transbordar nessa largura.
- Cards e carrosséis passam a ter largura proporcional com limites (por exemplo "85% da tela, no máximo 320"), em vez de largura fixa.
- Alturas de carrossel definidas por proporção da imagem, não por altura fixa em pixels.
- Grades (ícones de ação da Home, galerias, listas de pessoas/locais) usam colunas automáticas: 2 colunas em telas estreitas, 3 ou mais quando há espaço.
- Títulos e textos usam faixas de tamanho (mínimo e máximo) para ficarem legíveis em tela pequena e não gigantes em tela grande.
- Linhas com texto + ícone/avatar/botão: texto pode encolher e truncar; ícones não encolhem.
- Espaçamentos e cantos crescem por degraus conforme a largura, em vez de valores fixos.
- Áreas seguras (notch, barra de gestos, teclado) respeitadas em todas as telas.

## 3. Telas a revisar uma a uma

Home, Pessoas, Eventos, Locais, Descobrir/Mapa, Reels, Feed, Chat (lista e conversa), Criar publicação e subtelas, Perfil próprio e público, Gerenciar, Notificações, Corrida/Rota e telas do motorista, Marketplace, Autenticação e onboarding (cadastro, completar perfil, interesses, localização).

Para cada uma: conferir em 320, 360, 412 e 768+ pontos de largura, corrigir cortes, quebras de texto, botões fora de alcance e conteúdo escondido pela navegação inferior.

## 4. Verificação

- Capturas automatizadas de cada tela nas larguras 320, 360, 412 e 768, checando ausência de rolagem horizontal e de elementos cortados.
- Checagem das telas altas (chat, criar publicação, reels) com teclado aberto.

## Detalhes técnicos

- `src/components/phone-frame.tsx`: container com `aspect-[9/20]`, largura `min(360px, …)` e escala por `clamp`, substituindo `max-w-[420px]` e `h-[min(860px,…)]`; `StatusBar` redesenhada em estilo Android.
- Substituir larguras/alturas fixas (`w-[280px]`, `h-[300px]`, `text-2xl` isolado) por `w-[min(85vw,320px)]`, `aspect-[4/5]` e `text-[clamp(...)]` ou pares `text-base sm:text-lg`.
- Grades: `grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))]`.
- Linhas mistas: `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0` + `truncate`, promovendo para `flex` a partir de `sm:`.
- Tokens de espaçamento/raio adicionados em `src/styles.css` quando repetidos.
- Sem alterações em banco de dados, políticas, migrations ou regras de negócio — trabalho apenas de apresentação.
