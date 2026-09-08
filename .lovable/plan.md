# Simular um Samsung Galaxy A13

Objetivo: no preview em telas grandes (computador/tablet), o app aparece dentro de um aparelho que imita fielmente o Galaxy A13. No celular real, continua ocupando a tela inteira, como hoje.

## O que muda

1. **Moldura do aparelho** (`src/components/phone-frame.tsx`)
   - Proporção de tela do A13: 20:9 (área útil equivalente a 360 x 800 pontos).
   - Cantos menos arredondados que o modelo atual (o A13 tem laterais retas e raio menor), borda lateral fina simulando a carcaça plástica.
   - Substituir a "ilha" retangular no topo pela gota central (Infinity-V) do A13.
   - Sem barra de gestos flutuante; manter a área de segurança inferior.

2. **Barra de status** (mesmo arquivo)
   - Ajustar a barra simulada para o estilo Android: hora à esquerda, ícones de sinal/Wi-Fi/bateria à direita, altura compatível com a gota.

3. **Adaptação de todas as telas**
   - Fixar a largura útil em 360 pontos no modo simulado, para que qualquer tela seja renderizada exatamente na largura do A13 e nada seja projetado numa largura maior.
   - Revisar as telas que hoje assumem 420 pontos de largura (cabeçalhos, carrosséis, grades de ícones da Home, teclado do chat, editor de perfil) e garantir que texto trunque e ícones não encolham, sem quebras ou cortes em 360 pontos.
   - Verificar telas altas (chat, criar publicação, completar perfil, reels) na altura de 800 pontos, confirmando que a navegação inferior nunca cobre conteúdo.

4. **Preview do editor**
   - Deixar o preview no modo celular para revisão.

## Detalhes técnicos

- Ajuste concentrado em `PhoneFrame`/`StatusBar`; o container ganha `w-[360px] h-[800px]` (com escala para caber em janelas baixas) no lugar de `max-w-[420px] h-[min(860px,...)]`, mantendo `100dvh` no mobile real.
- Revisão de responsividade nas rotas sob `src/routes/_app*` aplicando o padrão `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0` + `truncate` onde houver linhas com texto e ícones fixos.
- Nenhuma alteração em banco de dados, políticas, migrations ou regras de negócio — apenas apresentação.

## Verificação

- Playwright em 360x800 e em janela desktop: capturas de Home, Chat, Criar publicação, Perfil e Reels para confirmar ausência de cortes e de rolagem horizontal.
