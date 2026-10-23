# G4.27E — Plano de Restauração Isolada e Descartável (Etapa 3A)

- **Data da auditoria:** 2026-10-22 (local) / 2026-10-23 (UTC)
- **Etapa:** 3A — auditoria somente leitura + plano; nenhum restore executado
- **Backup de origem:** `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z`
- **Relatório de backup:** `docs/audits/connexy-database-g4-27e-local-backup.md`
- **Veredito:** **APTO COM RESSALVAS**
- **Restore executado:** **NÃO**
- **Container de restore, banco, volume ou rede temporária:** **NÃO**
- **Inspeção efêmera da imagem local:** sim (`docker run --rm --network none`,
  sem volumes, portas ou escrita de dados); nenhum recurso persistente.

> [!IMPORTANT]
> Este documento é um plano. Nenhum comando de restore, criação do ambiente
> descartável, `pg_restore`, `initdb`, extração de storage ou limpeza foi
> executado na Etapa 3A. A imagem local foi inspecionada apenas por execução
> efêmera `--rm`, sem rede, volumes, portas ou escrita em dados.
>
> A execução exige autorização explícita para a Etapa 3B. O alvo deve ser
> exclusivamente descartável, sem rede, sem portas publicadas e sem volumes
> originais. Qualquer falha de verificação deve interromper o procedimento; não
> há fallback automático para o banco original, container original ou ambiente
> remoto.

## 1. Objetivo

Definir e documentar um procedimento reproduzível para provar que o backup da
Etapa 2 pode ser restaurado em um alvo isolado e descartável, sem tocar no banco,
storage, containers, volumes, rede, configurações ou dados originais.

O procedimento deve provar:

1. integridade dos artefatos de backup;
2. restauração completa do dump lógico;
3. restauração das roles/ACLs globais;
4. correspondência de schema, dados, políticas, permissões e migrações;
5. correspondência dos arquivos de storage com os hashes esperados;
6. ausência de acesso remoto ou de rede no alvo;
7. preservação integral do estado original;
8. limpeza completa dos recursos temporários.

## 2. Escopo e limites

### 2.1 Autorizado na Etapa 3A

- Ler relatórios, configurações e arquivos de backup.
- Calcular hashes e contagens somente leitura.
- Inspecionar containers, imagens, volumes, redes e estado do banco original.
- Consultar catálogo, políticas, roles, extensões, buckets e contagens.
- Verificar a listabilidade do dump com `pg_restore --list` no container de
  origem, sem escrever no banco.
- Inspecionar a imagem local por execução efêmera (`--rm`, `--network none`, sem
  volumes nem portas), apenas para leitura de ferramentas e bibliotecas.
- Criar somente este relatório.

### 2.2 Fora de escopo nesta etapa

- Executar `pg_restore`, `psql` de escrita, `createdb`, `dropdb`, migrations ou
  qualquer SQL que altere estado.
- Criar container de restore, banco, volume, rede, diretório persistente ou
  serviço.
- Alterar `supabase/config.toml`, `.env`, migrations, código ou testes.
- Iniciar stack paralela, storage-api, Supabase CLI ou ambiente E2E.
- Acessar, vincular ou alterar Supabase remoto.
- Alterar, mover ou remover backups.
- Fazer commit ou push.

### 2.3 Autorização necessária para a Etapa 3B

- Criar o diretório temporário `/tmp/opencode/g4-27e-restore-<ts>`.
- Criar um container descartável a partir da imagem local exata.
- Executar `initdb`, `pg_ctl`, `psql` e `pg_restore` nesse container.
- Restaurar `globals.sql`, que contém hashes de senha de roles, no cluster
  temporário.
- Extrair o tar de storage em diretório temporário.
- Executar as verificações e a limpeza descritas neste plano.

## 3. Inventário verificado (somente leitura)

### 3.1 Artefatos de backup

| Artefato | Tamanho | SHA-256 |
|---|---:|---|
| `db-postgres.dump` | 1.033.956 B | `200fe72642b865955b230f0a6608d1e982b52c6e31015b67b906ab9783028361` |
| `globals.sql` | 7.436 B | `93579a052a8967d92b71c1742932d5782134d649b6563f20cdf953e0488e5be8` |
| `storage-mnt-stub.tar.gz` | 207.995 B | `c2ab0c450095d00a4a41d30de6adab4f66577eaec37c5b6f33927f1c37caf00d` |
| `MANIFEST.txt` | 2.842 B | `adfc312ec79b9ca3e7586c0bfbdb0958a100b7695a12394cfa032e8b87d9ff07` |
| `storage-tar-files.sha256` | 400 B | `e41a1972f5453e4cb1f0fa2ebb40da2ddcb38878905b85eea7c4930d70e096c5` |

- Diretório de backup: permissão `0700`; arquivos: permissão `0600`.
- Backup fora do repositório.
- `SHA256SUMS` e `MANIFEST.sha256` conferem.
- `storage-live-files.sha256` e `storage-tar-files.sha256` têm o mesmo hash de
  arquivo (`e41a...96c5`), indicando a mesma lista lógica de arquivos.
- Agregado de storage antes/depois:
  `44b7380695f78367fa10da3954775d121e78856cb794bee29bf6b12650b9591c`.
- O agregado é referência de backup; a prova de restore usa a conferência
  individual contra `storage-tar-files.sha256`.

### 3.2 Validação do dump e do storage

- `pg_restore --list`: exit `0`; stderr vazio.
- TOC: `986` linhas; `971` entradas; `72` entradas `TABLE DATA`.
  O cabeçalho do arquivo TOC reporta `978` entradas, mas a contagem efetiva de
  linhas de entrada é `971`; o critério usa `971`.
- Entradas relevantes do TOC: `5 EXTENSION`, `12 SCHEMA`, `96 POLICY`,
  `185 ACL`, `70 FK CONSTRAINT`, `18 TRIGGER`, `6 EVENT TRIGGER`.
- Os `12` schemas do dump não incluem `public` (pré-existente no template) nem
  `net` (criado pela extensão `pg_net`); o catálogo alvo deve ter `14` schemas.
- Nenhuma entrada `DATABASE PROPERTIES` ou `TABLESPACE` no TOC.
- `gzip -t` e `tar -tzf`: OK.
- Tar de storage: `8` diretórios e `2` arquivos.
- Caminhos do tar: relativos, prefixo `stub/`; nenhum caminho absoluto ou com
  `..` observado.
- Storage live versus tar: `match`.
- Storage antes versus depois: `match`.
- Estado do banco antes versus depois: `match`.
- `globals.sql`: `16` linhas `CREATE ROLE`.

### 3.3 Estado atual do banco original

Container: `supabase_db_lzejdgfvtybarpbgwsyp`; banco `postgres`; PostgreSQL
`17.6`; volume `supabase_db_lzejdgfvtybarpbgwsyp` montado em
`/var/lib/postgresql/data`; rede `connexy-supabase-local`.

| Item | Valor observado |
|---|---:|
| `auth.users` | 840 |
| `auth.identities` | 840 |
| `auth.sessions` | 5 |
| `public.profiles` | 840 |
| `public.profile_private` | 840 |
| `public.connections` | 228 |
| `storage.objects` | 2 |
| `supabase_migrations.schema_migrations` | 13 |
| Última migration | `20260925030806` |
| Buckets | 3 |
| Bucket `avatars` público | `true` |
| Política `Avatars public read` | presente |
| Função de guarda de privilégio de profile | 0 |
| Roles não sistêmicas | 16 |

Contagens de catálogo observadas: `14` schemas, `75` tabelas, `209` índices,
`4` sequences, `130` funções, `96` políticas, `18` triggers, `6` event triggers,
`6` extensões, `1` publication, `27` default ACLs.

Propriedades do banco `postgres`: owner `postgres`; `datcollate` e `datctype`
`en_US.UTF-8`; `datlocprovider=i`; `datlocale=en-US`; encoding `UTF8`.

Roles não sistêmicas: `16`; memberships (`pg_auth_members`): `25`; roles com
`rolconfig`: `10`. O role `tmp_restore_admin` não existe na origem, e não há
banco `g4_27e_*`/`g4-27e*` no cluster original.

Extensões observadas: `pg_net`, `pg_stat_statements`, `pgcrypto`, `plpgsql`,
`supabase_vault`, `uuid-ossp`.

Buckets: `avatars`, `bio-media`, `reels-media`. Os dois objetos estão em
`avatars` (`1`) e `bio-media` (`1`); `reels-media` está vazio. `storage.buckets`
tem `avatars.public=true` e a policy `Avatars public read`; o guard
`private.g4_26b_is_canonical_avatar_path` está ausente (`0`).

### 3.4 Baseline de linhas

Fingerprint somente leitura capturado na Etapa 3A:

- Tabelas: `75`
- Arquivo canônico: linhas `schema.table=count`, ordenadas com `LC_ALL=C`
- SHA-256 do baseline: `a41da75ffea6200732c42299a9af0482640fb0a7ae09ec22f6eb2e1ef99db310`

Esse fingerprint é **referência de auditoria**. Na Etapa 3B, o baseline deve ser
recalculado imediatamente antes do restore e comparado com o banco restaurado.
Não se deve exigir que o valor acima continue válido se o banco original tiver
sido alterado.

> Nota de execução: dentro do loop de contagem, usar `docker exec` **sem** `-i`
> para cada tabela. O uso de `docker exec -i` no loop consome o `stdin` do
> here-string e interrompe a iteração após a primeira tabela.

### 3.5 Docker e ferramentas

- `docker` disponível; host sem `psql`, `pg_restore`, `initdb`, `pg_ctl`,
  `createdb` ou `pg_isready`.
- Imagem local exata:
  `sha256:99b1729aeb0bac314445024fc149fbd39306170b61dd50800ccf180327ab3459`
  (`public.ecr.aws/supabase/postgres:17.6.1.158`).
- Imagem `.166` também existe localmente; não é necessária.
- Imagem contém `postgres`, `initdb`, `pg_ctl`, `pg_restore`, `psql` e
  `pg_config` em `/usr/bin`; os wrappers configuram o `libdir` Nix com plugins.
  `pg_config --configure` confirma `--with-icu`.
- Bibliotecas de plugin disponíveis no perfil Nix da imagem, incluindo
  `pg_net`, `pgsodium`, `supabase_vault`, `pg_stat_statements`, `pgaudit`,
  `pg_cron`, `pg_tle` e `plan_filter`.
- Containers originais ativos: `5`; nenhum container de restore persistente. A
  inspeção da imagem usou execuções efêmeras `--rm`, `--network none`, sem
  volumes/portas, já removidas.
- Volumes originais: `supabase_db_lzejdgfvtybarpbgwsyp` e
  `supabase_storage_lzejdgfvtybarpbgwsyp` (criados em 2026-08-14).
- Nenhum volume, rede, container ou banco temporário com prefixo `g4-27e`/
  `g4_27e`.
- Host: aproximadamente `29,5 GiB` livres; memória disponível na auditoria
  aproximadamente `2,9 GiB`.
- Portas em uso: `127.0.0.1:54321` (Kong) e `127.0.0.1:54322` (PostgreSQL);
  nenhuma em `3000`, `5173` ou `4173`.

### 3.6 Estado do repositório

- Repositório: `/home/ricardo/Documentos/Connexy/ConnexyApp`.
- Branch: `backup/connexy-snapshot-2026-10-02`.
- HEAD: `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`.
- `git status --porcelain`: `313` arquivos antes deste relatório; `314` com este
  relatório.
- `git diff --check`: exit `0`.
- Este relatório é o único arquivo novo previsto nesta etapa.

### 3.7 Divergência de configuração

`supabase/config.toml` e `.temp/project-ref` não correspondem ao `project_id`
dos containers locais. Os containers usam `lzejdgfvtybarpbgwsyp`; o CLI usa
outro valor. **Não usar Supabase CLI** neste procedimento. Toda operação deve ser
via Docker e variáveis explícitas.

### 3.8 Escopo e sensibilidade dos artefatos

- O dump cobre somente o database `postgres`. Os databases internos `_supabase`,
  `storage_vectors` e `template1` não estão no dump; conforme o relatório da
  Etapa 2, não contêm dados de projeto. O restore prova o database `postgres`,
  não uma recuperação física do cluster.
- `globals.sql`: `16` `CREATE ROLE` (incluindo `postgres`), `32` `ALTER ROLE`,
  `23` `GRANT`; nenhum `CREATE DATABASE` ou `CREATE TABLESPACE`.
- `storage-live-files.sha256` e `storage-tar-files.sha256` são idênticos
  (`e41a1972f5453e4cb1f0fa2ebb40da2ddcb38878905b85eea7c4930d70e096c5`), com
  `2` caminhos relativos sob `stub/`. A verificação live no container de storage
  retornou `2 OK`, `0 FAILED`.
- `SHA256SUMS` e `MANIFEST.sha256` usam caminhos absolutos do backup; se o
  diretório for movido, os checksums precisam ser revalidados no novo caminho.
- `db-postgres.dump`, `globals.sql` e os manifestos de paths são sensíveis. Nada
  do conteúdo foi impresso neste relatório; os arquivos permanecem `0600` em
  diretório `0700`.

## 4. Opções de isolamento avaliadas

| Opção | Isolamento | Vantagens | Riscos/custos | Decisão |
|---|---|---|---|---|
| A. Criar banco novo no container original | Nenhum | Simples | Escreve no cluster/volume original; pode atingir o banco errado; viola o objetivo | **Rejeitada** |
| B. Container novo com entrypoint Supabase padrão | Médio | Usa o ambiente da imagem | Entrypoint cria roles/schemas prévios; ACLs e owners podem divergir; prova incompleta | Rejeitada para prova completa |
| C. Container novo com `initdb` limpo + globals + dump completo | Alto | Prova de fidelidade completa; sem rede; sem volumes | Mais passos; exige preflight e abortos; extensões/ACLs precisam ser validadas | **Recomendada** |
| D. PostgreSQL no host | Baixo | Evita container | Host não tem binários; instalar exige rede/root; ambiente não controlado | Rejeitada |
| E. Compose/Testcontainers | Médio | Reproduzível | Cria rede/volumes adicionais; mais partes móveis; sem scripts existentes | Rejeitada |
| F. Banco novo dentro de cluster temporário | Alto | Alvo inequívoco | Ainda exige cluster temporário; usar nome dedicado reduz ambiguidade | **Adotada junto com C** |
| S1. Extrair storage para diretório temporário | Alto | Prova por hash; simples; sem serviço | Não testa API de storage | **Recomendada** |
| S2. Subir storage-api temporário | Alto | Teste de integração ponta a ponta | Requer rede, configuração, JWT e banco; mais risco operacional | Opcional, fora desta etapa |
| S3. Restaurar storage em `/mnt` original | Nenhum | Nenhuma | Sobrescreve storage original | **Proibida** |

### 4.1 Decisão de arquitetura

Adotar **C + F + S1**:

- cluster PostgreSQL limpo e descartável, criado por `initdb` a partir da imagem
  local exata;
- banco de restore dedicado `g4_27e_restore_<ts>`;
- restauração de `globals.sql` e depois do dump completo;
- extração do storage em diretório temporário, com verificação individual de
  hashes;
- nenhum serviço de storage-api nesta etapa.

## 5. Arquitetura recomendada

### 5.1 Container descartável

- Imagem por ID exato:
  `sha256:99b1729aeb0bac314445024fc149fbd39306170b61dd50800ccf180327ab3459`.
- `--pull=never`: nunca puxar imagem.
- `--network none`: sem rede.
- Nenhuma porta publicada.
- Nenhum volume nomeado, bind mount de dados ou volume original. Permanecem
  apenas os mounts padrão do Docker para `/etc/hosts`, `/etc/hostname` e
  `/etc/resolv.conf`, sem acesso a dados do projeto.
- `--tmpfs /tmp/pgdata:rw,size=512m` para o cluster.
- `--tmpfs /tmp/pgsock:rw,size=64m` para o socket Unix.
- `--rm` e remoção explícita no cleanup.
- Nome e labels com prefixo `g4-27e-restore-`.
- Entrypoint `/bin/sh` com loop de espera; `initdb`, `pg_ctl` e `pg_restore`
  executados manualmente.

### 5.2 Cluster limpo

- `initdb` como usuário de SO `postgres` (uid `100`).
- Superusuário temporário: `tmp_restore_admin`.
- `--auth-local=trust`, `--auth-host=reject`.
- `listen_addresses` vazio; somente socket Unix em `/tmp/pgsock`.
- `wal_level=logical` e `max_connections=100`, iguais ao ambiente de origem.
- `shared_preload_libraries=pg_stat_statements,pg_net,pgsodium,supabase_vault`
  (subconjunto mínimo necessário para as extensões do dump; a origem também
  preloada `pgaudit`, `plpgsql`, `plpgsql_check`, `pg_cron`, `auto_explain`,
  `pg_tle` e `plan_filter`, todos disponíveis na imagem).
- `initdb` com `--locale-provider=icu --icu-locale=en-US --locale=en_US.UTF-8`,
  espelhando `datlocprovider=i`, `datlocale=en-US`, `datcollate`/`datctype`
  `en_US.UTF-8` da origem.
- Não usar o banco `postgres` como alvo do dump; criar banco dedicado a partir de
  `template0`, com encoding e locale verificados antes do restore.
- Usar os wrappers `/usr/bin/*` da imagem, que configuram o `libdir` Nix com os
  plugins.

### 5.3 Restore do dump

1. Restaurar `globals.sql` no cluster limpo com `ON_ERROR_STOP=1`.
2. Criar `g4_27e_restore_<ts>` a partir de `template0`, com `UTF8`,
   `--locale-provider=icu`, `--icu-locale=en-US` e `--locale=en_US.UTF-8`.
3. Alterar o owner do banco para `postgres`, igual ao banco original.
4. Verificar owner, collation, ctype, provider, locale e encoding do banco de
   restore contra o banco original; abortar se divergirem.
5. Executar `pg_restore` completo com `--exit-on-error` e
   `--single-transaction`, conectado como `supabase_admin` (superuser na
   origem), para preservar o owner das extensões dumpadas e do schema `net`;
   `plpgsql` é bootstrap e seu owner é tratado na verificação.
6. Não usar `--no-owner`, `--no-privileges`, `--disable-triggers` ou
   `--data-only`; a prova deve preservar owners, ACLs, políticas, triggers,
   event triggers, publicações e dados.

### 5.4 Storage

- Extrair `storage-mnt-stub.tar.gz` em
  `/tmp/opencode/g4-27e-restore-<ts>/storage`.
- Usar `tar --no-same-owner --no-same-permissions`.
- Antes de extrair, rejeitar caminhos absolutos ou com `..` e qualquer entrada
  que não seja diretório ou arquivo regular (symlink, hardlink, device, FIFO).
- Verificar cada arquivo contra `storage-tar-files.sha256`.
- Exigir exatamente `2` arquivos `OK` e nenhum `FAILED`.
- Não usar `/mnt` original; não iniciar storage-api nesta etapa.

### 5.5 Por que não usar o entrypoint Supabase padrão

O entrypoint padrão inicializa roles, schemas e extensões próprias, o que pode
mascarar conflitos de owner/ACL e tornar o restore do dump dependente de estado
prévio. O `initdb` limpo, seguido de `globals.sql` e do dump completo, é a prova
mais fiel e auditável. O custo é uma sequência maior de pré-condições; por isso o
veredito é **APTO COM RESSALVAS**, não execução automática.

## 6. Pré-requisitos e critérios de parada

Antes de criar qualquer recurso, confirmar:

- autorização explícita para a Etapa 3B;
- imagem local exata presente;
- ferramentas `initdb`, `pg_ctl`, `pg_restore`, `psql`, `createdb`,
  `pg_isready` e `pg_config` presentes na imagem;
- locale `en_US.UTF-8` aceito pela imagem (`LC_ALL=en_US.UTF-8 locale charmap`
  retorna `UTF-8`) e ICU disponível (`pg_config --configure` contém
  `--with-icu`);
- bibliotecas de preload necessárias presentes (`pg_stat_statements`, `pg_net`,
  `pgsodium`, `supabase_vault`);
- backup íntegro e inalterado;
- `pg_restore --list` exit `0`, com `986` linhas e `72` `TABLE DATA`;
- tar de storage íntegro, sem caminhos perigosos e apenas diretórios/arquivos
  regulares;
- espaço livre em `/tmp/opencode` maior que `2 GiB`;
- memória disponível maior que `512 MiB`;
- containers originais ativos e com mesmos IDs/`StartedAt`;
- nenhum container, volume, rede, banco ou diretório temporário com o mesmo
  nome;
- nenhuma escrita ativa ou transação aberta no banco original;
- propriedades do banco original conferidas (owner, locale, encoding);
- baseline de estado original capturado;
- `git status` e HEAD capturados;
- nenhuma operação remota será executada.

**Abortar imediatamente** se qualquer condição falhar. Não corrigir, não ignorar,
não usar `--ignore-health-check`, não executar `db reset`, não usar fallback
automático.

## 7. Plano de execução (NÃO EXECUTADO)

> Os blocos abaixo são um plano para a Etapa 3B. **Nenhum comando foi executado
> nesta etapa.** Não copiar e executar sem revisão e autorização.

### 7.1 Variáveis, guardas e cleanup

```bash
#!/usr/bin/env bash
set -euo pipefail
umask 077

REPO="/home/ricardo/Documentos/Connexy/ConnexyApp"
DEST="/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z"
SRC_DB="supabase_db_lzejdgfvtybarpbgwsyp"
SRC_ST="supabase_storage_lzejdgfvtybarpbgwsyp"
IMG_ID="sha256:99b1729aeb0bac314445024fc149fbd39306170b61dd50800ccf180327ab3459"

TS_DB="$(date -u +%Y%m%d%H%M%S)"
TMP_CTR="g4-27e-restore-${TS_DB}"
TMP_DIR="/tmp/opencode/g4-27e-restore-${TS_DB}"
RESTORE_DB="g4_27e_restore_${TS_DB}"
TMP_CTR_ID=""

case "$TMP_CTR" in g4-27e-restore-*) ;; *) echo "ABORT: nome do container"; exit 1 ;; esac
case "$TMP_DIR" in /tmp/opencode/g4-27e-restore-*) ;; *) echo "ABORT: diretório"; exit 1 ;; esac
case "$RESTORE_DB" in g4_27e_restore_*) ;; *) echo "ABORT: nome do banco"; exit 1 ;; esac
[ "$TMP_DIR" != "/" ] && [ "$TMP_DIR" != "/tmp" ] && [ "$TMP_DIR" != "/tmp/opencode" ] \
  || { echo "ABORT: diretório inseguro"; exit 1; }

if docker ps -a --format '{{.Names}}' | grep -Fxq "$TMP_CTR"; then
  echo "ABORT: container temporário já existe"
  exit 1
fi
if [ -e "$TMP_DIR" ] || [ -L "$TMP_DIR" ]; then
  echo "ABORT: diretório temporário já existe"
  exit 1
fi

install -d -m 700 "$TMP_DIR"

cleanup() {
  local rc=$?
  local ctr_id=""
  local ctr_name_ok=0
  local ctr_label_a_ok=0
  local ctr_label_b_ok=0
  # Só age se tivermos ID capturado e ownership comprovado
  if [ -n "${TMP_CTR_ID:-}" ]; then
    if docker inspect "$TMP_CTR_ID" >/dev/null 2>&1; then
      ctr_name_ok="$(docker inspect "$TMP_CTR_ID" --format '{{.Name}}' 2>/dev/null | grep -Fxq "/$TMP_CTR" && echo 1 || echo 0)"
      ctr_label_a_ok="$(docker inspect "$TMP_CTR_ID" --format '{{index .Config.Labels "connexy.g4.27e"}}' 2>/dev/null | grep -Fxq "disposable-restore" && echo 1 || echo 0)"
      ctr_label_b_ok="$(docker inspect "$TMP_CTR_ID" --format '{{index .Config.Labels "connexy.g4.27e.source"}}' 2>/dev/null | grep -Fxq "$SRC_DB" && echo 1 || echo 0)"
      if [ "$ctr_name_ok" = "1" ] && [ "$ctr_label_a_ok" = "1" ] && [ "$ctr_label_b_ok" = "1" ]; then
        ctr_id="$TMP_CTR_ID"
        docker logs "$ctr_id" >"$TMP_DIR/container.log" 2>&1 || true
        docker rm -f "$ctr_id" >/dev/null 2>&1 || true
      else
        echo "CLEANUP: AMBIGUIDADE/OWNERSHIP NÃO COMPROVADO (ID=$TMP_CTR_ID nome_ok=$ctr_name_ok label_a_ok=$ctr_label_a_ok label_b_ok=$ctr_label_b_ok) — NÃO REMOVIDO" >&2
        echo "CLEANUP_INSEGURA=1" >> "$TMP_DIR/cleanup-status.txt" 2>/dev/null || true
      fi
    else
      echo "CLEANUP: ID capturado ($TMP_CTR_ID) não encontrado — NÃO REMOVIDO" >&2
      echo "CLEANUP_INSEGURA=1" >> "$TMP_DIR/cleanup-status.txt" 2>/dev/null || true
    fi
  else
    echo "CLEANUP: TMP_CTR_ID não capturado — NÃO REMOVIDO (nunca remover apenas por nome)" >&2
    echo "CLEANUP_INSEGURA=1" >> "$TMP_DIR/cleanup-status.txt" 2>/dev/null || true
  fi
  rm -rf -- "$TMP_DIR/storage" 2>/dev/null || true
  if [ "${G4_27E_KEEP_TMP:-0}" = "1" ] && [ "$rc" -eq 0 ] && [ -z "${CLEANUP_INSEGURA:-}" ] && [ -n "$ctr_id" ]; then
    echo "RETENÇÃO: container removido com ownership comprovado (ID=$ctr_id); evidências em $TMP_DIR; remover após revisão"
    return "$rc"
  fi
  if [ "$rc" -ne 0 ]; then
    echo "FALHA: limpeza condicionada a ownership; se insegura, NÃO foi removido substituto. Logs/evidências em $TMP_DIR"
  else
    if [ -n "${CLEANUP_INSEGURA:-}" ] || [ -z "$ctr_id" ]; then
      echo "ATENÇÃO: limpeza marcada como insegura — container não removido por falta de comprovação de ownership; revisar $TMP_DIR"
    else
      rm -rf -- "$TMP_DIR"
      echo "OK: recursos temporários removidos com ownership comprovado"
    fi
  fi
  return "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM
```

> `G4_27E_KEEP_TMP=1` é um gate opcional de evidência: em caso de sucesso,
> remove o container e o storage extraído, mas preserva `$TMP_DIR` para revisão.
> A remoção final de `$TMP_DIR` exige decisão explícita após transcrever os
> resultados. Em falha, os logs são retidos para auditoria e devem ser removidos
> após a análise, por conterem metadados sensíveis.

### 7.2 Preflight somente leitura

```bash
# NÃO EXECUTAR NA ETAPA 3A

# Backup e manifesto
sha256sum -c "$DEST/SHA256SUMS"
sha256sum -c "$DEST/MANIFEST.sha256"
gzip -t "$DEST/storage-mnt-stub.tar.gz"
tar -tzf "$DEST/storage-mnt-stub.tar.gz" >/dev/null

# Segurança do tar
if tar -tzf "$DEST/storage-mnt-stub.tar.gz" \
  | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "ABORT: caminho inseguro no tar"
  exit 1
fi
if tar -tvzf "$DEST/storage-mnt-stub.tar.gz" \
  | awk '{print substr($1,1,1)}' | grep -Evq '^[d-]$'; then
  echo "ABORT: tipo de entrada não permitido no tar"
  exit 1
fi
[ "$(tar -tzf "$DEST/storage-mnt-stub.tar.gz" | grep -vc '/$')" -eq 2 ] \
  || { echo "ABORT: quantidade de arquivos no tar"; exit 1; }

# Imagem local exata
docker image inspect "$IMG_ID" >/dev/null
[ "$(docker image inspect "$IMG_ID" --format '{{.Id}}')" = "$IMG_ID" ] \
  || { echo "ABORT: ID da imagem"; exit 1; }

# Ferramentas, locale e bibliotecas na imagem exata
docker run --rm --network none --pull=never --entrypoint /bin/sh "$IMG_ID" -c '
  for t in initdb pg_ctl pg_restore psql createdb pg_isready pg_config; do
    command -v "$t" >/dev/null || exit 1
  done
  LC_ALL=en_US.UTF-8 locale charmap | grep -qx UTF-8 || exit 1
  pg_config --configure | grep -q -- '--with-icu' || exit 1
  for l in pg_stat_statements pg_net pgsodium supabase_vault; do
    find /nix/var/nix/profiles/default/lib -name "$l.so" \
      | grep -q . || exit 1
  done
' || { echo "ABORT: ferramentas/locale/plugins da imagem"; exit 1; }

# Dump listável, sem escrever no banco
docker exec -i "$SRC_DB" pg_restore --list \
  < "$DEST/db-postgres.dump" > "$TMP_DIR/toc.txt"
[ "$(wc -l < "$TMP_DIR/toc.txt")" -eq 986 ] \
  || { echo "ABORT: TOC inesperado"; exit 1; }
[ "$(grep -vc '^;' "$TMP_DIR/toc.txt")" -eq 971 ] \
  || { echo "ABORT: número de entradas do TOC inesperado"; exit 1; }
[ "$(awk '$4 == "TABLE" && $5 == "DATA"' "$TMP_DIR/toc.txt" | wc -l)" -eq 72 ] \
  || { echo "ABORT: TABLE DATA inesperado"; exit 1; }
[ "$(grep -c ' EVENT TRIGGER ' "$TMP_DIR/toc.txt")" -eq 6 ] \
  || { echo "ABORT: event triggers inesperados no TOC"; exit 1; }

# Recursos originais e ausência de temporários
docker inspect "$SRC_DB" --format '{{.Id}}|{{.State.StartedAt}}' \
  > "$TMP_DIR/src-db-before.txt"
docker inspect "$SRC_ST" --format '{{.Id}}|{{.State.StartedAt}}' \
  > "$TMP_DIR/src-st-before.txt"
docker volume inspect "$SRC_DB" \
  --format '{{.Name}}|{{.CreatedAt}}|{{.Mountpoint}}' \
  > "$TMP_DIR/src-db-volume-before.txt"
docker volume inspect "$SRC_ST" \
  --format '{{.Name}}|{{.CreatedAt}}|{{.Mountpoint}}' \
  > "$TMP_DIR/src-st-volume-before.txt"
docker volume ls --format '{{.Name}}' | LC_ALL=C sort \
  > "$TMP_DIR/volumes-before.txt"
docker network ls --format '{{.Name}}' | LC_ALL=C sort \
  > "$TMP_DIR/networks-before.txt"
docker ps -a --format '{{.Names}}' | LC_ALL=C sort \
  > "$TMP_DIR/containers-before.txt"

# Estado do banco original
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select
  (select count(*) from auth.users),
  (select count(*) from auth.identities),
  (select count(*) from auth.sessions),
  (select count(*) from public.profiles),
  (select count(*) from public.profile_private),
  (select count(*) from public.connections),
  (select count(*) from storage.objects),
  (select count(*) from supabase_migrations.schema_migrations),
  (select max(version) from supabase_migrations.schema_migrations);
" > "$TMP_DIR/key-before.txt"

# Propriedades do banco e buckets
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select datname, pg_get_userbyid(datdba), datcollate, datctype,
       datlocprovider, coalesce(datlocale,''), pg_encoding_to_char(encoding)
from pg_database where datname = 'postgres';
" > "$TMP_DIR/dbprops-before.txt"

docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select bucket_id, count(*) from storage.objects
group by bucket_id order by bucket_id;
" > "$TMP_DIR/storage-buckets-before.txt"

# Baseline de linhas: usar docker exec sem -i no loop
docker exec "$SRC_DB" psql -U postgres -d postgres -tA -c "
select format('%I.%I', table_schema, table_name)
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema <> 'information_schema'
  and table_schema !~ '^pg_'
order by 1;
" > "$TMP_DIR/tables-before.txt"

while IFS= read -r t; do
  [ -n "$t" ] || continue
  c="$(docker exec "$SRC_DB" psql -U postgres -d postgres -tA -c "select count(*) from $t")"
  printf '%s=%s\n' "$t" "$c"
done < "$TMP_DIR/tables-before.txt" \
  | LC_ALL=C sort > "$TMP_DIR/rowcounts-before.txt"

[ "$(wc -l < "$TMP_DIR/rowcounts-before.txt")" -eq 75 ] \
  || { echo "ABORT: baseline de linhas incompleto"; exit 1; }

# Storage original: conferir sem imprimir caminhos
docker exec -i "$SRC_ST" sh -lc 'cd /mnt && sha256sum -c -' \
  < "$DEST/storage-live-files.sha256" \
  > "$TMP_DIR/storage-live-check.txt" 2>&1
[ "$(grep -c ': OK$' "$TMP_DIR/storage-live-check.txt")" -eq 2 ] \
  || { echo "ABORT: storage original divergente"; exit 1; }

# Git e recursos
git -C "$REPO" rev-parse HEAD > "$TMP_DIR/git-head-before.txt"
git -C "$REPO" status --porcelain=v1 | LC_ALL=C sort \
  > "$TMP_DIR/git-status-before.txt"

avail_kb="$(df -Pk /tmp/opencode | awk 'NR == 2 {print $4}')"
[ "$avail_kb" -ge 2097152 ] || { echo "ABORT: pouco espaço"; exit 1; }
mem_kb="$(awk '/MemAvailable/ {print $2}' /proc/meminfo)"
[ "$mem_kb" -ge 524288 ] || { echo "ABORT: pouca memória"; exit 1; }

# Sem escritores ativos ou transações abertas no original
active="$(docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -c "
select count(*) from pg_stat_activity
where pid <> pg_backend_pid()
  and backend_type = 'client backend'
  and (state is distinct from 'idle' or xact_start is not null);
")"
[ "$active" = "0" ] || { echo "ABORT: escritores/transações ativos no original"; exit 1; }
```

### 7.3 Criação do container isolado

```bash
# NÃO EXECUTAR NA ETAPA 3A

docker run -d --rm \
  --name "$TMP_CTR" \
  --label connexy.g4.27e=disposable-restore \
  --label "connexy.g4.27e.source=$SRC_DB" \
  --network none \
  --pull=never \
  --entrypoint /bin/sh \
  --tmpfs /tmp/pgdata:rw,size=512m \
  --tmpfs /tmp/pgsock:rw,size=64m \
  "$IMG_ID" -c 'trap "exit 0" TERM INT; while :; do sleep 3600; done'

TMP_CTR_ID="$(docker inspect -f '{{.Id}}' "$TMP_CTR")"
[ -n "$TMP_CTR_ID" ] || { echo "ABORT: não foi possível capturar ID do container"; exit 1; }
[ "$(docker inspect "$TMP_CTR_ID" --format '{{.Name}}')" = "/$TMP_CTR" ] || { echo "ABORT: ID não corresponde ao nome"; exit 1; }
[ "$(docker inspect "$TMP_CTR_ID" --format '{{index .Config.Labels "connexy.g4.27e"}}')" = "disposable-restore" ] || { echo "ABORT: label connexy.g4.27e ausente/incorreta"; exit 1; }
[ "$(docker inspect "$TMP_CTR_ID" --format '{{index .Config.Labels "connexy.g4.27e.source"}}')" = "$SRC_DB" ] || { echo "ABORT: label connexy.g4.27e.source ausente/incorreta"; exit 1; }

[ "$(docker inspect "$TMP_CTR" --format '{{.Image}}')" = "$IMG_ID" ] \
  || { echo "ABORT: imagem do alvo"; exit 1; }
[ "$(docker inspect "$TMP_CTR" --format '{{.HostConfig.NetworkMode}}')" = "none" ] \
  || { echo "ABORT: rede do alvo"; exit 1; }

case "$(docker inspect "$TMP_CTR" --format '{{json .HostConfig.PortBindings}}')" in
  ''|'{}'|'null') ;;
  *) echo "ABORT: porta publicada no alvo"; exit 1 ;;
esac

docker inspect "$TMP_CTR" --format '{{json .HostConfig.Tmpfs}}' \
  | grep -q '/tmp/pgdata' || { echo "ABORT: tmpfs pgdata"; exit 1; }
docker inspect "$TMP_CTR" --format '{{json .HostConfig.Tmpfs}}' \
  | grep -q '/tmp/pgsock' || { echo "ABORT: tmpfs socket"; exit 1; }

# R2: allowlist exata de mounts (fail-closed) — apenas dois tmpfs para /tmp/pgdata e /tmp/pgsock
MOUNTS_JSON="$(docker inspect "$TMP_CTR" --format '{{json .Mounts}}')"
[ -n "$MOUNTS_JSON" ] || { echo "ABORT: mounts não inspecionáveis"; exit 1; }
# Deve ser array JSON
echo "$MOUNTS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); assert isinstance(d,list), 'not list'; sys.exit(0)" || { echo "ABORT: formato de mounts inválido"; exit 1; }
# Contagem exata = 2
MOUNTS_COUNT="$(echo "$MOUNTS_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")"
[ "$MOUNTS_COUNT" = "2" ] || { echo "ABORT: mounts divergentes (esperado 2)"; exit 1; }
# Todos tmpfs e destinos exatos
echo "$MOUNTS_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
dests=set()
for m in d:
    t=m.get('Type')
    if t!='tmpfs':
        raise SystemExit('non-tmpfs')
    dest=m.get('Destination')
    if not dest:
        raise SystemExit('no-dest')
    if dest in dests:
        raise SystemExit('dup-dest')
    dests.add(dest)
    if m.get('BindOptions') is not None or m.get('VolumeOptions') is not None:
        raise SystemExit('opts')
# deve ser exatamente estes
if dests != {'/tmp/pgdata','/tmp/pgsock'}:
    raise SystemExit('dest-set')
" || { echo "ABORT: allowlist de mounts falhou (apenas tmpfs em /tmp/pgdata e /tmp/pgsock)"; exit 1; }
```

### 7.4 Inicialização do cluster

```bash
# NÃO EXECUTAR NA ETAPA 3A

docker exec -u root "$TMP_CTR" chown -R postgres:postgres /tmp/pgdata /tmp/pgsock

docker exec -u postgres "$TMP_CTR" initdb \
  -D /tmp/pgdata \
  -U tmp_restore_admin \
  --auth-local=trust \
  --auth-host=reject \
  --encoding=UTF-8 \
  --locale-provider=icu \
  --icu-locale=en-US \
  --locale=en_US.UTF-8 \
  --allow-group-access

docker exec -u postgres "$TMP_CTR" pg_ctl \
  -D /tmp/pgdata \
  -l /tmp/pg.log \
  -o "-c listen_addresses= -c unix_socket_directories=/tmp/pgsock -c wal_level=logical -c shared_preload_libraries=pg_stat_statements,pg_net,pgsodium,supabase_vault -c max_connections=100" \
  start

for _ in $(seq 1 30); do
  if docker exec -u postgres "$TMP_CTR" pg_isready \
    -h /tmp/pgsock -U tmp_restore_admin -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec -u postgres "$TMP_CTR" pg_isready \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres

docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA -F'|' -c "
select
  current_user,
  current_database(),
  current_setting('data_directory'),
  current_setting('listen_addresses'),
  current_setting('wal_level'),
  coalesce(inet_server_addr()::text, 'NULL'),
  coalesce(inet_server_port()::text, 'NULL'),
  (select rolsuper from pg_roles where rolname = 'tmp_restore_admin');
" > "$TMP_DIR/target-preflight.txt"

grep -q '^tmp_restore_admin|postgres|/tmp/pgdata||logical|NULL|NULL|t$' \
  "$TMP_DIR/target-preflight.txt" \
  || { echo "ABORT: alvo não está isolado ou não é superuser"; exit 1; }
```

### 7.5 Restauração de globals e criação do banco

```bash
# NÃO EXECUTAR NA ETAPA 3A

docker exec -i -u postgres "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres \
  -v ON_ERROR_STOP=1 -f - \
  < "$DEST/globals.sql" \
  > "$TMP_DIR/globals-restore.log" 2>&1

docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA \
  -c "select rolname from pg_roles where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin' order by 1" \
  > "$TMP_DIR/roles-restored.txt"
docker exec "$SRC_DB" psql -U postgres -d postgres -tA \
  -c "select rolname from pg_roles where rolname !~ '^pg_' order by 1" \
  > "$TMP_DIR/roles-original.txt"
diff -u "$TMP_DIR/roles-original.txt" "$TMP_DIR/roles-restored.txt"

docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA -F'|' -c "
select r.rolname, m.rolname, am.admin_option
from pg_auth_members am
join pg_roles r on r.oid = am.roleid
join pg_roles m on m.oid = am.member
order by 1, 2;
" > "$TMP_DIR/memberships-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select r.rolname, m.rolname, am.admin_option
from pg_auth_members am
join pg_roles r on r.oid = am.roleid
join pg_roles m on m.oid = am.member
order by 1, 2;
" > "$TMP_DIR/memberships-original.txt"
diff -u "$TMP_DIR/memberships-original.txt" "$TMP_DIR/memberships-restored.txt"

docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA -F'|' -c "
select rolname, coalesce(array_to_string(rolconfig, E'\n'), '')
from pg_roles
where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin'
order by 1;
" > "$TMP_DIR/rolconfig-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select rolname, coalesce(array_to_string(rolconfig, E'\n'), '')
from pg_roles
where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin'
order by 1;
" > "$TMP_DIR/rolconfig-original.txt"
diff -u "$TMP_DIR/rolconfig-original.txt" "$TMP_DIR/rolconfig-restored.txt"

[ "$(docker exec "$TMP_CTR" psql -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA \
  -c "select count(*) from pg_roles where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin'")" -eq 16 ] \
  || { echo "ABORT: contagem de roles restauradas"; exit 1; }
[ "$(docker exec "$TMP_CTR" psql -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA \
  -c "select count(*) from pg_auth_members")" -eq 25 ] \
  || { echo "ABORT: contagem de memberships restauradas"; exit 1; }
[ "$(docker exec "$TMP_CTR" psql -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA \
  -c "select count(*) from pg_roles where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin' and rolconfig is not null")" -eq 10 ] \
  || { echo "ABORT: contagem de rolconfig restauradas"; exit 1; }
[ "$(docker exec "$TMP_CTR" psql -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA \
  -c "select rolsuper from pg_roles where rolname = 'supabase_admin'")" = "t" ] \
  || { echo "ABORT: supabase_admin não é superuser no alvo"; exit 1; }

# Não consultar nem imprimir pg_authid.rolpassword; a prova não depende dos
# hashes de senha. Validar nomes, atributos, memberships e configurações.

SRC_DB_OWNER="$(docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA \
  -c "select pg_get_userbyid(datdba) from pg_database where datname = 'postgres'")"
[ "$SRC_DB_OWNER" = "postgres" ] \
  || { echo "ABORT: owner inesperado do banco original"; exit 1; }

docker exec -u postgres "$TMP_CTR" createdb \
  -h /tmp/pgsock -U tmp_restore_admin \
  --template=template0 \
  --encoding=UTF8 \
  --locale-provider=icu \
  --icu-locale=en-US \
  --locale=en_US.UTF-8 \
  "$RESTORE_DB"

docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "alter database \"$RESTORE_DB\" owner to \"$SRC_DB_OWNER\";"

docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d postgres -tA -F'|' -c "
select datname, pg_get_userbyid(datdba), datcollate, datctype,
       datlocprovider, coalesce(datlocale,''), pg_encoding_to_char(encoding)
from pg_database
where datname = '$RESTORE_DB';
" > "$TMP_DIR/restore-dbprops.txt"
grep -q "^$RESTORE_DB|postgres|en_US.UTF-8|en_US.UTF-8|i|en-US|UTF8$" \
  "$TMP_DIR/restore-dbprops.txt" \
  || { echo "ABORT: owner/propriedades do banco de restore"; exit 1; }

# Compara owner, collation, ctype, provider, locale e encoding com a origem.
diff -u \
  <(cut -d'|' -f2- "$TMP_DIR/dbprops-before.txt") \
  <(cut -d'|' -f2- "$TMP_DIR/restore-dbprops.txt") \
  || { echo "ABORT: propriedades do banco de restore divergentes"; exit 1; }
```

### 7.6 Restauração completa do dump

```bash
# NÃO EXECUTAR NA ETAPA 3A

# Executar como supabase_admin (superuser na origem) para que o owner das
# extensões e do schema `net`, criado por pg_net, coincida com a origem.
# --single-transaction evita estado parcial. Os 6 event triggers do dump podem
# disparar NOTIFY/grants no alvo temporário; qualquer erro aborta a transação.
docker exec -i -u postgres "$TMP_CTR" pg_restore \
  -h /tmp/pgsock \
  -U supabase_admin \
  -d "$RESTORE_DB" \
  --exit-on-error \
  --single-transaction \
  --verbose \
  < "$DEST/db-postgres.dump" \
  > "$TMP_DIR/pg_restore.log" 2>&1
```

### 7.7 Verificação do banco restaurado

```bash
# NÃO EXECUTAR NA ETAPA 3A

# Alvo correto
docker exec "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select
  current_database(),
  current_setting('data_directory'),
  current_setting('listen_addresses'),
  current_setting('wal_level'),
  coalesce(inet_server_addr()::text, 'NULL'),
  coalesce(inet_server_port()::text, 'NULL');
" > "$TMP_DIR/restored-target.txt"

grep -q "^$RESTORE_DB|/tmp/pgdata||logical|NULL|NULL$" \
  "$TMP_DIR/restored-target.txt" \
  || { echo "ABORT: alvo restaurado não isolado"; exit 1; }

# Contagens-chave
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select
  (select count(*) from auth.users),
  (select count(*) from auth.identities),
  (select count(*) from auth.sessions),
  (select count(*) from public.profiles),
  (select count(*) from public.profile_private),
  (select count(*) from public.connections),
  (select count(*) from storage.objects),
  (select count(*) from supabase_migrations.schema_migrations),
  (select max(version) from supabase_migrations.schema_migrations);
" > "$TMP_DIR/key-restored.txt"
diff -u "$TMP_DIR/key-before.txt" "$TMP_DIR/key-restored.txt"

# Propriedades do banco restaurado (owner, locale, encoding)
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select datname, pg_get_userbyid(datdba), datcollate, datctype,
       datlocprovider, coalesce(datlocale,''), pg_encoding_to_char(encoding)
from pg_database where datname = current_database();
" > "$TMP_DIR/dbprops-restored.txt"
diff -u \
  <(cut -d'|' -f2- "$TMP_DIR/dbprops-before.txt") \
  <(cut -d'|' -f2- "$TMP_DIR/dbprops-restored.txt") \
  || { echo "ABORT: propriedades do banco restaurado divergentes"; exit 1; }

# Contagem de objetos de storage por bucket
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select bucket_id, count(*) from storage.objects
group by bucket_id order by bucket_id;
" > "$TMP_DIR/storage-buckets-restored.txt"
diff -u "$TMP_DIR/storage-buckets-before.txt" "$TMP_DIR/storage-buckets-restored.txt"

# Contagens de catálogo, sequences e fingerprints de índices/constraints
CATALOG_SQL="
select 'catalog',
  (select count(*) from pg_namespace where nspname !~ '^pg_' and nspname <> 'information_schema'),
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind in ('r','p') and n.nspname !~ '^pg_' and n.nspname <> 'information_schema'),
  (select count(*) from pg_indexes where schemaname !~ '^pg_' and schemaname <> 'information_schema'),
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'S' and n.nspname !~ '^pg_' and n.nspname <> 'information_schema'),
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'),
  (select count(*) from pg_constraint con join pg_namespace n on n.oid = con.connamespace where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'),
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'v' and n.nspname !~ '^pg_' and n.nspname <> 'information_schema'),
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'm' and n.nspname !~ '^pg_' and n.nspname <> 'information_schema'),
  (select count(*) from pg_trigger where not tgisinternal),
  (select count(*) from pg_event_trigger);
select 'index_fp', md5(string_agg(indexdef, E'\n' ORDER BY schemaname, tablename, indexname))
from pg_indexes where schemaname !~ '^pg_' and schemaname <> 'information_schema';
select 'constraint_fp', md5(string_agg(
  n.nspname || '.' || coalesce(c.relname, con.contypid::regtype::text) || ':' ||
  con.conname || ':' || pg_get_constraintdef(con.oid),
  E'\n' ORDER BY n.nspname,
  coalesce(c.relname, con.contypid::regtype::text), con.conname))
from pg_constraint con
join pg_namespace n on n.oid = con.connamespace
left join pg_class c on c.oid = con.conrelid
where n.nspname !~ '^pg_' and n.nspname <> 'information_schema';
select schemaname, sequencename, last_value, is_called
from pg_sequences
where schemaname !~ '^pg_' and schemaname <> 'information_schema'
order by 1, 2;
"

docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "$CATALOG_SQL" \
  > "$TMP_DIR/catalog-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "$CATALOG_SQL" \
  > "$TMP_DIR/catalog-original.txt"
diff -u "$TMP_DIR/catalog-original.txt" "$TMP_DIR/catalog-restored.txt"

# Storage buckets, configuração, objetos e política pública
STORAGE_SQL="
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;
select 'bucket_fp', md5(string_agg(to_jsonb(b)::text, E'\n' ORDER BY id)) from storage.buckets b;
select 'object_fp', md5(string_agg(to_jsonb(o)::text, E'\n' ORDER BY id)) from storage.objects o;
select policyname from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
"
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "$STORAGE_SQL" \
  > "$TMP_DIR/storage-objects-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "$STORAGE_SQL" \
  > "$TMP_DIR/storage-objects-original.txt"
diff -u "$TMP_DIR/storage-objects-original.txt" "$TMP_DIR/storage-objects-restored.txt"

# Baseline de linhas: recalcular o original e comparar com o restaurado
while IFS= read -r t; do
  [ -n "$t" ] || continue
  c="$(docker exec "$TMP_CTR" psql \
    -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA \
    -c "select count(*) from $t")"
  printf '%s=%s\n' "$t" "$c"
done < "$TMP_DIR/tables-before.txt" \
  | LC_ALL=C sort > "$TMP_DIR/rowcounts-restored.txt"
diff -u "$TMP_DIR/rowcounts-before.txt" "$TMP_DIR/rowcounts-restored.txt"

# Roles e atributos (sem senhas)
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
from pg_roles
where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin'
order by 1;
" > "$TMP_DIR/role-attrs-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
from pg_roles
where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin'
order by 1;
" > "$TMP_DIR/role-attrs-original.txt"
diff -u "$TMP_DIR/role-attrs-original.txt" "$TMP_DIR/role-attrs-restored.txt"

# Extensões, publicações e schemas.
# `plpgsql` é extensão bootstrap: o initdb a cria como tmp_restore_admin e
# `ALTER EXTENSION` não altera owner; por isso ela usa o marcador BOOTSTRAP.
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select extname, extversion,
       case when extname = 'plpgsql' then 'BOOTSTRAP'
            else extowner::regrole::text end
from pg_extension order by 1;
select pubname, pubowner::regrole::text, puballtables from pg_publication order by 1;
select nspname, nspowner::regrole::text,
       coalesce(nspacl::text, '')
from pg_namespace
where nspname !~ '^pg_' and nspname <> 'information_schema'
order by 1;
" > "$TMP_DIR/schema-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select extname, extversion,
       case when extname = 'plpgsql' then 'BOOTSTRAP'
            else extowner::regrole::text end
from pg_extension order by 1;
select pubname, pubowner::regrole::text, puballtables from pg_publication order by 1;
select nspname, nspowner::regrole::text,
       coalesce(nspacl::text, '')
from pg_namespace
where nspname !~ '^pg_' and nspname <> 'information_schema'
order by 1;
" > "$TMP_DIR/schema-original.txt"
diff -u "$TMP_DIR/schema-original.txt" "$TMP_DIR/schema-restored.txt"

# Owners e ACLs de tabelas
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select n.nspname, c.relname, c.relowner::regrole::text,
       coalesce(c.relacl::text, '')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p')
  and n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by 1, 2;
" > "$TMP_DIR/table-acl-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select n.nspname, c.relname, c.relowner::regrole::text,
       coalesce(c.relacl::text, '')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p')
  and n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by 1, 2;
" > "$TMP_DIR/table-acl-original.txt"
diff -u "$TMP_DIR/table-acl-original.txt" "$TMP_DIR/table-acl-restored.txt"

# Owners e ACLs de funções
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select n.nspname, p.proname,
       pg_get_function_identity_arguments(p.oid),
       p.proowner::regrole::text,
       coalesce(p.proacl::text, '')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by 1, 2, 3;
" > "$TMP_DIR/function-acl-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select n.nspname, p.proname,
       pg_get_function_identity_arguments(p.oid),
       p.proowner::regrole::text,
       coalesce(p.proacl::text, '')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by 1, 2, 3;
" > "$TMP_DIR/function-acl-original.txt"
diff -u "$TMP_DIR/function-acl-original.txt" "$TMP_DIR/function-acl-restored.txt"

# Default ACLs
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select defaclrole::regrole::text,
       coalesce(defaclnamespace::regnamespace::text, ''),
       defaclobjtype,
       defaclacl::text
from pg_default_acl
order by 1, 2, 3, 4;
" > "$TMP_DIR/default-acl-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select defaclrole::regrole::text,
       coalesce(defaclnamespace::regnamespace::text, ''),
       defaclobjtype,
       defaclacl::text
from pg_default_acl
order by 1, 2, 3, 4;
" > "$TMP_DIR/default-acl-original.txt"
diff -u "$TMP_DIR/default-acl-original.txt" "$TMP_DIR/default-acl-restored.txt"

# Políticas e triggers
docker exec -i "$TMP_CTR" psql \
  -h /tmp/pgsock -U tmp_restore_admin -d "$RESTORE_DB" -tA -F'|' -c "
select schemaname, tablename, policyname, permissive, roles::text, cmd,
       coalesce(qual, ''), coalesce(with_check, '')
from pg_policies
where schemaname !~ '^pg_' and schemaname <> 'information_schema'
order by 1, 2, 3;
select n.nspname, c.relname, t.tgname, pg_get_triggerdef(t.oid, true)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by 1, 2, 3;
select evtname, evtevent, evtowner::regrole::text, evtfoid::regproc::text, evtenabled
from pg_event_trigger
order by 1;
" > "$TMP_DIR/policies-triggers-restored.txt"
docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select schemaname, tablename, policyname, permissive, roles::text, cmd,
       coalesce(qual, ''), coalesce(with_check, '')
from pg_policies
where schemaname !~ '^pg_' and schemaname <> 'information_schema'
order by 1, 2, 3;
select n.nspname, c.relname, t.tgname, pg_get_triggerdef(t.oid, true)
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
order by 1, 2, 3;
select evtname, evtevent, evtowner::regrole::text, evtfoid::regproc::text, evtenabled
from pg_event_trigger
order by 1;
" > "$TMP_DIR/policies-triggers-original.txt"
diff -u "$TMP_DIR/policies-triggers-original.txt" "$TMP_DIR/policies-triggers-restored.txt"
```

### 7.8 Verificação do storage

```bash
# NÃO EXECUTAR NA ETAPA 3A

if tar -tvzf "$DEST/storage-mnt-stub.tar.gz" \
  | awk '{print substr($1,1,1)}' | grep -Evq '^[d-]$'; then
  echo "ABORT: entrada especial no tar"
  exit 1
fi

install -d -m 700 "$TMP_DIR/storage"
tar -xzf "$DEST/storage-mnt-stub.tar.gz" \
  -C "$TMP_DIR/storage" \
  --no-same-owner --no-same-permissions --no-overwrite-dir

[ "$(find "$TMP_DIR/storage" -type f | wc -l)" -eq 2 ] \
  || { echo "ABORT: quantidade de arquivos extraídos"; exit 1; }
[ "$(find "$TMP_DIR/storage" -type l | wc -l)" -eq 0 ] \
  || { echo "ABORT: symlink extraído"; exit 1; }

( cd "$TMP_DIR/storage" && sha256sum -c "$DEST/storage-tar-files.sha256" ) \
  > "$TMP_DIR/storage-sha-check.txt" 2>&1 \
  || { echo "ABORT: hash de storage restaurado divergente"; exit 1; }

[ "$(grep -c ': OK$' "$TMP_DIR/storage-sha-check.txt")" -eq 2 ] \
  || { echo "ABORT: quantidade de arquivos de storage"; exit 1; }

if grep -q 'FAILED' "$TMP_DIR/storage-sha-check.txt"; then
  echo "ABORT: arquivo de storage com hash divergente"
  exit 1
fi

# Não manter conteúdo de storage após a prova por hash
rm -rf -- "$TMP_DIR/storage"
```

### 7.9 Preservação do original e limpeza

```bash
# NÃO EXECUTAR NA ETAPA 3A

# O original não pode ter mudado
docker inspect "$SRC_DB" --format '{{.Id}}|{{.State.StartedAt}}' \
  > "$TMP_DIR/src-db-after.txt"
docker inspect "$SRC_ST" --format '{{.Id}}|{{.State.StartedAt}}' \
  > "$TMP_DIR/src-st-after.txt"
diff -u "$TMP_DIR/src-db-before.txt" "$TMP_DIR/src-db-after.txt"
diff -u "$TMP_DIR/src-st-before.txt" "$TMP_DIR/src-st-after.txt"

docker volume inspect "$SRC_DB" \
  --format '{{.Name}}|{{.CreatedAt}}|{{.Mountpoint}}' \
  > "$TMP_DIR/src-db-volume-after.txt"
docker volume inspect "$SRC_ST" \
  --format '{{.Name}}|{{.CreatedAt}}|{{.Mountpoint}}' \
  > "$TMP_DIR/src-st-volume-after.txt"
diff -u "$TMP_DIR/src-db-volume-before.txt" "$TMP_DIR/src-db-volume-after.txt"
diff -u "$TMP_DIR/src-st-volume-before.txt" "$TMP_DIR/src-st-volume-after.txt"

sha256sum -c "$DEST/SHA256SUMS"
sha256sum -c "$DEST/MANIFEST.sha256"

docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select
  (select count(*) from auth.users),
  (select count(*) from auth.identities),
  (select count(*) from auth.sessions),
  (select count(*) from public.profiles),
  (select count(*) from public.profile_private),
  (select count(*) from public.connections),
  (select count(*) from storage.objects),
  (select count(*) from supabase_migrations.schema_migrations),
  (select max(version) from supabase_migrations.schema_migrations);
" > "$TMP_DIR/key-after.txt"
diff -u "$TMP_DIR/key-before.txt" "$TMP_DIR/key-after.txt"

while IFS= read -r t; do
  [ -n "$t" ] || continue
  c="$(docker exec "$SRC_DB" psql -U postgres -d postgres -tA \
    -c "select count(*) from $t")"
  printf '%s=%s\n' "$t" "$c"
done < "$TMP_DIR/tables-before.txt" \
  | LC_ALL=C sort > "$TMP_DIR/rowcounts-after.txt"
diff -u "$TMP_DIR/rowcounts-before.txt" "$TMP_DIR/rowcounts-after.txt"

docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select datname, pg_get_userbyid(datdba), datcollate, datctype,
       datlocprovider, coalesce(datlocale,''), pg_encoding_to_char(encoding)
from pg_database where datname = 'postgres';
" > "$TMP_DIR/dbprops-after.txt"
diff -u "$TMP_DIR/dbprops-before.txt" "$TMP_DIR/dbprops-after.txt"

docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select bucket_id, count(*) from storage.objects
group by bucket_id order by bucket_id;
" > "$TMP_DIR/storage-buckets-after.txt"
diff -u "$TMP_DIR/storage-buckets-before.txt" "$TMP_DIR/storage-buckets-after.txt"

docker exec "$SRC_DB" psql -U postgres -d postgres -tA \
  -c "select rolname from pg_roles where rolname !~ '^pg_' order by 1" \
  > "$TMP_DIR/roles-original-after.txt"
diff -u "$TMP_DIR/roles-original.txt" "$TMP_DIR/roles-original-after.txt"

docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select r.rolname, m.rolname, am.admin_option
from pg_auth_members am
join pg_roles r on r.oid = am.roleid
join pg_roles m on m.oid = am.member
order by 1, 2;
" > "$TMP_DIR/memberships-original-after.txt"
diff -u "$TMP_DIR/memberships-original.txt" "$TMP_DIR/memberships-original-after.txt"

docker exec -i "$SRC_DB" psql -U postgres -d postgres -tA -F'|' -c "
select rolname, coalesce(array_to_string(rolconfig, E'\n'), '')
from pg_roles
where rolname !~ '^pg_' and rolname <> 'tmp_restore_admin'
order by 1;
" > "$TMP_DIR/rolconfig-original-after.txt"
diff -u "$TMP_DIR/rolconfig-original.txt" "$TMP_DIR/rolconfig-original-after.txt"

git -C "$REPO" rev-parse HEAD > "$TMP_DIR/git-head-after.txt"
git -C "$REPO" status --porcelain=v1 | LC_ALL=C sort \
  > "$TMP_DIR/git-status-after.txt"
diff -u "$TMP_DIR/git-head-before.txt" "$TMP_DIR/git-head-after.txt"
diff -u "$TMP_DIR/git-status-before.txt" "$TMP_DIR/git-status-after.txt"

# Storage original após o restore
docker exec -i "$SRC_ST" sh -lc 'cd /mnt && sha256sum -c -' \
  < "$DEST/storage-live-files.sha256" \
  > "$TMP_DIR/storage-live-after.txt" 2>&1
[ "$(grep -c ': OK$' "$TMP_DIR/storage-live-after.txt")" -eq 2 ] \
  || { echo "ABORT: storage original divergente após restore"; exit 1; }

# Volumes e redes: nenhum recurso temporário, original inalterado
docker volume ls --format '{{.Name}}' | LC_ALL=C sort \
  > "$TMP_DIR/volumes-before-cleanup.txt"
diff -u "$TMP_DIR/volumes-before.txt" "$TMP_DIR/volumes-before-cleanup.txt"
docker network ls --format '{{.Name}}' | LC_ALL=C sort \
  > "$TMP_DIR/networks-before-cleanup.txt"
diff -u "$TMP_DIR/networks-before.txt" "$TMP_DIR/networks-before-cleanup.txt"

# Cleanup explícito (o trap também cobre falhas) — condicionado por ID + labels (R1)
if [ -n "${TMP_CTR_ID:-}" ] && docker inspect "$TMP_CTR_ID" >/dev/null 2>&1; then
  ctr_name_ok="$(docker inspect "$TMP_CTR_ID" --format '{{.Name}}' 2>/dev/null | grep -Fxq "/$TMP_CTR" && echo 1 || echo 0)"
  ctr_label_a_ok="$(docker inspect "$TMP_CTR_ID" --format '{{index .Config.Labels "connexy.g4.27e"}}' 2>/dev/null | grep -Fxq "disposable-restore" && echo 1 || echo 0)"
  ctr_label_b_ok="$(docker inspect "$TMP_CTR_ID" --format '{{index .Config.Labels "connexy.g4.27e.source"}}' 2>/dev/null | grep -Fxq "$SRC_DB" && echo 1 || echo 0)"
  if [ "$ctr_name_ok" = "1" ] && [ "$ctr_label_a_ok" = "1" ] && [ "$ctr_label_b_ok" = "1" ]; then
    docker rm -f "$TMP_CTR_ID" >/dev/null 2>&1 || true
  else
    echo "CLEANUP_EXPLÍCITO: AMBIGUIDADE/OWNERSHIP NÃO COMPROVADO — NÃO REMOVIDO" >&2
    echo "CLEANUP_INSEGURA=1" >> "$TMP_DIR/cleanup-status.txt" 2>/dev/null || true
  fi
else
  echo "CLEANUP_EXPLÍCITO: ID não disponível ou container não encontrado — NÃO REMOVIDO (nunca apenas por nome)" >&2
  echo "CLEANUP_INSEGURA=1" >> "$TMP_DIR/cleanup-status.txt" 2>/dev/null || true
fi
docker ps -a --format '{{.Names}}' | LC_ALL=C sort \
  > "$TMP_DIR/containers-after-cleanup.txt"
diff -u "$TMP_DIR/containers-before.txt" "$TMP_DIR/containers-after-cleanup.txt"
docker volume ls --format '{{.Name}}' | LC_ALL=C sort \
  > "$TMP_DIR/volumes-after-cleanup.txt"
diff -u "$TMP_DIR/volumes-before.txt" "$TMP_DIR/volumes-after-cleanup.txt"
docker network ls --format '{{.Name}}' | LC_ALL=C sort \
  > "$TMP_DIR/networks-after-cleanup.txt"
diff -u "$TMP_DIR/networks-before.txt" "$TMP_DIR/networks-after-cleanup.txt"

if [ "${G4_27E_KEEP_TMP:-0}" = "1" ]; then
  echo "Evidências preservadas em: $TMP_DIR"
else
  rm -rf -- "$TMP_DIR"
  [ ! -e "$TMP_DIR" ] || { echo "ABORT: diretório temporário permaneceu"; exit 1; }
fi
```

## 8. Critérios de verificação

| Critério | Evidência exigida | Obrigatório |
|---|---|---|
| Backup íntegro | `SHA256SUMS` e `MANIFEST.sha256` exit `0` | Sim |
| Dump listável | `pg_restore --list` exit `0`; `986` linhas, `971` entradas, `72` `TABLE DATA`, `6` `EVENT TRIGGER` | Sim |
| Storage de origem íntegro | `2` arquivos `OK` contra `storage-live-files.sha256` | Sim |
| Tar seguro | sem caminho absoluto/`..`; somente diretório/arquivo regular; `2` arquivos | Sim |
| Imagem local exata | ID `sha256:99b...3459`; `--pull=never`; ferramentas, locale, ICU e plugins | Sim |
| Alvo sem rede | `NetworkMode=none`; `inet_server_addr=NULL`; `inet_server_port=NULL` | Sim |
| Alvo sem portas | `PortBindings` vazio | Sim |
| Alvo sem volumes/dados originais | nenhum `supabase_`/volume/bind de dados em `Mounts`; somente tmpfs | Sim |
| Superusuários do alvo | `tmp_restore_admin` e `supabase_admin` com `rolsuper=t` | Sim |
| Globals restaurados | `diff` de roles, memberships e `rolconfig` vazio | Sim |
| Dump completo | `pg_restore -U supabase_admin --exit-on-error` exit `0` | Sim |
| Owner/propriedades do banco | `g4_27e_restore_*` com owner, collation, ctype, provider, locale e encoding iguais à origem | Sim |
| Contagens-chave | `diff` de `auth.users`, `identities`, `sessions`, `profiles`, `profile_private`, `connections`, `storage.objects`, migrations e última migration | Sim |
| Linhas por tabela | `diff` de `75` linhas `schema.table=count` vazio | Sim |
| Roles, atributos e config | `diff` sem `tmp_restore_admin` vazio; memberships `25` e `rolconfig` `10` iguais | Sim |
| Catálogo | `diff` de `14` schemas, `75` tabelas, `209` índices, `4` sequences, `130` funções, `96` políticas, `18` triggers e `6` event triggers | Sim |
| Schema/ACLs | `diff` de schemas, tabelas, funções e default ACLs vazio | Sim |
| Políticas/triggers/event triggers/buckets | `diff` de todas as políticas, triggers, event triggers e buckets vazio | Sim |
| Extensões/publicações | `diff` de nomes/versões/owners (exceto owner bootstrap de `plpgsql`) e publicações vazio | Sim |
| Storage restaurado | `2` arquivos `OK`; nenhum `FAILED`; bucket config/objetos/políticas iguais | Sim |
| Original preservado | IDs/StartedAt, volume inspect, contagens, linhas, props, roles, hashes e storage inalterados | Sim |
| Git preservado | HEAD e `git status` idênticos ao baseline da Etapa 3B | Sim |
| Cleanup | container e diretório temporários ausentes; nenhum volume/rede criado | Sim |
| Sem segredos impressos | nenhuma senha, hash de senha, JWT ou chave em stdout/log | Sim |
| Sem acesso remoto | nenhuma operação remota, nenhum pull, nenhuma porta | Sim |
| Storage-api | não exigido nesta etapa; prova é por hash de arquivo | Não |
| E2E da aplicação | fora de escopo | Não |

## 9. Critérios de abortar

Abortar e preservar evidências se ocorrer qualquer item abaixo:

1. Hash de backup, manifesto ou storage divergente.
2. `pg_restore --list` falhar ou TOC diferente de `986` linhas, `971` entradas,
   `72` `TABLE DATA` ou `6` `EVENT TRIGGER`.
3. `gzip -t` ou `tar -tzf` falhar; tar com caminho absoluto, `..`, symlink,
   hardlink, device ou FIFO; quantidade de arquivos diferente de `2`.
4. Imagem local ausente ou ID diferente; necessidade de pull; ferramenta,
   locale `en_US.UTF-8`, suporte ICU ou biblioteca de preload ausente.
5. Container, diretório, volume ou rede temporária já existente.
6. Container alvo com rede diferente de `none`, porta publicada, volume
   original ou bind de dados, ou tmpfs ausente.
7. `initdb`, `pg_ctl` ou `pg_isready` falhar.
8. `listen_addresses` não vazio, `inet_server_addr`/`inet_server_port` não nulos
   ou `data_directory` diferente de `/tmp/pgdata`.
9. `tmp_restore_admin` ou `supabase_admin` não for superuser.
10. `globals.sql` falhar; roles, memberships ou `rolconfig` divergirem.
11. `createdb` falhar; owner, collation, ctype, provider, locale ou encoding do
    banco de restore divergirem da origem.
12. `pg_restore` retornar diferente de `0`, mesmo com `--exit-on-error`.
13. Qualquer `diff` de contagens, linhas, roles, schema, ACLs, catálogo,
    sequences, índices, constraints, políticas, triggers, buckets, extensões,
    publicações ou migrações não vazio.
14. Storage restaurado com arquivo `FAILED`, quantidade diferente de `2`, hash
    divergente, symlink ou configuração/objetos/políticas de bucket divergentes.
15. Estado original alterado: IDs/StartedAt, volume inspect, contagens, linhas,
    props do banco, roles, storage, backups, HEAD ou `git status`.
16. Qualquer comando apontar para o banco, volume, rede ou storage originais.
17. Qualquer tentativa de acesso remoto, pull de imagem, Supabase CLI, E2E ou
    migration.
18. Falha de cleanup que deixe container, diretório, volume ou rede temporária.
19. Evidência necessária não transcrita antes de remover `$TMP_DIR`.

Em falha, remover o container temporário, reter somente logs em `$TMP_DIR` para
auditoria e não reutilizar o cluster. Não fazer fallback para o original.

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Restore não comprovado | Falha só descoberta na execução | Preflight, `--exit-on-error`, verificação por diff e aborto |
| Extensões/ACLs/owners falharem | Restore parcial ou divergente | Restaurar `globals.sql` primeiro; usar `pg_restore -U supabase_admin`; usar imagem local exata; abortar em erro |
| Event triggers de DDL dispararem durante o restore | Falha ou efeito colateral no alvo temporário | Restaurar em transação única; abortar em erro; verificar event triggers por `diff` |
| `globals.sql` conter hashes de senha | Exposição de segredo | Restaurar apenas no cluster temporário; não imprimir; limpar após uso |
| Dump conter dados pessoais | Exposição | Não imprimir dados; logs temporários `0700`; cleanup; logs de falha não devem ser compartilhados e devem ser removidos após análise |
| Metadados de `storage.objects` conterem dados pessoais | Exposição em `to_jsonb` | Usar apenas fingerprint `md5`; não imprimir linhas; limpar `$TMP_DIR` |
| Container/rede/volume residual | Exposição ou conflito | Nome/label exclusivos; `--network none`; tmpfs; cleanup verificado |
| Escrita acidental no original | Corrupção de dados | Comandos usam variáveis explícitas; guardas; verificação de IDs/StartedAt |
| Original mudar durante o teste | Falso negativo de verificação | Baseline imediatamente antes; abortar se houver escrita ativa; revalidar após |
| Locale/ICU indisponível na imagem | `createdb`/`initdb` falham | Preflight de `locale charmap` e provider ICU antes de criar o cluster |
| Sequence/estado de catálogo divergir | Restore aparente, mas não fiel | Comparar `pg_sequences`, contagens e fingerprints de índices/constraints; abortar |
| Owner da extensão bootstrap `plpgsql` não é preservado | Divergência cosmética de owner | Documentada; `plpgsql` é criada pelo `initdb` e não aceita `ALTER EXTENSION OWNER`; comparar nome/versão e marcar owner como `BOOTSTRAP` |
| Tar com entrada especial | Escrita fora do diretório | Rejeitar symlink/hardlink/device/FIFO antes e depois da extração |
| Inspeção efêmera da imagem | Criação de container fora do escopo literal | Já declarada no relatório; usar apenas `--rm --network none --pull=never`, sem volumes/portas, e confirmar limpeza |
| Storage-api não testado | Integração não provada | Fora de escopo; prova por hash; teste de API fica para etapa futura |
| Divergência de project ref | Comandos no alvo errado | Não usar Supabase CLI; usar nomes de container explícitos |
| Fingerprint de linhas incorreto | Verificação inválida | Usar `docker exec` sem `-i` no loop; exigir `75` linhas; recalcular baseline |

## 11. Ações que ainda exigem autorização

1. Autorizar a Etapa 3B para criar o diretório temporário e o container
   descartável.
2. Autorizar o uso da imagem local exata, com `--pull=never` e `--network none`,
   inclusive containers efêmeros de inspeção (`docker run --rm`) sem volumes,
   portas ou rede.
3. Autorizar consultas SQL somente leitura no banco original durante preflight e
   verificação, via `docker exec` no `$SRC_DB`.
4. Autorizar a restauração de `globals.sql` no cluster temporário.
5. Autorizar a extração do storage em `/tmp/opencode/g4-27e-restore-<ts>`.
6. Autorizar a retenção de logs temporários em caso de falha; remoção completa em
   caso de sucesso, salvo `G4_27E_KEEP_TMP=1` para auditoria.
7. Decidir se haverá teste opcional de storage-api em etapa separada. Não é
   necessário para a prova por hash e não deve ser incluído na Etapa 3B.
8. Confirmar que não haverá E2E, migration, acesso remoto, commit ou push.

Sem essas autorizações, a Etapa 3B não deve ser executada. A inspeção efêmera já
realizada da imagem não autoriza o restore nem a criação de novos containers
persistentes.

## 12. Conclusão

O backup da Etapa 2 está íntegro e listável: TOC com `971` entradas, `72`
`TABLE DATA` e `6` event triggers; catálogo com `14` schemas, `75` tabelas,
`209` índices, `4` sequences, `130` funções, `96` políticas, `18` triggers e
`6` event triggers; `25` memberships e `10` roles com `rolconfig`. A imagem local
contém as ferramentas, o locale `en_US.UTF-8` e as bibliotecas de preload
necessárias, e o procedimento de isolamento proposto não depende de rede, portas
publicadas, volumes originais ou Supabase CLI. O plano é tecnicamente viável e
tem critérios explícitos de verificação e aborto.

O veredito é **APTO COM RESSALVAS** porque:

- o restore completo ainda **não foi executado**;
- a restauração de extensões, event triggers, ACLs, owners e `globals.sql` precisa
  ser provada na prática;
- o baseline de linhas, catálogo, sequences e storage deve ser recalculado
  imediatamente antes da execução;
- `globals.sql` contém hashes de senha e exige tratamento temporário rigoroso;
- os event triggers do dump podem disparar `NOTIFY`/grants no alvo temporário;
- o owner da extensão bootstrap `plpgsql` não é preservado pelo `pg_restore`;
  a prova compara nome/versão e trata esse owner como `BOOTSTRAP`;
- a integração com storage-api não será testada nesta etapa, apenas a
  correspondência dos arquivos por hash;
- a execução exige autorização explícita e não admite fallback para o original.

A inspeção efêmera da imagem com `docker run --rm --network none` já foi feita
para verificar ferramentas, locale e plugins; ela não deixou recursos
persistentes e **não constitui prova de restore**. Se qualquer critério de aborto
ocorrer, o resultado deve ser registrado como falha de restore, sem alterar o
banco original ou o ambiente remoto.

## 13. Referências

- `docs/audits/connexy-database-g4-27e-snapshot-restore-readiness.md`
- `docs/audits/connexy-database-g4-27e-local-backup.md`
- `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/MANIFEST.txt`
- `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/SHA256SUMS`
- `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/validation.txt`
- `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/db-postgres.toc.txt`
- `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/storage-tar-files.sha256`
- `supabase/config.toml`
- `AGENTS.md`
