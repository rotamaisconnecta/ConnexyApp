# Connexy — G4.10: Diagnóstico do runtime Nitro

## Veredito
BLOQUEADO — Artefato `.output/` foi gerado com preset Nitro `cloudflare-module`. O entrypoint correto é `server/index.mjs`. Entretanto, este preset é destinado ao Cloudflare Workers (Wrangler) e requer runtime do Workers (ou emulação via Wrangler). `vite preview` não é compatível com o preset Cloudflare Module neste setup; executar diretamente `node .output/server/index.mjs` também não produz resposta HTTP local sem emulador adequado. Não foi iniciado runtime nesta fase por segurança.

## 1. Estado Git
- Antes: `backup/connexy-snapshot-2026-10-02`. Alterações preexistentes preservadas.
- Depois: inalterado. Nenhum commit/push/reset/clean.

## 2. Versões e preset identificados
- nitro: 3.0.260603-beta (conforme `package.json` e `.output/nitro.json`)
- @tanstack/react-start: ^1.168.26
- vite: ^8.0.16
- Preset: `cloudflare-module` (`.output/nitro.json`)
- Framework: nitro 3.0.260603-beta

## 3. Entrypoint real
- `serverEntry`: `server/index.mjs` (`.output/nitro.json`)
- Arquivo: `.output/server/index.mjs` existe.
- `commands.preview` em `.output/nitro.json`: `npx wrangler --cwd ./ dev` (deploy `npx wrangler --cwd ./ deploy`)
- `.output/package.json`: `main: ./server/index.mjs`

## 4. Causa das falhas anteriores
- `vite preview`: procurou `dist/server/server.js` porque o plugin `@tanstack/start-plugin-core` espera artefato no formato Vite preview padrão; com preset Nitro Cloudflare Module, o artefato correto é `.output/server/index.mjs` servido via runtime Workers. Incompatibilidade confirmada (erro ERR_MODULE_NOT_FOUND).
- Execução direta `node .output/server/index.mjs`: preset Cloudflare Module depende de APIs específicas do Workers (bindings, runtime) — não é um servidor Node HTTP puro standalone neste formato. Resultado: processo não respondeu em localhost nas tentativas (comportamento esperado sem emulador).
- Preset Cloudflare: comandos de preview/deploy usam Wrangler (não `vite preview`).

## 5. Comando recomendado (evidência)
Comando documentado no artefato: `npx wrangler --cwd ./ dev` (executado a partir de `.output/` ou com `--cwd ./` relativo a `.output/`). Ou seja, para servir `.output/`: `cd .output && npx wrangler dev` (ou equivalente). 
Importante: `wrangler` está disponível como dependência transitiva? Lockfile tem wrangler? Não verificado aqui — mas comando é o indicado pelo Nitro gerado. Contudo, execução de `npx` pode baixar pacotes; restrição “não instalar dependências” aplica-se.

## 6. Segurança e pendências
- Wrangler emula Cloudflare Workers localmente (Miniflare). É isolado, mas é runtime específico da plataforma.
- Não iniciar nesta fase (restrição). 
- `wrangler dev` pode abrir porta local; sem interferência com stacks existentes. Mas requer execução autorizada.
- Projeto `lzejdgfvtybarpbgwsyp` permanece fora de escopo; nenhuma operação remota.
- Flags Schema A permanecem desligadas.

## 7. Próximo passo
Apenas após autorização explícita: executar `cd .output && npx wrangler dev --port <porta-livre>` (sem tocar stacks), aguardar readiness, enviar única requisição POST anônima ao endpoint `getPostMediaUrl` com corpo mínimo/inválido, registrar status/corpo, encerrar processo dedicado.

## Conclusão
**BLOQUEADO.** Runtime correto é Wrangler (Cloudflare Workers emulado) servindo `.output/server/index.mjs`. `vite preview` e `node .output/server/index.mjs` não são adequados para preset `cloudflare-module`. Validação HTTP anônima só possível com `wrangler dev` autorizado.
