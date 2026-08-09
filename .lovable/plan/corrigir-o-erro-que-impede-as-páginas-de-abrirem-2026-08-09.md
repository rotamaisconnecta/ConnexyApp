# Corrigir o erro que impede as páginas de abrirem

## O que eu verifiquei

- Rodando localmente, todas as rotas testadas (`/`, `/welcome`, `/auth`, `/home`, `/localizacao`) respondem 200 sem erro.
- O site publicado (connexy.lovable.app) responde 200 e o pacote JavaScript publicado contém as configurações do backend embutidas corretamente.
- O arquivo de variáveis de ambiente do projeto está completo e bem formatado (URL + chave pública, versões de navegador e de servidor).
- O erro que aparece no console vem de um pacote **antigo do preview** (`index-DKGtvyCb.js`), e a mensagem é: "Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY".

Conclusão: o código atual está correto. A tela de erro vem de uma **build de preview desatualizada**, gerada quando as configurações do backend ainda não estavam disponíveis. Como a conexão com o backend é criada durante a renderização da raiz do app, a falta dessas configurações derruba **qualquer** página, e não apenas a que usa dados — daí a impressão de que "nada abre".

## O que vou fazer

1. **Regerar o preview**: aplicar uma alteração real no código (item 2) força uma nova build de preview com as configurações atuais embutidas, substituindo o pacote antigo.
2. **Blindar a inicialização do backend** para que a ausência de configuração nunca mais derrube o app inteiro:
   - Criar um módulo de checagem de configuração (`src/lib/supabase/config-status.ts`) que verifica se URL e chave pública estão presentes, sem lançar exceção.
   - Criar uma tela amigável (`src/components/system/backend-offline.tsx`) dentro do `PhoneFrame`, com mensagem em português e botão "Tentar novamente", em vez do erro genérico "Algo deu errado".
   - Em `src/routes/__root.tsx`, exibir essa tela quando a configuração estiver ausente, antes de qualquer código tocar no backend.
   - Melhorar o `ErrorComponent` da raiz para reconhecer o erro de configuração e mostrar a mesma mensagem clara.
3. **Verificar**: rodar a build e navegar pelas rotas principais (`/`, `/welcome`, `/auth`, `/home`, `/chat`, `/perfil`) confirmando que abrem sem erro, e conferir o console limpo.
4. **Publicar**: recomendar republicar ao final, para que preview e produção fiquem alinhados.

## Detalhes técnicos

- `src/integrations/supabase/client.ts` é gerado automaticamente e não será alterado. Ele lê `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` com fallback para `process.env` no servidor, e lança erro dentro de um `Proxy` na primeira propriedade acessada — por isso a falha estoura durante a renderização da rota raiz.
- A checagem em `config-status.ts` lerá os mesmos valores via `import.meta.env` (mais `process.env` sob `typeof process !== "undefined"` para SSR) e retornará um booleano, sem instanciar o cliente.
- Nenhuma migração de banco, nenhuma mudança de RLS e nenhuma alteração em `.env` são necessárias.
