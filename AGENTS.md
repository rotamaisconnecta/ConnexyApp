<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Supabase — Regras operacionais locais

* Não altere a configuração Git global. Mudanças de identidade Git, quando autorizadas, devem usar somente a configuração local deste repositório.
* Não acesse, vincule ou altere o Supabase remoto sem autorização explícita da etapa corrente. Isso inclui login, link, pull, push, execução de SQL, migrations e operações em buckets remotos.
* Trate JWTs, chaves anon/publishable, chaves service-role e outros segredos locais como confidenciais. Não os copie para relatórios, chats ou arquivos rastreados; represente-os como `[LOCAL_SECRET_REDACTED]` e nunca os reutilize no ambiente remoto.
* Antes do primeiro `supabase start`, execute e aprove um preflight de recursos. Salvo nova auditoria e autorização, use a rede Docker dedicada `connexy-supabase-local`, vinculada a `127.0.0.1`, e o perfil reduzido que exclui `realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`.
* Não use `--ignore-health-check`. Se uma migration ou health check falhar, interrompa e relate. Não execute `db reset` nem correções automáticas.
