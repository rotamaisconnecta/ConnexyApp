# Connexy — G4.15: Validação anônima após proteção CSRF

## Veredito
INCONCLUSIVO PARA AUTENTICAÇÃO — A requisição anônima, com cabeçalho de mesma origem compatível com o CSRF, **passou** pela proteção CSRF do TanStack Start (sem 403 "Forbidden"), mas falhou na **desserialização do payload** (`parsePayload`) antes de o middleware `requireAppSupabaseAuth` ser executado. A cadeia de erro comprova que o fluxo parou em `handleServerAction`/`parsePayload`, e não em `action(payload)` (onde o middleware roda). Portanto, **não** há evidência de execução do middleware de autenticação nem de negação anônima do contrato de mídia. Nenhuma conclusão sobre autorização ou segurança do Storage é possível a partir desta fase.

## 1. Estado Git
- Antes: `HEAD 16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`; 255 entradas em `git status --short` (a 255ª é o relatório G4.14 da fase anterior).
- Depois: `HEAD` idêntico; 255 entradas + o relatório desta fase (G4.15). Nenhum commit/push/reset/clean. Nenhuma alteração de `package.json`/`bun.lock`, `.env`/`.env.local`, `wrangler.json`/`nitro.json`, migrations ou flags.

## 2. Inspeção (Etapa 1)
- Rota **confirmada no artefato gerado**, sem presumir identidade anterior:
  - `.output/server/_ssr/media-url.functions-Ax6D2H2V.mjs:42` → `id: "b598d23fb2678669567617bedb9875633e56e5b00e25fd0e99657470156058d6"`.
  - `.output/server/__23tanstack-start-server-fn-resolver-DslPvQ6t.mjs:19,20` → id mapeado para `getPostMediaUrl_createServerFn_handler`.
  - Build referência: `.output/nitro.json` (`preset: cloudflare-module`, `date: 2026-10-15T02:14:37.249Z`) — o mesmo build G4.8 já executado na G4.14.
- **CSRF do TanStack Start** (`.output/server/_ssr/start-DcFpXBJ_.mjs`):
  - `csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" })`; registrado em `requestMiddleware: [errorMiddleware, csrfMiddleware]`. Aplica-se **apenas** a server functions.
  - `getCsrfRequestValidationResult` (`createStart-DwZhSttb.mjs:41`): se `Sec-Fetch-Site` existe → compara com `opts.secFetchSite ?? "same-origin"`; senão, se `Origin` existe → `origin === new URL(ctx.request.url).origin`; senão usa `Referer`.
  - `getFailureResponse` retorna `new Response("Forbidden", { status: 403 })`.
- **Contrato do middleware** (`src/lib/supabase/auth-middleware.ts`): `requireAppSupabaseAuth` = `createMiddleware({ type: "function" }).server(...)`. Ordem: (1) `resolveServerSupabasePublicConfig()` (config ausente → lança a mensagem de config); (2) `getRequest()`; (3) lê `authorization`; (4) `verifySupabaseBearer(authorization, ...)` → se ausente, lança `Unauthorized: No authorization header provided`.
- **Cabeçalhos de mesma origem apropriados** (sem desativar/contornar CSRF): com a URL local sendo `http://127.0.0.1:8799`, enviar `Origin: http://127.0.0.1:8799` faz `origin === request origin` → resultado `true` (ou, equivalentemente, `Sec-Fetch-Site: same-origin`). Escolhido: `Origin` (comparação determinística).

## 3. Runtime isolado (Etapa 2)
- Wrangler `4.151.0` já instalado em `/tmp/opencode/connexy-g4-13-wrangler` (reutilizado; nada instalado/baixado).
- Comando dedicado (detached, `setsid`):
```bash
WRANGLER_SEND_METRICS=false \
/tmp/opencode/connexy-g4-13-wrangler/node_modules/.bin/wrangler \
  -c /home/ricardo/Documentos/Connexy/ConnexyApp/.output/server/wrangler.json \
  dev --local --ip 127.0.0.1 --port 8799
```
- Porta `8799` (verificada livre antes; liberada depois). Bind somente `127.0.0.1`, modo `--local`. Configuração do artefato: apenas o binding local `ASSETS` (+ `nodejs_compat`), sem D1/KV/R2/DO/secrets/recursos remotos. Telemetria do Wrangler desativada por variável **efêmera do processo** (nenhum arquivo alterado).
- Isolamento confirmado; readiness: `GET /` → `200`. Log sem tráfego externo.

## 4. Requisição única (Etapa 3)
- Rota: `POST http://127.0.0.1:8799/_serverFn/b598d23fb2678669567617bedb9875633e56e5b00e25fd0e99657470156058d6`
- Cabeçalhos: `Content-Type: application/json`, `x-tsr-serverFn: true`, `Origin: http://127.0.0.1:8799`.
- **Sem** `Authorization`, cookies, tokens ou credenciais. Corpo mínimo/incompleto e não identificador: `{"data":{}}`.
- Uma **única** requisição; sem novas tentativas.

## 5. Resultado HTTP e evidência da etapa atingida (Etapa 4)
- Resposta: **HTTP 500**, `Content-Type: application/json`, `num_redirects=0`, corpo:
  `{"t":25,"i":0,"s":{"message":{"t":1,"s":"Seroval Error (step: 3)"}},"c":"$TSR/Error"}`
- Log local (`/tmp/opencode/g4-15-wrangler.log`): "Server Fn Error!" seguido de `He [Error]: Seroval Error (step: 3)` cuja **causa** é `TypeError: Cannot read properties of undefined (reading 't')`, com cadeia:
  - `p$1 (.../router-core+[...].mjs:1078)` ← `sr` ← `Pu` ← **`parsePayload (_ssr/server-ChDSrSAT.mjs:227)`** ← `_ssr/server-ChDSrSAT.mjs:258` ← **`handleServerAction (_ssr/server-ChDSrSAT.mjs:229)`**.
  - Linha `server-ChDSrSAT.mjs:378` (`handleServerAction` catch) imprime "Server Fn Error!" e o erro.
- **Interpretação ancorada no código** (`_ssr/server-ChDSrSAT.mjs`):
  - `handleServerAction` valida método → valida `x-tsr-serverFn` → faz `parsePayload(jsonPayload)` (linha 258, função na 227) → **somente depois** chama `action(payload)` (onde a cadeia de middleware, incluindo `requireAppSupabaseAuth`, é executada).
  - `parsePayload = Pu(jsonPayload, {plugins})` (desserialização seroval). O corpo `{"data":{}}` não é um envelope seroval válido → `TypeError` lendo `'t'`.
  - Logo: a falha ocorreu **antes** de `requireAppSupabaseAuth`. O middleware **não** foi executado.
- **O que a evidência comprova:**
  1. O endpoint existe e está registrado (G4.14 já mostrava isso).
  2. A proteção **CSRF foi satisfeita** com `Origin` de mesma origem — não houve 403 "Forbidden" (a resposta foi 500 JSON, não o `getFailureResponse` do CSRF).
  3. A requisição chegou ao handler da server function, mas a **desserialização do payload** falhou antes do middleware de autenticação.
- **O que a evidência NÃO comprova:** execução de `requireAppSupabaseAuth`, negação anônima, autorização de mídia, comportamento do gate da flag ou segurança do Storage.

## 6. Encerramento (Etapa 5)
- Processo dedicado (grupo de sessão do Wrangler, PID raiz `394153`) encerrado com `kill -- -<pgid>` + fallback `pkill -f workerd...8799`. Verificado: nenhum `wrangler`/`workerd` em 8799; porta 8799 livre. Nenhum processo preexistente encerrado.

## 7. Confirmações de restrições
- Sem `wrangler deploy` e sem login. Sem chamadas a serviços remotos/Supabase. Sem `Authorization`/cookies/tokens/credenciais. Sem IDs reais/caminhos de objetos/dados de usuários. Sem instalação/download de ferramentas. Sem alteração de código, configurações, `.env`, `.env.local`, migrations, dependências, lockfiles ou flags. `VITE_APP_SCHEMA_A_MEDIA_URL` permanece desligada. Alterações Git preexistentes preservadas (`HEAD` e contagem inalterados). Nenhum segredo exposto.

## 8. Próximos bloqueios e testes necessários
1. **Bloqueio atual:** para alcançar `requireAppSupabaseAuth`, o corpo POST precisa ser um **payload seroval válido** (o mesmo formato que o cliente `@tanstack/react-start` envia), não um JSON simples. Requer gerar o envelope seroval a partir do próprio cliente/contrato — passo dedicado (fase futura), pois não é permitido improvisar corpo inválido nem fazer múltiplas tentativas nesta fase.
2. Com payload válido (ainda sem credenciais): observar a resposta anônima do middleware (esperado: erro/negação fechada; sem URL assinada), confirmando que a requisição ultrapassa `parsePayload` e entra em `action`.
3. Testes autenticados (A autorizado; B acessando mídia privada de A; publicação restrita; caminho adulterado), backend indisponível e URL expirada exigem projeto Supabase de teste autorizado (`rsukwuqocgjmwwuwtqaf`) e tokens sintéticos — fases futuras e explicitamente fora do escopo desta validação anônima.

## Conclusão
A proteção CSRF do TanStack Start para server functions foi corretamente satisfeita por cabeçalho de mesma origem (`Origin: http://127.0.0.1:8799`), mas o corpo mínimo (`{"data":{}}`) não é um payload seroval válido e falhou na desserialização **antes** do middleware de autenticação. Resultado **inconclusivo para autenticação**: o middleware `requireAppSupabaseAuth` não foi executado e nada sobre autorização de mídia/Storage pode ser afirmado. Runtime isolado encerrado e porta liberada; nenhuma alteração de configuração, dependência ou flag.
