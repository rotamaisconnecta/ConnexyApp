# RotaMais Connecta — Protótipo Visual

Vou construir um **protótipo navegável de alta fidelidade** das 16 telas, com UI unificada (roxo #6C3BFF + branco + cinza + acentos rosa/lilás), navegação real entre rotas e dados mockados. Não inclui backend, geolocalização real, mapas interativos (Google Maps), pagamentos, chat em tempo real ou autenticação — esses são passos posteriores.

## Escopo desta entrega

**Incluso (visual + fluxo):**
- Design system roxo/lilás (tokens em `src/styles.css`, variantes shadcn)
- Splash animada → Login/Cadastro → Permissão → Interesses → Home
- Bottom navigation persistente (Home / Rota / Connecta / Locais / Perfil)
- Todas as 16 telas listadas, com dados fake realistas
- Mapas ilustrados (SVG estilizado tipo Uber/Waze) — não Google Maps ainda
- Micro-animações com framer-motion (splash, match, popups)
- Mobile-first, container centralizado tipo device frame no desktop

**Não incluso agora (posso adicionar depois se pedir):**
- Google Maps real, geolocalização do navegador
- Backend/Lovable Cloud, auth, chat real, matching real
- Pagamentos, notificações push

## Estrutura de rotas (TanStack Start)

```text
/                    Splash → redireciona /welcome
/welcome             Boas-vindas
/auth/signup         Cadastro (nome, foto, contato, senha)
/auth/interests      Seleção de interesses
/auth/location       Permissão de localização
/_app/home           Home Feed (layout com bottom nav)
/_app/rota           Mapa + destino
/_app/rota/matching  Motoristas próximos
/_app/rota/ativa     Corrida ativa + modo social
/_app/rota/avaliar   Pós-corrida
/_app/connecta       Pessoas próximas (lista + mapa)
/_app/connecta/$id   Solicitação de chat
/_app/connecta/chat/$id  Chat
/_app/locais         Locais próximos
/_app/locais/$id     Perfil do local
/_app/notificacoes   Notificações
/_app/perfil         Perfil do usuário
/_app/perfil/privacidade  Modo invisível + preferências
```

Popup de "Promoção Inteligente" = componente global disparado em `/_app/*`.

## Design system

- Tokens em `src/styles.css`: `--primary: 271 100% 62%` (roxo), acentos rosa/lilás, superfícies brancas e cinza claro, gradientes roxo→lilás, sombras suaves.
- Tipografia: **Space Grotesk** (títulos) + **Inter** (corpo), via `<link>` no `__root.tsx`.
- Componentes reutilizáveis: `PhoneFrame`, `BottomNav`, `MapCanvas` (SVG mock), `PersonCard`, `DriverCard`, `PlaceCard`, `PromoPopup`, `InterestChip`, `RatingStars`.

## Metadados

`__root.tsx` recebe título/description "RotaMais Connecta — Mova-se. Conecte-se. Descubra." e cada rota principal define seu próprio `head()`.

## Detalhes técnicos

- Estado de UI local via `useState`; toggles (modo invisível, modo social) persistidos em `localStorage`.
- Dados mock em `src/lib/mock-data.ts` (pessoas, motoristas, locais, notificações).
- Mapas: componente SVG estilizado com ruas, pins animados e rotas — parece Uber/Waze sem depender de API.
- `framer-motion` já não está instalado; será adicionado.

## Perguntas antes de começar

Se qualquer resposta abaixo for "sim, faça agora", me diga e ajusto o plano — caso contrário sigo com o escopo acima.

1. **Mapa real (Google Maps) agora ou depois?** Default: SVG mockado agora.
2. **Backend/login real agora?** Default: mockado, sem Lovable Cloud nesta etapa.
3. **Idioma:** tudo em PT-BR como no mockup, correto?
