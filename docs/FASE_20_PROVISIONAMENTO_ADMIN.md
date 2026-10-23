# Fase 20 — provisionamento administrativo seguro

## Modelo de autorização

- O papel global é `app_metadata.platform_role = "admin"` no usuário Auth do Supabase. `app_metadata` é gravado por operações administrativas do provedor; o perfil e `user_metadata` não concedem esse papel.
- Cada chamada a `getPlatformAdminAccess()` cria o cliente SSR da requisição e chama `auth.getUser()` no servidor. `getUser()` consulta Auth para obter metadados atuais; a decisão falha fechada em erro, sessão ausente ou papel ausente. Não usa o papel local `BUSINESS`, `DRIVER` ou outro papel de produto.
- `/admin` valida o acesso no `beforeLoad`. A rota de gestão da splash repete a validação no `beforeLoad` e imediatamente antes de salvar/restaurar; o guard comercial legado continua válido separadamente.
- A prévia `demo-preview` só existe quando `import.meta.env.DEV` e o modo demo estão ativos. Ela manipula apenas métricas/configuração do próprio navegador, é identificada na UI e não representa acesso seguro em produção.
- A tela administrativa atual não executa escritas remotas. Futuras operações de servidor também precisam chamar o guard no handler da operação; proteção da rota não substitui a autorização da operação.

## Conceder ou revogar

Use [scripts/admin-access.ts](../scripts/admin-access.ts) somente em uma estação/runner confiável operado por quem já controla uma credencial Supabase `service_role`. O script usa a Admin API oficial do Supabase, exige UUID de Auth e confirmação digitada, preserva os outros campos de `app_metadata`, verifica o resultado e nunca imprime a chave.

Pré-requisitos:

1. Identifique o UUID da conta Auth de destino no painel Supabase confiável. Não use email/telefone como alvo do comando.
2. Injete `APP_SUPABASE_URL` e `APP_SUPABASE_SERVICE_ROLE_KEY` no ambiente a partir do cofre de segredos do operador/runner. Não cole a chave no comando, terminal compartilhado, `.env` rastreado ou chat.
3. Execute o comando interativo e confirme o UUID e a ação antes da chamada Admin API.
4. Após concessão, entre com a conta alvo e abra `/admin`. Após revogação, abra a rota novamente e tente salvar/restaurar a splash: a autorização administrativa deve ser negada, enquanto o guard comercial legítimo permanece independente.

```sh
bun scripts/admin-access.ts grant "$AUTH_USER_ID"
bun scripts/admin-access.ts revoke "$AUTH_USER_ID"
```

As linhas acima são exemplos de comandos alternativos; execute somente a ação desejada. O script não roda durante build/teste e não tem endpoint público. Para recuperar acesso, um operador que ainda controla credencial `service_role` pode conceder o papel novamente a uma conta verificada. Se a credencial for comprometida, revogue/rotacione-a no provedor antes de continuar.

O script não lê arquivos `.env`; as variáveis precisam ser injetadas explicitamente pelo ambiente confiável. Não altere `user_metadata` nem conceda o papel pela UI.

## Revogação e sessões

`auth.getUser()` busca o usuário atual no serviço Auth em cada nova validação, em vez de confiar em `app_metadata` embutido em access token já emitido. Assim, novas entradas em `/admin` e novas ações da splash negam acesso após a revogação ser aplicada e observável por Auth. Isso não fecha automaticamente uma página já aberta nem apaga dados que já foram lidos no navegador. As ações locais da splash revalidam antes da gravação; futuras operações remotas deverão revalidar no servidor em cada chamada.

Não afirmamos revogação de bytes já renderizados nem revogação instantânea se o serviço Auth estiver indisponível. Falha de Auth bloqueia a operação administrativa.

## Limites atuais

- Nenhum usuário foi promovido/revogado por esta fase e nenhum projeto Supabase remoto foi acessado.
- Não existe configuração de admin no cliente, migração, função SQL, endpoint de provisionamento nem credencial privilegiada no bundle.
- A infraestrutura atual ainda não registra auditoria global de quem concedeu/revogou o papel. A operação deve ser executada pelo processo institucional do operador, que precisa guardar seu registro externo sem incluir segredo.
- A autorização da splash por papel comercial permanece local/demo e mantém seu comportamento legado; ela não concede acesso à rota `/admin`.
