# Apontar o app para o seu Supabase externo (sem fallback para o Cloud)

Objetivo: o app passa a usar **somente** o seu projeto Supabase externo, lendo
`VITE_APP_SUPABASE_URL` e `VITE_APP_SUPABASE_PUBLISHABLE_KEY`. Nada de Cloud
gerenciado, nada de fallback. Sem mexer em banco, migrations, tabelas, políticas
RLS, buckets ou dados. Sem pedir/exibir credenciais no chat.

## Por que este caminho (e não o fluxo oficial)

O fluxo oficial de conectar Supabase externo é bloqueado para projetos no
Lovable Cloud (que não pode ser removido). Os arquivos de cliente Supabase em
`src/integrations/supabase/` são **autogerados e travados** — eles leem
`VITE_SUPABASE_URL`/`SUPABASE_URL` (gerenciados = Cloud) e não podem ser
editados. Por isso a única forma de usar o seu Supabase externo é criar uma
**camada própria de cliente** que lê `VITE_APP_*` e redirecionar todo o código
do app para ela. Os arquivos autogerados continuam intactos e viram código morto
(nenhum importador vivo).

## O que vou construir

### 1. Novo cliente de navegador próprio — `src/lib/supabase/client.ts` (reescrito)
Hoje é só um alias do cliente gerado. Vira um cliente real via
`createBrowserClient` (`@supabase/ssr`) lendo:
- `import.meta.env.VITE_APP_SUPABASE_URL`
- `import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY`

Inclui o mesmo tratamento de chaves opacas `sb_publishable_*` (remove header
`Authorization` e envia `apikey`) já usado no cliente gerado, evitando o erro
`Expected 3 parts in JWT`. Usa o mesmo nome de cookie (`sb-auth-token`) e opções
de `src/lib/supabase/constants.ts`. Instância lazy via `Proxy` (não quebra o
build se as envs ainda não estiverem setadas).

### 2. Redirecionar todos os importadores do cliente gerado
Trocar `@/integrations/supabase/client` → `@/lib/supabase/client` nos arquivos
que importam o cliente gerado diretamente:

```
src/routes/__root.tsx
src/routes/index.tsx
src/routes/auth.tsx
src/routes/[.]lovable.oauth.consent.tsx
src/hooks/use-auth.ts
src/providers/realtime/realtime-provider.tsx
src/providers/realtime/presence-provider.tsx
src/lib/supabase/storage.ts
src/lib/supabase/rpc.ts
src/lib/supabase/realtime.ts
src/lib/supabase/database.ts
src/lib/reels/reel-publish.ts
src/components/reels/comments-sheet.tsx
```

### 3. Cliente SSR próprio — `src/lib/supabase/server.server.ts` (reescrito)
Passa a ler `process.env.APP_SUPABASE_URL || import.meta.env.VITE_APP_SUPABASE_URL`
e `process.env.APP_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY`.
Mantém o fluxo de cookies SSR (`createServerClient`) e o `getClaims`. O
`identity.ts` e o `route-guard.ts` continuam funcionando via este arquivo.

### 4. Configuração sem fallback — `src/lib/supabase/config.ts` (reescrito)
- `isPublicSupabaseConfigured()` → checa `VITE_APP_SUPABASE_URL` + `VITE_APP_SUPABASE_PUBLISHABLE_KEY`.
- `isSupabaseConfigured()` → no servidor checa `APP_SUPABASE_URL` + `APP_SUPABASE_PUBLISHABLE_KEY`.
Nunca lê `VITE_SUPABASE_URL`/`SUPABASE_URL`. `config-status.ts` herda a mudança.

### 5. Attacher de bearer próprio — novo `src/lib/supabase/auth-attacher.ts`
Cria `attachAppSupabaseAuth` usando o cliente externo (`@/lib/supabase/client`).
Edita `src/start.ts` para usar este attacher no lugar do `attachSupabaseAuth`
gerado. Assim o token anexado às server fns vem da sessão do Supabase externo.

### 6. MCP e uploads apontando para o externo
- `src/lib/mcp/supabase.ts`: lê `APP_SUPABASE_URL`/`VITE_APP_SUPABASE_URL` e
  `APP_SUPABASE_PUBLISHABLE_KEY`/`VITE_APP_SUPABASE_PUBLISHABLE_KEY`.
- `src/lib/reels/reel-publish.ts`: lê `VITE_APP_SUPABASE_URL` e
  `VITE_APP_SUPABASE_PUBLISHABLE_KEY` (em vez de `VITE_SUPABASE_*`).
- `src/lib/auth/route-guard.ts`: atualiza só a mensagem de erro (cosmético).

### 7. Arquivos autogerados — intocados
`src/integrations/supabase/{client,client.server,auth-middleware,auth-attacher,types}.ts`
não são editados. Sem importadores vivos após o passo 2, viram código morto.

## Variáveis que você precisará definir (você mesmo, pelo formulário seguro)

- **Browser/build (Vite):** `VITE_APP_SUPABASE_URL`,
  `VITE_APP_SUPABASE_PUBLISHABLE_KEY`
- **Servidor (runtime, para SSR/SSG):** `APP_SUPABASE_URL`,
  `APP_SUPABASE_PUBLISHABLE_KEY`
- **Opcional (operações privilegiadas/admin):** `APP_SUPABASE_SERVICE_ROLE_KEY`

Eu NÃO peço nem exibo esses valores. Você os adiciona como segredos do projeto.
Enquanto não estiverem definidos, o app mostra a tela de "backend não
configurado" (já existe) — isso é o estado "ainda não configurado", não um
fallback para o Cloud.

## Verificação
- Build/preview sobe sem erros de tipo.
- `isBackendConfigured()` reflete `VITE_APP_*`.
- Com as envs setadas, login/SSR/realtime apontam para o seu projeto.
- Nenhuma referência viva a `VITE_SUPABASE_URL`/`SUPABASE_URL` no `src` (apenas
  nos arquivos autogerados mortos).
