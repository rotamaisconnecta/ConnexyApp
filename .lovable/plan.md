# Migrar o backend para o seu Supabase externo

Objetivo: o app passa a usar o **seu** projeto Supabase (banco, auth, storage) em vez do backend gerenciado.

## Importante saber antes

O backend gerenciado (Lovable Cloud) não pode ser removido deste projeto — as variáveis geradas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) são de arquivos automáticos e não podem ser editadas por mim. Então a migração é feita com uma **camada de configuração própria**: se as suas credenciais estiverem presentes, o app usa o seu Supabase; caso contrário, continua no backend atual. Isso torna a troca reversível e sem downtime.

## O que vou fazer

1. **Camada de conexão própria**
   - Novo módulo de configuração que lê credenciais suas: `VITE_APP_SUPABASE_URL` e `VITE_APP_SUPABASE_PUBLISHABLE_KEY` (mais as equivalentes de servidor).
   - Os clientes do app (`src/lib/supabase/client.ts`, `config.ts`, `server.server.ts`, `src/lib/mcp/supabase.ts`) passam a apontar para essa camada, com fallback automático para o backend atual.
   - Os arquivos autogerados em `src/integrations/supabase/` continuam intactos.

2. **Script de exportação do schema**
   - Um único arquivo SQL consolidado (`supabase/external/schema.sql`) reunindo as 6 migrações existentes: tabelas `profiles`, `bio_posts`, `places`, `reels`, `reel_likes`, `reel_comments`, as funções `handle_new_user` e `set_updated_at`, o trigger de novo usuário, GRANTs e todas as políticas de acesso.
   - Inclui a criação dos buckets `bio-media` e `reels-media` (privados) e suas políticas de storage, incluindo a regra de upload por pasta do próprio usuário.
   - Você roda esse SQL uma vez no SQL Editor do seu projeto.

3. **Guia de configuração**
   - `supabase/external/README.md` com o passo a passo: rodar o SQL, ativar o provedor Google no seu projeto, definir as URLs de redirect, e onde colar cada credencial.
   - Instruções para exportar/importar os dados atuais (hoje há poucas linhas de conteúdo real; posso listar exatamente o que existe antes de migrar, se quiser).

4. **Verificação**
   - Tela de diagnóstico simples em `/gerenciar` mostrando qual backend está ativo (gerenciado ou o seu), para confirmar a troca sem adivinhação.

## Detalhes técnicos

- Chaves novas (`sb_publishable_*`) são opacas, não JWT — o cliente próprio replica o tratamento de header `apikey` já usado no cliente gerado, evitando o erro `Expected 3 parts in JWT`.
- Segredos de servidor (service role) serão pedidos pelo fluxo de segredos, nunca colocados no código.
- Auth: as sessões atuais não migram; usuários existentes precisam ser recriados/convidados no seu projeto (posso incluir o comando de export de `auth.users` no guia).

## O que preciso de você

Depois da aprovação: a **URL do projeto**, a **chave publishable/anon** e, se quiser operações privilegiadas, a **service role key** — que pedirei pelo campo seguro de segredos.
