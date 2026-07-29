# PHASE 10.6 — CONNEXY CONTROL CENTER

## Objetivo
Transformar "Meu Connexy" em uma Central completa de gerenciamento. Não criar telas isoladas — criar um ecossistema integrado com dashboard, wizards e painéis de gestão.

## O que foi criado

### 1. Nova rota `/my-connexy`
**Arquivo**: `src/routes/_app/my-connexy.tsx`

Página central com 4 seções principais, 5 wizards de criação e 5 painéis de gestão:

#### Seções
1. **Header** — Avatar, nome, cidade, nível
2. **Resumo** — 5 cards (Negócios, Eventos, Locais, Promoções, Mobilidade) com ícone, quantidade, status (ativo/inativo), botão para gerenciar ou criar
3. **Estatísticas** — 6 métricas (Visualizações, Curtidas, Visitas, Mensagens, Seguidores, Avaliação) com variação percentual
4. **Atividade recente** — Lista das últimas ações (publicações, eventos, promoções, corridas)
5. **Ações rápidas** — 6 botões gradientes grandes para criar Negócio, Evento, Local, Oferta, Publicação, Começar Corrida

#### Wizards (5)
- **Criar Negócio** — 7 passos (Nome → Categoria → Endereço → Fotos → Horário → Contato → Pré-visualização)
- **Criar Evento** — 6 passos (Nome → Data → Hora → Categoria → Banner → Descrição)
- **Criar Local** — 5 passos (Nome → Categoria → Localização → Fotos → Descrição)
- **Nova Oferta** — 5 passos (Título → Imagem → Preço → Desconto → Descrição)
- **Nova Publicação** — 3 passos (Tipo → Conteúdo → Mídia)

Todos os wizards usam `WizardBase` com slide-up animation, progress indicator e transições entre passos.

#### Painéis de Gestão (5)
- **Negócios** — Lista, Editar, Estatísticas, Promoções, Excluir
- **Eventos** — Participantes, Mapa, Ingressos, Editar
- **Locais** — Mapa, Editar, Excluir
- **Promoções** — Ativar, Pausar, Duplicar, Excluir (com status)
- **Mobilidade** — Corridas, Ganhos, Histórico, Avaliações

### 2. Componente WizardBase
**Arquivo**: `src/components/my-connexy/wizard-base.tsx`

Reutilizável para todos os wizards:
- Slide-up animation (spring)
- Steps com progress bar
- Botões Voltar/Próximo/Publicar
- Animações de transição entre passos

### 3. Bottom Nav atualizado
**Arquivo**: `src/lib/roles/roles-engine.ts`

Para o modo USER (padrão), o bottom nav agora mostra:
- Home | Central | [+ criar] | Mapa | Perfil

Isso substitui "Chat" por "Central" como item principal, dando acesso rápido ao `/my-connexy`.

### 4. Links atualizados
- **Perfil** → Link "Meu Connexy" agora vai para `/my-connexy`
- **Home** → Banner "🚀 Meu Connexy" agora vai para `/my-connexy`
- **Roles Utils** → Mensagens bloqueadas usam `/my-connexy` como fallback

## Design
- Apple/Notion/Linear — cards grandes, muito espaço, animações suaves
- Cores gradientes por tipo de recurso (ex: negócio = amber, evento = pink, local = blue)
- Framer Motion para todas as animações
- Tema Connexy respeitado (Colors, Radius, Shadows)

## Validação
- `npx tsc --noEmit` — 0 erros
- `npm run lint` — 0 erros (16 warnings pré-existentes)

## Arquivos criados
1. `src/routes/_app/my-connexy.tsx` — Central Connexy (todas as seções + wizards + painéis)
2. `src/components/my-connexy/wizard-base.tsx` — Componente base de wizard

## Arquivos modificados
3. `src/components/bottom-nav.tsx` — Import + ícone LayoutDashboard
4. `src/lib/roles/roles-engine.ts` — Nav default: Home | Central | [+ criar] | Mapa | Perfil
5. `src/routes/_app.profile.tsx` — Link → `/my-connexy`
6. `src/routes/_app.home.tsx` — Banner → `/my-connexy`
7. `src/lib/roles/roles-utils.ts` — Rota fallback → `/my-connexy`
