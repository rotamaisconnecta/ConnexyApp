
## 1. Sistema de proximidade por categoria

Substituir a distância em metros/quilômetros por faixas semânticas em todo o app.

**Faixas propostas** (helper em `src/lib/proximity.ts`):

```text
0–20 m     → "Bem pertinho"     (pulse verde)
20–100 m   → "Muito perto"
100–500 m  → "Perto"
0,5–2 km   → "Nas redondezas"
2–5 km     → "No bairro"
5–20 km    → "Distante"
> 20 km    → "Muito distante"
```

- Novo helper `proximityLabel(meters)` e `proximityTone(meters)` (cor/badge).
- Em `src/lib/mock-data.ts`: trocar o campo `distance: string` por `distanceMeters: number` nas pessoas, motoristas e locais (mantendo os mesmos valores atuais convertidos).
- Atualizar todas as telas que hoje mostram "300 m", "1,2 km" etc. para renderizar o rótulo da categoria como chip/badge:
  - `_app.home.tsx` (carrossel de pessoas, eventos, promoções, mapa)
  - `_app.connecta.tsx` (lista de pessoas)
  - `_app.solicitacao.$id.tsx` (cartão da solicitação)
  - `_app.chat.$id.tsx` (header + bloco "vocês estão a…")
  - `_app.locais.tsx` / `_app.local.$id.tsx`
  - `_app.matching.tsx` / `_app.corrida.tsx` / `_app.rota.tsx` (motoristas/rota – aqui manter ETA em minutos, mas trocar distância por categoria)
  - `_app.notificacoes.tsx` quando aplicável

## 2. Chat estilo WhatsApp (pós-aceite mútuo)

Hoje a solicitação já leva direto ao chat ao "Aceitar". Vamos manter esse gatilho (aceite mútuo mockado) e redesenhar `_app.chat.$id.tsx` com visual moderno inspirado no WhatsApp, adaptado à paleta roxa do app.

### Layout
- Header fixo: avatar + nome + **indicador online** (bolinha verde + "online" / "visto há X") + categoria de proximidade + botões de ligar/vídeo/menu.
- Fundo do chat com textura sutil (padrão SVG lilás bem claro).
- Bolhas:
  - Minhas: gradiente roxo → lilás, canto inferior direito reto, hora + check duplo.
  - Delas: branco/surface com sombra suave, canto inferior esquerdo reto.
- Agrupamento por data ("Hoje", "Ontem") e por autor consecutivo.
- Bolha de "digitando…" animada (3 pontos).

### Composer (barra inferior)
Ícones à esquerda dentro do input:
- 😊 Emoji (abre picker mock – grid simples).
- 📎 Anexo → menu popover com:
  - **Imagem** (input file `accept="image/*"` → preview local via `URL.createObjectURL`, envia como bolha com miniatura).
  - **Localização** → bolha especial com mini `MapCanvas` e texto "Compartilhou a localização · <categoria de proximidade>".
- 📷 Câmera (mesmo fluxo de imagem).

Botão à direita alterna:
- **Enviar** (ícone avião) quando há texto digitado.
- **Áudio** (ícone microfone) quando vazio → segurar/soltar mock:
  - Ao pressionar: barra vermelha com timer crescente e ondinha animada, botão de cancelar (arrastar p/ esquerda mock).
  - Ao soltar: cria bolha de áudio com waveform SVG estático, play/pause fake e duração.

### Tipos de mensagem suportados
Estado local `messages: Message[]` com union:
```ts
type Message =
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption?: string }
  | { kind: "audio"; durationSec: number }
  | { kind: "location"; label: string; proximity: string };
```
Cada mensagem tem `from: "me" | "them"`, `at: Date`, `status: "sent" | "delivered" | "read"`.

### Interações mock
- Ao enviar mensagem minha, após 800 ms aparece "digitando…" e depois uma resposta canned da outra pessoa (mantém o clima de demo).
- Estado apenas em memória (sem persistência) — coerente com o resto do protótipo.

## 3. Indicador de online
- Adicionar campo `online: boolean` e `lastSeen?: string` no mock de `people`.
- Componente reutilizável `PresenceDot` (bolinha verde com halo pulsante quando online, cinza quando offline).
- Usado em: avatar da lista `Connecta`, header do chat, cartão de solicitação, carrossel da Home.

## 4. Fora do escopo
- Backend / envio real de áudio/imagem/localização (tudo mock client-side).
- Google Maps real no compartilhamento de localização (usa `MapCanvas` existente).
- Notificações push, criptografia, chamadas de voz/vídeo (ícones apenas decorativos).

## Detalhes técnicos
- Novos arquivos: `src/lib/proximity.ts`, `src/components/presence-dot.tsx`, `src/components/chat/*` (bubble, composer, audio-recorder, attachment-menu, location-bubble, image-bubble).
- Framer Motion já instalado — usar para animação do "digitando…", entrada de bolhas e barra de gravação.
- Sem novas dependências.
