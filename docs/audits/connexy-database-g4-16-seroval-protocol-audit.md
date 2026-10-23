# Connexy — G4.16: Auditoria do protocolo Seroval da server function

## Veredito
APROVADO (auditoria estática) — O formato de transporte usado pelo cliente gerado pelo TanStack Start para chamar `getPostMediaUrl` foi identificado de ponta a ponta a partir do código-fonte do cliente e do parser Seroval instalados no projeto, e cruzado com os bundles de cliente e servidor já gerados (build G4.8). O corpo da requisição POST é o resultado de `JSON.stringify(toJSONAsync(source, {plugins}))`, isto é, o envelope Seroval **modo Vanilla (JSON)**: `{ "t": <SerovalNode>, "f": <features>, "m": <markedRefs> }`, com `source = { data: { postId, locator } }` e `f = 63`. O servidor o lê com `fromJSON` em `parsePayload`. Isto explica o erro da G4.15 (o corpo `{"data":{}}` não é o envelope esperado: faltava o campo `t`).

Ressalva: o exemplo sintético abaixo é **derivado do código** (não gerado pelo cliente em execução). A geração autoritativa do payload deve ser feita na próxima fase invocando o próprio serializador do cliente localmente. Nenhum runtime foi iniciado e nenhuma requisição HTTP ou operação remota foi realizada nesta fase.

## 1. Estado Git
- Antes: `HEAD 16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`; 256 entradas em `git status --short` (a 256ª é o relatório G4.15).
- Depois: `HEAD` idêntico; mesma base + este relatório (G4.16). Nenhum commit/push/reset/clean. Nenhum arquivo de aplicação, configuração, `.env`, migration, `package.json` ou lockfile alterado. Nenhum runtime iniciado, nenhuma requisição HTTP, nenhuma operação remota.

## 2. Arquivos e funções consultados (Etapa 1)
Caminhos relativos à raiz do projeto.

### Cliente TanStack Start (fonte instalada)
- `node_modules/@tanstack/start-client-core/dist/esm/client-rpc/createClientRpc.js:5-17` — `createClientRpc(functionId)`: `url = process.env.TSS_SERVER_FN_BASE + functionId`; `clientFn = (...args) => serverFnFetcher(url, args, ...)`.
- `node_modules/@tanstack/start-client-core/dist/esm/client-rpc/serverFnFetcher.js` — função central:
  - `:61-90` `serverFnFetcher(url,args,handler)`: `first = args[0]`; `type = first.data instanceof FormData ? "formData" : "payload"`; `headers.set("x-tsr-serverFn","true")` (`:67`); para payload `headers.set("accept", TSS_CONTENT_TYPE_FRAMED + ", application/x-ndjson, application/json")` (`:68`).
  - `:79-83` POST: `getFetchBody(first)` → define `content-type`.
  - `:91-103` `serializePayload`: monta `payloadToSerialize = { data?, context? }` (context só se tiver props próprias).
  - `:104-106` `serialize(data) = JSON.stringify(await Promise.resolve(toJSONAsync(data, { plugins: serovalPlugins })))`.
  - `:107-119` `getFetchBody`: POST → `{ body: serializedBody, contentType: "application/json" }`.
- `node_modules/@tanstack/start-client-core/dist/esm/getDefaultSerovalPlugins.js:4-6` — `[...(getStartOptions()?.serializationAdapters)?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins]`.
- `node_modules/@tanstack/start-client-core/dist/esm/constants.js` — `TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed"`; `X_TSS_SERIALIZED = "x-tss-serialized"`; `X_TSS_RAW_RESPONSE = "x-tss-raw"`; `TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT"`.
- `node_modules/@tanstack/start-client-core/dist/esm/createServerFn.js:36-58,179-201` — ordem de middlewares e `serverFnBaseToMiddleware.client` (`payload = {...ctx, context: sendContext, fetch}`).
- Plugins padrão: `@tanstack/router-core` `defaultSerovalPlugins` = `[ShallowErrorPlugin (tag "$TSR/Error"), RawStreamSSRPlugin, ReadableStreamPlugin]`.

### Seroval (fonte instalada) — formato
- `node_modules/seroval/src/core/tree/index.ts:91-105` — `toJSONAsync(source, options)` retorna `{ t: SerovalNode, f: features, m: markedRefs }`.
- `node_modules/seroval/src/core/tree/index.ts:120-134` — `fromJSON(source, options)` lê `source.f ?? ALL_ENABLED`, `source.m`, `source.t`.
- `node_modules/seroval/src/core/context/parser.ts:79-91` — `features = ALL_ENABLED ^ (disabledFeatures || 0)`; `:111-118` ids sequenciais via `refs.size`; `:246-266` `createObjectNode` (tipo `Object=10` ou `NullConstructor=11`, guarda `i`, `p`, `o`).
- `node_modules/seroval/src/core/context/sync-parser.ts:244-303` — `parseProperties`: chaves viram **strings escapadas** (`serializeString`), valores viram nós; `p = { k: [...], v: [...] }`.
- `node_modules/seroval/src/core/string.ts:35-52` — `serializeString` (escapa `"`,`\`,`\n`,`<`,U+2028/9…).
- `node_modules/seroval/src/core/constants.ts` — `SerovalNodeType` (`String=1`, `Constant=2`, `Object=10`, `NullConstructor=11`, `Plugin=25`); `SerovalObjectFlags.None=0`.
- `node_modules/seroval/src/core/compat.ts:7-23` — `ALL_ENABLED = 0x3F = 63`.

### Bundles já gerados (build G4.8) — confirmação empírica
- Cliente `.output/public/assets/createServerFn-DNPAiuhB.js`:
  - `Ur(e){ let t='/_serverFn/'+e; ... }` → `createClientRpc` (URL base `/_serverFn/`).
  - Body: `function Rr(e){ ... n.data=e.data; ... return zr(n) }`; `async function zr(e){ return JSON.stringify(await Promise.resolve(or(e,{plugins:X}))) }`; `async function Br(e){ ... return {body:t, contentType:'application/json'} }`.
  - `x-tsr-serverFn`/`accept`/framed idênticos à fonte.
  - `Pt(...)` (contexto do parser): `features:63^(t.disabledFeatures||0)` (63 fixo), `marked:new Set`, `refs:new Map`.
  - `async function or(e,t={}){ ... return{t:await sn(n,e),f:n.base.features,m:Array.from(n.base.marked)} }` → `toJSONAsync` embutido.
- Servidor `.output/server/_ssr/server-ChDSrSAT.mjs`:
  - `:222-261` `handleServerAction`; `:227` `parsePayload = Pu(payload,{plugins})`; `:256-261` POST → `request.json()` → `parsePayload` → `action(payload)`.
  - `:378-398` `catch` imprime "Server Fn Error!" e serializa o erro como `$TSR/Error`.
- Servidor `.output/server/_libs/@tanstack/router-core+[...].mjs:1933-1942` — `function Pu(e, r = {})`: `a = e.f ?? 63; return deserializeTop({... markedRefs:e.m, features:a & ~n ...}, e.t)` → é o `fromJSON` do Seroval (modo Vanilla).
- `.output/server/_ssr/createStart-DwZhSttb.mjs:41-79` — validação CSRF; `:79` `new Response("Forbidden",{status:403})`.
- `.output/server/_ssr/start-DcFpXBJ_.mjs:29-36` — `errorMiddleware` (500 HTML) e `csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" })`.

### Aplicação
- `src/lib/media/media-url.functions.ts:49-65` — `getPostMediaUrl = createServerFn({method:"POST"}).middleware([requireAppSupabaseAuth]).validator(zod inputSchema).handler(...)`; input `{ postId: uuid, locator }`.
- `src/lib/media/post-media-signer.ts:17-26` — chamada real: `getPostMediaUrl({ data: { postId, locator: { kind:"identity", bucket, path } } })`.
- `src/start.ts` — `functionMiddleware: [attachAppSupabaseAuth]`, `requestMiddleware: [errorMiddleware, csrfMiddleware]`; **sem** `serializationAdapters`.
- `.output/public/assets/_app.perfil.index-BSTDheyl.js` — contém o id `b598d23f...` (stub cliente do `getPostMediaUrl` no app).

## 3. Formato de transporte identificado (Etapa 1)
Para `getPostMediaUrl({ data: { postId, locator } })`:

- **Método HTTP:** `POST` (o server fn declara `method:"POST"`; o servidor valida e responde 405 se divergir).
- **URL:** `/_serverFn/b598d23fb2678669567617bedb9875633e56e5b00e25fd0e99657470156058d6` (`SERVER_FN_BASE + functionId`, base = `/_serverFn/`).
- **Cabeçalhos do cliente:**
  - `x-tsr-serverFn: true` (obrigatório para o servidor tratar como server fn)
  - `accept: application/x-tss-framed, application/x-ndjson, application/json`
  - `content-type: application/json`
  - CSRF de mesma origem: o navegador envia `Sec-Fetch-Site`/`Origin`/`Referer`; requisição local de mesma origem deve apresentar origem idêntica à do request (ex.: `Origin: http://127.0.0.1:8799`) ou `Sec-Fetch-Site: same-origin`.
  - O middleware global `attachAppSupabaseAuth` (cliente) adicionaria `Authorization: Bearer <token>` **apenas se houvesse sessão**; em teste anônimo, nenhum header de auth (e nenhum cookie).
- **Corpo:** `JSON.stringify(toJSONAsync(source, {plugins}))`, com `source = { data: { postId, locator } }`, `plugins = [ShallowErrorPlugin, RawStreamSSRPlugin, ReadableStreamPlugin]` (sem adapters no app). Resultado = envelope `{ t, f, m }`.
- **Função exata de serialização:** `toJSONAsync` do `seroval` (modo Vanilla, `SerovalMode.Vanilla = 1`, contexto de parser async). No bundle cliente está inlined como `or(...)`.
- **Contexto adicional obrigatório:** **não**. `context` só é incluído se `sendContext` tiver propriedades próprias; na chamada real `sendContext = {}` → ausente. Portanto o corpo contém apenas `data` sob o topo.

### Campos do envelope
- `t`: `SerovalNode` da raiz (aqui um nó de objeto).
- `f`: features bitmask = `ALL_ENABLED ^ disabledFeatures`. Cliente não passa `disabledFeatures` → **`f = 63`**.
- `m`: array de ids marcados (`Array.from(marked)`). Para uma árvore simples sem referências repetidas → **`m = []`**.

### Forma dos nós (derivada do parser)
- Objeto não vazio: `{ "t": 10, "i": <id>, "p": { "k": [...], "v": [...] }, "o": 0 }` (`o` = object flag; `None=0`).
- String: `{ "t": 1, "s": "<valor escapado>" }`.
- Chaves (`p.k`) são **strings escapadas** (não nós); valores (`p.v`) são nós.
- Ids (`i`) são atribuídos em ordem de primeira visita, começando em `0` (topo primeiro; cada objeto/array recebe um id; strings não recebem id).

### Exemplo sintético (sem dados reais) — derivado do código
Para `{ data: { postId: <uuid>, locator: { kind:"identity", bucket:<b>, path:<p> } } }`:

```json
{
  "t": {
    "t": 10,
    "i": 0,
    "p": {
      "k": ["data"],
      "v": [
        {
          "t": 10,
          "i": 1,
          "p": {
            "k": ["postId", "locator"],
            "v": [
              { "t": 1, "s": "00000000-0000-4000-8000-000000000000" },
              {
                "t": 10,
                "i": 2,
                "p": {
                  "k": ["kind", "bucket", "path"],
                  "v": [
                    { "t": 1, "s": "identity" },
                    { "t": 1, "s": "<bucket>" },
                    { "t": 1, "s": "<path>" }
                  ]
                },
                "o": 0
              }
            ]
          },
          "o": 0
        }
      ]
    },
    "o": 0
  },
  "f": 63,
  "m": []
}
```

Observação: os campos `undefined` do nó (`s,c,m,e,a,f,b,l` nos objetos; `i,c,m,p,e,a,f,b,o,l` nas strings) são omitidos pelo `JSON.stringify`, exatamente como acima.

## 4. Comparação com o erro anterior (Etapa 2)
O corpo enviado na G4.15 foi `{"data":{}}`. O servidor faz (`server-ChDSrSAT.mjs:256-261`):
```js
if (contentType?.includes("application/json")) jsonPayload = await request.json();
const payload = jsonPayload ? parsePayload(jsonPayload) : {};
```
`parsePayload` = `fromJSON` (modo Vanilla), que executaria `deserializeTop(ctx, source.t)`. Como `{"data":{}}` **não** é o envelope `{t,f,m}`, `source.t` é `undefined`; o desserializador faz `node.t` em `undefined` → `TypeError: Cannot read properties of undefined (reading 't')`, capturado em `handleServerAction` (`:378`) → "Server Fn Error!" (HTTP 500 JSON). Todo esse caminho ocorre **antes** de `action(payload)` (`:261`), ou seja, antes de qualquer middleware. Isso explica precisamente o erro observado na G4.15.

### Como distinguir as falhas (referências de código)
- **CSRF rejeitado:** `createStart-DwZhSttb.mjs:33-37` + `:79`. Assinatura: HTTP **403**, `content-type: text/plain;charset=UTF-8`, corpo exatamente `Forbidden`, sem envelope Seroval, sem log "Server Fn Error!". Aplica-se só a `handlerType === "serverFn"`.
- **Falha de desserialização:** `server-ChDSrSAT.mjs:227` (`parsePayload`/`fromJSON`) + catch `:378-398`. Assinatura: HTTP **500**, `content-type: application/json` com `x-tss-serialized: true`, corpo = `$TSR/Error` (ex.: `Seroval Error (step: N)`); log "Server Fn Error!" cujo stack/cause contém **`parsePayload`** e `handleServerAction` (antes de `action`).
- **Rejeição pelo middleware de autenticação:** acontece dentro de `action(payload)` (`:261`) → `createServerFn.js:137-142` captura a exceção em `res.error`. Como não é `Response` nem `notFound`, o handler segue para `serializeResult(res)` (`:271`); o erro (`Error` comum) é serializado pelo `ShallowErrorPlugin` (tag `$TSR/Error`, só `message`). Assinatura esperada: resposta **com `x-tss-serialized`** contendo nó `$TSR/Error` com `message` = `"Unauthorized: No authorization header provided"` (ou a mensagem de configuração, `auth-middleware.ts:85-87,122-144`); **sem** stack de `parsePayload`; status conforme o ALS da resposta. Ou seja, o erro aparece como **dado serializado**, não como falha de parse.
- **Falha de autorização da publicação:** ocorre no handler (`media-url.functions.ts:52-64` → `media-server-authorization.server.ts`), **após** middleware e validator; retorna um `MediaUrlResult` normal (`forbidden|missing|unavailable|ready`) serializado como resultado (HTTP 200, sem nó de erro), não uma exceção.

## 5. Critério de segurança (Etapa 3)
- Nenhum token, cookie ou credencial produzido/coletado. Nenhuma tentativa de contornar CSRF: a estratégia da próxima fase é enviar cabeçalhos de **mesma origem** legítimos (não desabilitar CSRF).
- Nenhum payload experimental gerado e nenhuma requisição enviada nesta fase.
- Não foram descobertos segredos; nenhum valor lido foi exposto.

## 6. Limitações e incertezas
1. **Geração do payload:** o exemplo é derivado da leitura do parser; a forma exata (`i`, `m`, ordem) é determinística para uma árvore simples, mas a forma **autoritativa** deve ser obtida invocando o serializador do próprio cliente. Fonte local para isso: `node_modules/seroval` (`toJSONAsync`) + `@tanstack/router-core` (`defaultSerovalPlugins`) ou, preferencialmente, `@tanstack/start-client-core/.../client-rpc/serverFnFetcher.js` com um `fetch` de captura.
2. **Plugins/getStartOptions em Node puro:** `getDefaultSerovalPlugins()` chama `getStartOptions()`, que é isomórfico (cliente: `window.__TSS_START_OPTIONS__`; servidor: `getStartContext().startOptions`). Em script Node isolado sem contexto, é preciso fornecer `window.__TSS_START_OPTIONS__ = {}` ou resolver `defaultSerovalPlugins` diretamente. Isso é detalhe de execução da próxima fase.
3. **Status da resposta do middleware:** o status HTTP exato da rejeição de auth (via `serializeResult`/ALS) não foi observado; a assinatura distintiva confiável é o **conteúdo** (nó `$TSR/Error` com a mensagem) e a ausência do stack de `parsePayload`, não apenas o código numérico.
4. **Validação empírica pendente:** o protocolo está comprovado no código/bundle, mas ainda não foi exercitado com um payload gerado pelo cliente.
5. **Config de Supabase no runtime:** `requireAppSupabaseAuth` chama `resolveServerSupabasePublicConfig()` **antes** de checar o header; se a config pública não estiver disponível no servidor, a mensagem de erro observada pode ser a de configuração, não a de "No authorization header" — verificar na fase seguinte.

## 7. Próximo passo mínimo
1. Gerar localmente, **sem rede**, o corpo exato usando o serializador do cliente: executar `toJSONAsync({ data: { postId: "<uuid placeholder>", locator: { kind:"identity", bucket:"<b>", path:"<p>" } } }, { plugins: defaultSerovalPlugins })` com `seroval`/`@tanstack/router-core` do próprio projeto (e, de preferência, exercitar `serverFnFetcher` de `@tanstack/start-client-core` com um `fetch` fake para capturar headers+body reais). Comparar com o exemplo da seção 3.
2. Na fase HTTP (autorizada à parte): subir o runtime isolado (Wrangler 4.151.0, `--local`, `127.0.0.1`, porta livre) e enviar **uma única** requisição POST anônima com `x-tsr-serverFn: true`, `content-type: application/json`, `accept` indicado e cabeçalho de mesma origem (`Origin` igual à origem do request), usando o corpo gerado no passo 1. Observar se a requisição ultrapassa `parsePayload` e entra em `action` (evidência: ausência do stack de `parsePayload`; presença de nó `$TSR/Error` com mensagem do middleware, ou resultado do validator).

## 8. Confirmações finais
- Nenhum runtime iniciado (Wrangler/workerd não executados).
- Nenhuma requisição HTTP e nenhuma operação remota/Supabase.
- Nenhuma autenticação, token, cookie ou credencial.
- Nenhuma alteração de código, configuração, `.env`, migration, `package.json`, lockfiles ou flags; `VITE_APP_SCHEMA_A_MEDIA_URL` permanece desligada.
- Nenhum comando Git destrutivo/commit/push; alterações preexistentes preservadas; `HEAD` inalterado.
- Nenhum segredo exibido.
