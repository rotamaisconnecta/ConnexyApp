# Tela de conversa — Connexy

## Dependências

O componente usa:

```bash
npm install lucide-react
```

Ele foi preparado para o projeto atual com React 19, TypeScript, TanStack Router e Tailwind CSS v4.

## Arquivos

Copie para o seu projeto:

- `src/components/chat/ConnexyChatScreen.tsx`
- `src/routes/_app.chat.$conversationId.tsx`

Crie também:

- `public/avatars/juliana-santos.jpg`

Você pode substituir esse arquivo pela foto real do usuário retornada pelo Supabase.

## Rota

Abra no navegador:

```text
/chat/123
```

Caso o seu layout `_app.tsx` já tenha `PhoneFrame` ou navegação inferior, remova o `max-w-[430px]` do elemento `<main>` e ajuste a altura conforme o contêiner pai.

## Integração com Supabase

Substitua `INITIAL_MESSAGES` pela consulta à sua tabela de mensagens. Estrutura recomendada:

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid not null,
  type text not null default 'text',
  content text,
  audio_url text,
  duration_seconds integer,
  created_at timestamptz not null default now()
);
```

Para tempo real, assine alterações na tabela `messages` filtrando por `conversation_id`.

## Regra de privacidade de distância

A função `formatProximity()` já aplica a regra do Connexy:

- até 500 m: `Muito perto`
- até 1 km: `Na mesma região`
- até 2 km: `Perto de você`
- acima de 2 km: mostra a distância em quilômetros

## Funcionalidades já implementadas

- layout responsivo para celular;
- cabeçalho com presença online;
- cartão de proximidade e mapa;
- mensagens recebidas e enviadas;
- áudio visual;
- reações;
- campo de texto funcional;
- envio com Enter;
- ações rápidas horizontais;
- safe area para iPhone;
- fallback quando a foto do usuário não existe.
