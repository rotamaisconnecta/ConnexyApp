# Fase 19 — auditoria e capacidades administrativas

## Escopo observado

Auditoria estática do working tree local na branch `backup/connexy-snapshot-2026-10-02`. No início havia 164 entradas no `git status --short`; essas alterações preexistentes foram preservadas. Nenhuma consulta ou operação Supabase remota foi executada.

## Arquitetura relevante

- Rotas: TanStack Start/File Routes; a experiência normal é agrupada em `src/routes/_app.tsx` e renderizada dentro de `PhoneFrame`. A administração inicial vive em `/admin`, com layout raiz próprio.
- Autenticação: `src/lib/auth/route-guard.ts` valida identidade Supabase por `getClaims()` no servidor quando o backend está configurado. No modo demo de desenvolvimento, a autenticação é local e não equivale a uma identidade de produção.
- Papéis: `src/lib/roles/roles-types.ts`, `roles-storage.ts` e `roles-guards.ts`. Papéis de usuário, motorista, negócio, organizador, local e criador ficam em `localStorage`, são ativáveis localmente e não representam autoridade administrativa global.
- Persistência: Supabase repositories/services existentes para partes do produto; `LocalRepository`/IndexedDB, stores demo e `localStorage` para outros fluxos. Não há leitura administrativa consolidada entre usuários/dispositivos.
- Observabilidade: erros de UI são enviados pelo boundary para o adaptador de erro da Lovable; há logs pontuais em console. Não há painel de saúde, série histórica operacional ou auditoria global.

## Matriz inicial

| Domínio | Consulta encontrada | Operação encontrada | Fonte/limite administrativo |
| --- | --- | --- | --- |
| Usuários e perfis | Perfis autenticados e mocks em módulos diferentes | Perfil próprio; sem bloqueio/gestão global de contas | Repositórios remotos e dados demo não formam um diretório administrativo; falta claim/política de servidor de admin |
| Papéis e permissões | Papéis de produto definidos | Ativação local de papéis e guards por domínio | `localStorage`; papel comercial não autoriza administração global |
| Mobilidade | Fluxos, estados e histórico de corrida existentes | Fluxos de passageiro/motorista; sem controle operacional central | Serviços/repositórios e estado demo/local não oferecem visão global; faltam operação e persistência operacional admin |
| Social e conexões | Listas, solicitações e conexões por serviços existentes | Solicitar/aceitar conforme fluxo de usuário | Sem moderação global; conversas exigem isolamento estrito e não são exibidas na dashboard |
| Feed e publicações | Feed de mocks, demo/local e serviços de feed | Publicação pelo fluxo do usuário | Sem ferramenta global de remoção/moderação e sem agregação administrativa |
| Reels | Reader e persistência local/demo além de serviços do domínio | Publicar, curtir e comentar pelos fluxos existentes | Sem painel global de conteúdo/moderação |
| Locais, negócios, eventos e ofertas | Catálogos mock/demo e marketplace services | Criação/gestão por papéis locais do domínio | Sem CRUD global administrativo compartilhado |
| Publicidade | Inventário `SPONSORED_ADS`; eventos instrumentados de impressão/clique | Exibição nos posicionamentos instrumentados | Inventário mock; métricas em `connexy:demo:ad-metrics:v1` deste navegador, máximo de 2.000 eventos; não são globais |
| Posicionamentos de anúncio | `home_regional_highlights`, `post_ride_discovery`, `home_premium` | Home e pós-viagem instrumentam impressão/clique; Home Premium não tem uso de métricas encontrado | CTR calculada sobre eventos locais retidos; orçamento não tem tracking operacional |
| Splash e popup | Configuração e frequência locais da Fase 18B; popup tem contador local | Splash editável sob guard comercial existente; popup/frequência locais | Não há configuração compartilhada; admin claim foi adicionado como segunda via sem remover guard comercial |
| Notificações | Serviços de notificação e preferências locais | Ações de usuário e preferências | Sem console operacional global, entrega observada ou histórico administrativo centralizado |
| IA | `createServerFn` e cliente Gemini server-side existentes | Geração de conteúdo por fluxos de produto | Sem painel de uso, erros, custo ou quotas; não instrumentado para admin |
| Configurações | Preferências por usuário e configurações demo | Edição local/por domínio | Não existe serviço de configuração global compartilhado |
| Logs, falhas e auditoria | Error boundary e logs pontuais | Relato de falha no boundary | Sem trilha de ator/ação/alvo/resultado nem monitoramento sistêmico; não inventado nesta fase |

## Autorização da dashboard

O acesso real exige claim assinado e verificado no servidor `app_metadata.platform_role=admin`. Não há papel administrativo no sistema atual, fluxo para atribuí-lo ou política administrativa nas migrations inspecionadas; portanto, nenhuma conta existente ganha acesso automaticamente. Em DEV com demo habilitada, `/admin` é uma prévia local explicitamente identificada e não uma barreira de segurança. Nenhuma tela permite promover o próprio usuário.

O claim protege a rota, mas futuras escritas compartilhadas ainda precisarão ser autorizadas novamente no servidor/repositório. A configuração de splash atual continua local ao navegador mesmo quando editada por um admin autenticado.

## Próximas fases sugeridas

1. **Identidade e autorização global:** definir provisionamento de claims admin, políticas server-side/RLS, revogação e testes negativos; bloqueador de toda escrita administrativa compartilhada.
2. **Persistência e auditoria:** especificar trilha mínima de ator/ação/alvo/resultado e quais entidades são compartilhadas, evitando dados privados e agregações cross-user não autorizadas.
3. **Saúde e observabilidade:** consolidar eventos de erro, status de integrações e indicadores com fonte/período, após definir retenção e acesso.
4. **Publicidade compartilhada:** mover configuração/inventário/métricas para fonte autorizada e instrumentar todos os posicionamentos; só então permitir consulta global/relatórios.
5. **Operações de domínio:** módulos de usuários, mobilidade, conteúdo e marketplace em etapas separadas, com contratos remotos, permissões e auditoria por operação.

## Limitações desta fase

Não há censo global, atividade cross-device, faturamento, consumo de budget, cliques/impressões globais, incidentes de corrida globais, histórico administrativo ou monitoramento de dependências disponível. Os zeros apresentados para anúncios representam ausência de eventos neste navegador/retained store, e não ausência de atividade da plataforma.
