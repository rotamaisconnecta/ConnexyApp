# Connexy — G4.14: Runtime Workers local e teste HTTP anônimo

## Veredito
APROVADO COM RESSALVAS — O artefato Nitro `cloudflare-module` (build G4.8) foi executado localmente com o Wrangler 4.151.0 isolado (G4.13), em modo `--local`, e respondeu. Uma única requisição POST anônima foi enviada à rota real da server function `getPostMediaUrl` e retornou **403 Forbidden** (`text/plain`, sem redirecionamento). Contudo, a análise do build mostra que esse 403 proveio da proteção CSRF/origem do TanStack Start (ausência de `Sec-Fetch-Site`/`Origin`/`Referer`), e **não** do middleware de autenticação Supabase. Portanto, o teste comprova que o endpoint está registrado e protegido, mas **não** comprova o comportamento do middleware de autenticação para requisições anônimas.

## 1. Estado Git
- Antes: `HEAD 16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`; 254 entradas em `git status --short` (a 254ª é o relatório G4.13 criado na fase anterior).
- Depois: `HEAD` idêntico; 254 entradas + o relatório desta fase (G4.14). Nenhum commit/push/reset/clean. `package.json`/`bun.lock` inalterados quanto a `wrangler`/`miniflare`/`workerd` (confirmado por `git diff`).

## 2. Comando e versão do Wrangler
- Wrangler: `4.151.0` (isolado em `/tmp/opencode/connexy-g4-13-wrangler`).
- Comando dedicado iniciado (detached):
```bash
WRANGLER_SEND_METRICS=false \
/tmp/opencode/connexy-g4-13-wrangler/node_modules/.bin/wrangler \
  -c /home/ricardo/Documentos/Connexy/ConnexyApp/.output/server/wrangler.json \
  dev --local --ip 127.0.0.1 --port 8799
```
- `WRANGLER_SEND_METRICS=false` foi aplicado apenas ao processo (variável efêmera, não persistida em arquivo algum) para evitar telemetria externa. Nenhum arquivo de configuração foi alterado.
- Observação: `--cwd .output/server` falhou porque o build gerou também `.wrangler/deploy/config.json` (redirect para o mesmo `wrangler.json`), causando ambiguidade. A correção segura foi usar `-c` explícito, sem alterar arquivos.

## 3. Porta e isolamento
- Porta local dedicada: `127.0.0.1:8799` (verificada livre antes; liberada depois).
- Bind apenas em loopback (`--ip 127.0.0.1`, `--local`). `--local` = "Run locally with remote bindings disabled". Config do artefato contém somente binding local `ASSETS` + `nodejs_compat`, sem D1/KV/R2/DO/secrets/recursos remotos.
- Processo: `wrangler` (PID 377718) → `wrangler-cli` (377725) → `workerd` (377770), iniciado em nova sessão (`setsid`). Nenhum processo preexistente tocado.
- Log do Wrangler: apenas eventos locais ("Ready on http://127.0.0.1:8799", "GET / 200 OK", "POST /_serverFn/... 403 Forbidden"). Telemetria desativada.

## 4. Confirmação do artefato executado
- O runtime serviu o build da G4.8: `.output/nitro.json` (preset `cloudflare-module`, `date 2026-10-15T02:14:37Z`) e `.output/server/wrangler.json` (binding `ASSETS` → `../public`). O endpoint registrado no resolver (`getPostMediaUrl_createServerFn_handler`, id `b598d23f...`) está no bundle servido.

## 5. Rota testada, status HTTP e interpretação
- Rota real (de `createServerRpc`: `/_serverFn/<id>`): `POST http://127.0.0.1:8799/_serverFn/b598d23fb2678669567617bedb9875633e56e5b00e25fd0e99657470156058d6`
- Cabeçalhos: `Content-Type: application/json`, `x-tsr-serverFn: true`. **Sem `Authorization`**, sem cookies/credenciais. Corpo: `{"data":{}}` (inválido/incompleto; `postId` ausente).
- Resultado: **HTTP 403**, `Content-Type: text/plain;charset=UTF-8`, corpo `Forbidden`, `num_redirects=0`.
- Log do servidor confirma o roteamento: `POST /_serverFn/b598d23f... 403 Forbidden (10ms)`.
- **Interpretação (limitada ao comprovado):** o 403 foi produzido pela validação CSRF/origem do TanStack Start — `getCsrfRequestValidationResult` em `createStart-*.mjs:79` retorna `new Response("Forbidden", { status: 403 })` quando `Sec-Fetch-Site`/`Origin`/`Referer` não correspondem. Nosso cliente anônimo não enviou nenhum desses cabeçalhos. Portanto:
  - Comprova: a rota existe, está registrada e rejeita requisições anônimas de origem não confiável (defesa CSRF ativa).
  - **Não comprova:** o comportamento do middleware `requireAppSupabaseAuth` (que lança `Unauthorized: No authorization header provided`) nem a decisão de autorização de mídia, pois a requisição foi barrada antes de chegar ao middleware.
  - Não há evidência de vazamento de URL assinada nem de dados (corpo genérico).

## 6. Confirmação de ausência de autenticação/operações remotas/config
- Nenhum token, cookie, credencial ou ID real utilizado.
- Nenhuma chamada a Supabase remoto ou outro serviço externo; telemetria do Wrangler desativada para o processo.
- Nenhum `wrangler deploy`, nenhum login.
- Nenhuma alteração de `.env`, `.env.local`, `.wrangler`, `wrangler.json`, `nitro.json`, `supabase/config.toml`, migrations, dependências, lockfiles ou flags.
- `VITE_APP_SCHEMA_A_MEDIA_URL` permanece desligada.
- Projeto `lzejdgfvtybarpbgwsyp` não utilizado.

## 7. Encerramento do processo
- Processo dedicado encerrado (grupo de sessão `kill -- -377718` + fallback `pkill -f workerd...8799`). Verificado: nenhum `wrangler`/`workerd` em 8799; porta 8799 livre. Nenhum processo preexistente encerrado.

## 8. Próximos testes necessários (não executados)
1. Repetir com cabeçalhos de mesma origem (`Origin: http://127.0.0.1:8799` ou `Sec-Fetch-Site: same-origin`) para passar da proteção CSRF e alcançar o middleware de autenticação — então observar a resposta anônima do middleware (esperado: erro/negação fechada, sem URL).
2. Testes autenticados (A autorizado; B acessando mídia privada de A; publicação restrita; caminho adulterado) exigem projeto Supabase de teste autorizado (`rsukwuqocgjmwwuwtqaf`) e tokens sintéticos — fases futuras.
3. Cenários de backend indisponível e URL assinada expirada.
4. Reativar/limpar o runtime isolado conforme necessidade; remover `/tmp/opencode/connexy-g4-13-wrangler` quando não for mais usado.

## Conclusão
**APROVADO COM RESSALVAS.** O endpoint HTTP existe, está registrado no build e é servido localmente por runtime Workers isolado; rejeitou a chamada anônima com 403 (CSRF/origem do framework). Isso **não** valida a autorização de mídia nem a segurança do Storage. As flags Schema A permanecem desligadas.
