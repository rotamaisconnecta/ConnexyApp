# Connexy — G4.17: Requisição HTTP anônima com payload Seroval válido

## Veredito
APROVADO — Com o runtime isolado servindo o build G4.8, uma **única** requisição `POST` anônima ao endpoint `getPostMediaUrl`, carregando o corpo Seroval **gerado pelo serializador autoritativo do cliente** (`toJSONAsync` + `defaultSerovalPlugins`), ultrapassou o CSRF e a desserialização e **alcançou o middleware de autenticação** (`requireAppSupabaseAuth`). O servidor respondeu **HTTP 200** com envelope cross-JSON contendo um nó `$TSR/Error` com `message = "Unauthorized: No authorization header provided"`, `result = undefined` e `context = {}`. A requisição anônima foi **rejeitada fail-closed**: nenhuma URL de mídia foi emitida e nenhum dado de mídia foi exposto.

Isto confirma empiricamente a cadeia de camadas descrita na G4.16 (CSRF → desserialização → middleware) e resolve a incerteza #5 daquela fase: como a mensagem observada é a de **autenticação** (e não a de configuração), `resolveServerSupabasePublicConfig()` resolveu com sucesso no runtime local — o gate da flag permanece desligado e nenhuma chamada ao Supabase remoto foi feita (a exceção ocorre antes da criação de qualquer cliente, na checagem do header `authorization`).

Ressalvas: (1) isto **não** prova autorização para usuários autenticados nem a segurança do Storage — apenas que o endpoint executa e que a ausência de credencial é rejeitada; (2) `x-tss-serialized` não foi capturado (restrição de requisição única), mas o formato do corpo é inequivocamente o cross-JSON do Seroval; (3) os argumentos enviados são **sintéticos** (UUID e bucket/path fictícios), sem qualquer dado real, e permanecem irrelevantes porque o middleware barra antes do validator/handler.

## 1. Estado Git
- Antes: `HEAD 16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`; branch `backup/connexy-snapshot-2026-10-02`; 257 entradas em `git status --short`.
- Depois: `HEAD` e branch idênticos; mesma base + este relatório (G4.17), total 258 entradas. Nenhum commit/push/reset/clean. Nenhum arquivo de aplicação, configuração, `.env`, migration, `package.json` ou lockfile alterado.

## 2. Pré-verificações
- Artefato a ser servido: `.output/nitro.json` `date 2026-10-15T02:14:37.249Z`, `preset cloudflare-module` (build G4.8).
- `.output/server/wrangler.json`: `main: index.mjs`; `assets.binding: ASSETS`, `directory ../public`; `compatibility_date 2026-10-11`; `nodejs_compat`; `no_bundle true`; **sem** D1/KV/R2/DO/secrets → isolável.
- Endpoint confirmado no resolver do servidor (`__23tanstack-start-server-fn-resolver-DslPvQ6t.mjs:19` → `getPostMediaUrl_createServerFn_handler`) e no bundle do cliente (`_app.perfil.index-BSTDheyl.js`): id `b598d23fb2678669567617bedb9875633e56e5b00e25fd0e99657470156058d6`.
- Portas 8799/8801/8811 verificadas livres antes de subir o runtime.

## 3. Método

### 3.1 Geração do corpo (serializador autoritativo, offline)
- Script `/tmp/opencode/g4-17-gen.mjs` usa `toJSONAsync` de `node_modules/seroval` com `plugins: defaultSerovalPlugins` de `@tanstack/router-core` — a **mesma** implementação e os mesmos plugins efetivos do cliente (`serverFnFetcher.js:104-106`; o app não registra `serializationAdapters`).
- `serverFnFetcher` do `@tanstack/start-client-core` **não** é utilizável em Node puro: `getStartOptions()` (`createIsomorphicFn`) resolve para a implementação de servidor e `getStartContext()` falha. Por isso serializou-se diretamente com `toJSONAsync`.
- Entrada: `{ data: { postId: "11111111-1111-4111-8111-111111111111", locator: { kind: "identity", bucket: "g4-17-synthetic-bucket", path: "g4-17/synthetic/object.bin" } } }` (valores sintéticos; UUID v4 válido para satisfazer o zod, embora o middleware rode antes).
- Saída `/tmp/opencode/g4-17-body.json` (337 bytes): envelope Vanilla `{ t, f: 63, m: [] }`, `t.t = 10`, `t.i = 0`, `t.o = 0`, `t.p.k = ["data"]`.
- Round-trip local via `fromJSON` confirmou a fidelidade: desserializa para `{ data: { postId, locator } }`.

### 3.2 Runtime isolado
- Wrangler 4.151.0 isolado em `/tmp/opencode/connexy-g4-13-wrangler` (`--local`, `--ip 127.0.0.1`, `--port 8799`), telemetria desabilitada apenas no processo efêmero (`WRANGLER_SEND_METRICS=false`), sem alterar arquivos do projeto.
- Log `/tmp/opencode/g4-17-wrangler.log`; readiness confirmada com `GET /` → `200` e log `Ready on http://127.0.0.1:8799`.

### 3.3 Requisição única (anônima)
- Uma única requisição:
  - `POST http://127.0.0.1:8799/_serverFn/b598d23fb2678669567617bedb9875633e56e5b00e25fd0e99657470156058d6`
  - `x-tsr-serverFn: true`
  - `accept: application/x-tss-framed, application/x-ndjson, application/json`
  - `content-type: application/json`
  - `Origin: http://127.0.0.1:8799` (mesma origem — CSRF contornado legitimamente, sem desabilitá-lo)
  - corpo: `--data-binary @/tmp/opencode/g4-17-body.json`
  - **sem** `Authorization`, **sem** cookies.
- Sem retries. Resposta salva em `/tmp/opencode/g4-17-resp.txt`.

## 4. Resultado da requisição
- Status: **HTTP 200**, `content_type = application/json`, `num_redirects = 0`, `size_download = 229`.
- Log do runtime: `POST /_serverFn/b598... 200 OK (33ms)`. **Sem** a linha `Server Fn Error!`.
- Corpo (cross-JSON do Seroval):
```json
{"t":10,"i":0,"p":{"k":["result","error","context"],"v":[
  {"t":2,"s":1},
  {"t":25,"i":1,"s":{"message":{"t":1,"s":"Unauthorized: No authorization header provided"}},"c":"$TSR/Error"},
  {"t":10,"i":2,"p":{"k":[],"v":[]},"o":0}
]},"o":0}
```
- Desserialização local do corpo com `fromCrossJSON` + `defaultSerovalPlugins` (mesmo caminho do cliente) confirmou:
  - `result === undefined` (nó `{"t":2,"s":1}` = Constante Undefined);
  - `error instanceof Error === true`, `error.message === "Unauthorized: No authorization header provided"`;
  - `context === {}`.

Observação: a **resposta** usa o modo cross-JSON (nó raiz `{t,i,p,o}`), desserializado por `fromCrossJSON`; o **corpo da requisição** usa o modo Vanilla (`{t,f,m}`), lido por `fromJSON`. São formatos distintos do mesmo Seroval, coerentes com os caminhos do cliente (`serverFnFetcher`).

## 5. Camada alcançada
A evidência (dentro de `action(payload)`, mensagem do middleware, ausência do stack de `parsePayload`, ausência de `403 Forbidden`, ausência de `Server Fn Error!`) prova que a execução atingiu a **camada de autenticação** — `requireAppSupabaseAuth` (`src/lib/supabase/auth-middleware.ts`) — e que ali a requisição anônima foi rejeitada com a mensagem `"Unauthorized: No authorization header provided"`. Isso é anterior ao validator zod e ao handler de autorização de mídia. Portanto:
- CSRF: ultrapassado (mesma origem legítima).
- Desserialização (`parsePayload`/`fromJSON`): bem-sucedida.
- Middleware de autenticação: **executado e rejeitou** a ausência de credencial.
- Handler/assinatura de mídia: não alcançado.

## 6. Segurança
- Rejeição **fail-closed**: `result` serializado é `undefined` — nenhuma URL de mídia (nem assinada nem não assinada) foi emitida; nenhum caminho/bucket real envolvido (valores sintéticos).
- O erro foi serializado pelo `ShallowErrorPlugin` (tag `$TSR/Error`), que expõe **apenas `message`** — nenhum stack trace, causa ou detalhe interno vazou ao cliente.
- Nenhuma chamada remota ao Supabase: `verifySupabaseBearer` lança na ausência de `authorization` **antes** de instanciar qualquer cliente; `resolveServerSupabasePublicConfig()` apenas leu a config pública local do runtime.
- Nenhum token, cookie, chave ou credencial produzido, enviado ou coletado. Nenhum valor sensível exibido.
- A flag `VITE_APP_SCHEMA_A_MEDIA_URL` permanece desligada; nenhum comportamento de assinatura foi exercitado.

## 7. Limitações e incertezas
1. Não comprova autorização/mídia para usuário autenticado, nem segurança do Supabase Storage remoto — apenas que o endpoint executa e barra o anônimo.
2. `x-tss-serialized` não observado diretamente (requisição única); o formato cross-JSON do corpo, porém, é inequívoco.
3. Argumentos sintéticos: o caminho feliz de mídia (`ready`) exige posts UUID reais com mídia canônica `(bucket, path)` e autorização — fora do escopo desta fase.
4. Status HTTP 200 com erro serializado é o comportamento **esperado** do TanStack Start (o erro vira dado; o cliente relança ao desserializar). O discriminador confiável é o conteúdo (`$TSR/Error` + mensagem), não o código numérico.
5. Não houve exploração: se a resposta tivesse sugerido exposição de mídia, a fase pararia; não foi o caso.

## 8. Confirmações finais
- Uma única requisição HTTP, sem retries; apenas em `127.0.0.1`; sem autenticação/token/cookie/credencial; sem operações remotas/Supabase.
- Nenhuma alteração de código, configuração, `.env`, migration, `package.json`, lockfiles ou flags.
- Nenhum comando Git destrutivo/commit/push; alterações preexistentes preservadas; `HEAD` e branch inalterados.
- Runtime dedicado encerrado (grupo de processos do Wrangler + workerd): porta 8799 liberada; nenhum processo preexistente afetado.
- Nenhum segredo exibido.
