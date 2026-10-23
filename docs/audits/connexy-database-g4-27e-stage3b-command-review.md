# G4.27E — Revisão final da Etapa 3B (READ-ONLY)

**Data:** 2026-10-22  
**Natureza:** revisão read-only do plano e dos artefatos; nenhum restore executado.  
**Veredito:** **APTO COM RESSALVAS** — o desenho é viável e o backup está íntegro, mas a execução não deve ser autorizada antes de corrigir as ressalvas R1 e R2 e aceitar formalmente R3–R6.

> Este relatório não altera o plano existente. Os comandos A–I são reproduzidos
> para revisão; **todos os comandos B–I permanecem NÃO EXECUTADOS**. A Fase B é
> o preflight proposto para a 3B; os fatos abaixo foram conferidos apenas por
> leitura nesta revisão ou em auditorias anteriores.

## 1. Escopo e limites

- Revisar o plano operacional, a sequência de comandos, os riscos, os critérios
  de abortar e os limites de autorização.
- Não criar/remover bancos, containers, volumes, redes ou diretórios de teste.
- Não restaurar o dump, não executar migrations/E2E e não escrever no banco ou
  no storage original.
- Não alterar configuração do Docker, do Supabase CLI ou do repositório.
- Não acessar o Supabase remoto; não usar projeto `rsukwuqocgjmwwuwtqaf`.
- Não imprimir senhas, tokens, chaves ou hashes de senha.
- A aprovação deste parecer **não autoriza** a execução da 3B. A execução exige
  nova autorização explícita, após tratamento das ressalvas.

## 2. Evidências verificadas

### 2.1 Backup local

Diretório: `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z`

| Artefato | Tamanho | SHA-256 |
|---|---:|---|
| `db-postgres.dump` | 1.033.956 B | `200fe72642b865955b230f0a6608d1e982b52c6e31015b67b906ab9783028361` |
| `globals.sql` | 7.436 B | `93579a052a8967d92b71c1742932d5782134d649b6563f20cdf953e0488e5be8` |
| `storage-mnt-stub.tar.gz` | 207.995 B | `c2ab0c450095d00a4a41d30de6adab4f66577eaec37c5b6f33927f1c37caf00d` |
| `MANIFEST.txt` | — | `adfc312ec79b9ca3e7586c0bfbdb0958a100b7695a12394cfa032e8b87d9ff07` |
| `storage-tar-files.sha256` | — | `e41a1972f5453e4cb1f0fa2ebb40da2ddcb38878905b85eea7c4930d70e096c5` |

- Arquivos `0600`; diretório `0700`.
- `MANIFEST.txt` contém metadados de origem, não segredos.
- `storage-mnt-stub.tar.gz`: 8 diretórios + 2 arquivos; sem caminhos absolutos,
  `..`, symlinks ou entradas especiais; arquivos com modo `0644` no tar.
- `state-diff.txt` e `storage-diff.txt` vazios; logs de erro de dump/restore/list
  vazios.

### 2.2 Origem

- Containers: `supabase_db_lzejdgfvtybarpbgwsyp` e
  `supabase_storage_lzejdgfvtybarpbgwsyp`.
- Rede: `connexy-supabase-local`; volumes homônimos.
- Imagem de origem/target: `sha256:99b1729aeb0bac314445024fc149fbd39306170b61dd50800ccf180327ab3459`
  (`public.ecr.aws/supabase/postgres:17.6.1.158`).
- PostgreSQL 17.6; `pg_config --configure` contém `--with-icu`.
- Banco `postgres`: 18 MB; maior que o suficiente para o tmpfs de 512 MB.
- 16 roles não sistêmicas, 25 memberships, 10 roles com `rolconfig`.
- `postgres` não é superuser; `supabase_admin` é superuser.
- 14 schemas; 75 tabelas; 209 índices; 4 sequences; 130 funções; 96 policies;
  18 triggers; 6 event triggers; 6 extensões; 1 publication; 27 default ACLs.
- Extensões: `pg_net 0.20.4`, `pg_stat_statements 1.11`, `pgcrypto 1.3`,
  `plpgsql 1.0`, `supabase_vault 0.3.1`, `uuid-ossp 1.1`; owners
  `supabase_admin`.
- `net` é schema da extensão `pg_net`; `vault` não é extension-owned.
- `pg_language`: owners `supabase_admin` na origem; o alvo/bootstrap tende a
  `tmp_restore_admin` para `plpgsql`.

### 2.3 TOC

- 986 linhas; 971 entradas; 72 `TABLE DATA`.
- Entradas por tipo: `EXTENSION 5`, `SCHEMA 12`, `POLICY 96`, `ACL 185`,
  `FK 70`, `TRIGGER 18`, `EVENT 6`.
- ACLs: 2 `COLUMN`, 101 `FUNCTION`, 9 `SCHEMA`, 3 `SEQUENCE`, 70 `TABLE`.
- Os schemas explícitos no TOC são 12; `public` e `net` não aparecem como
  `SCHEMA` (são criados pelo template e pela extensão `pg_net`, respectivamente).

### 2.4 Decisões já incorporadas ao plano

- `pg_restore -U supabase_admin`: as extensões são criadas com o owner do
  executor; usar `supabase_admin` reproduz o owner da origem.
- `plpgsql` é bootstrap: `initdb` cria como `tmp_restore_admin`; `ALTER EXTENSION`
  não altera owner; o diff usa o marcador `BOOTSTRAP`.
- Preflight de `pg_config --with-icu`; validação de `supabase_admin` superuser.
- `cleanup` usa `return "$rc"` para preservar o status.

## 3. Achados da revisão

### R1 — Alta — cleanup não comprova ownership do container

**Estado:** **CORRIGIDA DOCUMENTALMENTE** (somente documentos). Não comprovada em execução real.

O `cleanup` original fazia `docker inspect "$TMP_CTR"` e depois `docker rm -f "$TMP_CTR"`, sem verificar labels, ID ou origem. O `TMP_CTR` tem nome previsível por timestamp. Se o container temporário já tiver desaparecido e outro container com o mesmo nome tiver sido criado, o cleanup poderia remover o recurso errado.

**Correção aplicada ao plano (7.1, 7.3, 7.9):**
- Capturar e armazenar `$TMP_CTR_ID` imediatamente após `docker run` e validar ID + nome + labels `connexy.g4.27e=disposable-restore` e `connexy.g4.27e.source=$SRC_DB`.
- `cleanup()` só coleta logs ou remove se houver correspondência inequívoca de ID + ambas as labels. Se ID não capturado, não encontrado, labels divergentes ou ambíguo → **não remover** substituto, registrar em `$TMP_DIR/cleanup-status.txt` e marcar `CLEANUP_INSEGURA=1`.
- Remoção explícita da Fase I condicionada pelo mesmo critério (remover por ID, nunca apenas por nome).
- Não mascarar falha de limpeza com `|| true` indiscriminado; em caso inseguro, preserva evidências e não apaga `$TMP_DIR` por padrão.
- Mantém tratamento em interrupção/falha parcial via `trap`.

**Critérios objetivos para considerar aprovada (execução):** ID capturado e validado; remoção apenas por ID+labels; logs coletados apenas com ownership comprovado; em caso de ambiguidade não há remoção de substituto; logs de ambiguidade presentes se aplicável.

### R2 — Alta — inspeção de mounts não é uma allowlist

**Estado:** **CORRIGIDA DOCUMENTALMENTE** (somente documentos). Não comprovada em execução real.

A checagem original era denylist (padrões conhecidos) e não rejeitava binds arbitrários.

**Correção aplicada ao plano (7.3):**
- Substituída por verificação **fail-closed** baseada em `docker inspect` com dados estruturados (JSON de `.Mounts`), analisados com `python3`.
- Requisitos: exatamente **2** mounts; ambos `Type == "tmpfs"`; destinos exatamente `{/tmp/pgdata, /tmp/pgsock}` sem duplicados; sem `BindOptions`/`VolumeOptions`; sem mounts adicionais/bind/volume.
- Tratamento: JSON inválido/não-inspecionável → abortar; contagem diferente → abortar; tipo/destinos/divergentes/duplicados → abortar.
- Não usa apenas `grep` de padrões proibidos.

**Critérios objetivos para considerar aprovada (execução):** contagem==2, todos tmpfs, conjunto de destinos exato, sem bind/volume, sem duplicados, checagem falha em qualquer divergência antes da restauração.

### R3 — Média — storage é provado por conteúdo, não por metadados

A extração usa `--no-same-owner --no-same-permissions` e `umask 077`. Portanto:
- owner é o usuário do host, não `root`;
- permissões dos diretórios/arquivos não são as do tar;
- timestamps/modos não são comparados.

Isso não altera o storage original e é adequado para prova de conteúdo por
SHA-256, mas **não** prova restauração fiel de permissões/metadados. O relatório
da 3B deve declarar explicitamente esse limite. Se o critério exigir metadados,
acrescentar inventário de modos e comparar com `tar -tvzf`, sem `chown` no host.

### R4 — Média — arquivos extras no storage original não são detectados

`sha256sum -c` valida os dois arquivos listados, mas não detecta arquivos extras
no `/mnt` original. O tar extraído tem contagem fixa de 2 arquivos, porém o
volume original não tem checagem equivalente de cardinalidade/lista.

**Correção recomendada:** comparar a lista completa de arquivos regulares do
`/mnt` com `storage-live-files.sha256` e falhar se houver entrada extra ou
faltante, sem imprimir caminhos sensíveis.

### R5 — Média — prova de preservação do original é incompleta

A Fase I revalida IDs/volumes, hashes do backup, linhas-chave, rowcounts,
propriedades do banco, buckets, nomes de roles, memberships, rolconfig, git e
hashes dos 2 arquivos de storage. Não revalida no original, após o restore:
- atributos de roles (`rolsuper`, `rolcanlogin`, etc.);
- owners/ACLs de schemas, tabelas, funções e default ACLs;
- policies, triggers e event triggers;
- extensões/publicações;
- lista/cardinalidade completa do storage.

Não há escrita planejada no original, mas o critério “original intacto” fica
parcialmente provado. Recomenda-se reutilizar as consultas da Fase G sobre a
origem após o restore e comparar com os baselines.

### R6 — Média — cobertura de ownership não é exaustiva

São comparados owners de schemas, tabelas (`r`,`p`), funções, extensões,
publicações, event triggers e do banco. Não são comparados:
- owners de views e materialized views;
- owners de sequences;
- owners de tipos/domínios;
- owners de `pg_language` (incluindo a divergência bootstrap de `plpgsql`);
- outros objetos de catálogo (operators, casts, collations etc.).

Se o critério for “ownership comprovado”, ampliar as consultas ou declarar
formalmente o escopo limitado. A exceção de `plpgsql` está documentada, mas
`pg_language` não é comparado.

### R7 — Baixa/Média — event triggers durante o restore

`pg_restore` roda como `supabase_admin` e os 6 event triggers podem disparar
durante o restore. `--single-transaction --exit-on-error` evita estado parcial,
mas um trigger que dependa de `current_user`, de grants ou de `NOTIFY` pode
falhar ou produzir efeito lateral no alvo. O plano compara as definições e
aborta em erro; a 3B deve registrar explicitamente esse risco e inspecionar o
log antes de considerar o restore aprovado.

### R8 — Informativo — contagens e decisões

As contagens do TOC conferem com as contagens lógicas do plano. A decisão de
usar `supabase_admin` está correta para owners de extensões e do schema `net`.
A exceção `plpgsql` é conhecida e não deve ser tratada como divergência comum.

## 4. Revisão dos comandos

Os blocos abaixo reproduzem os comandos do plano. **B–I não foram executados.**
Comentários “NÃO EXECUTAR NA ETAPA 3A” foram preservados do plano; nesta
revisão, todos os blocos continuam não executados.

### 4.1 Fase A — Variáveis, guardas e cleanup (7.1)

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
  if docker inspect "$TMP_CTR" >/dev/null 2>&1; then
    docker logs "$TMP_CTR" >"$TMP_DIR/container.log" 2>&1 || true
  fi
  docker rm -f "$TMP_CTR" >/dev/null 2>&1 || true
  rm -rf -- "$TMP_DIR/storage" 2>/dev/null || true
  if [ "${G4_27E_KEEP_TMP:-0}" = "1" ] && [ "$rc" -eq 0 ]; then
    echo "RETENÇÃO: container removido; evidências em $TMP_DIR; remover após revisão"
    return "$rc"
  fi
  if [ "$rc" -ne 0 ]; then
    echo "FALHA: container removido; storage restaurado removido; logs em $TMP_DIR"
  else
    rm -rf -- "$TMP_DIR"
    echo "OK: recursos temporários removidos"
  fi
  return "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM
```

**Classificação A.1:** define variáveis e guardas; `install -d` cria apenas o
diretório temporário; `cleanup` remove recursos. **Risco:** `docker rm -f` sem
prova de labels/ID (R1). Não executar sem a correção.

### 4.2 Fase B — Preflight somente leitura (7.2)

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

**Classificação B.1:** apenas leitura, exceto `docker run --rm` da imagem para
testar ferramentas/locale/plugins. Esse `docker run` não publica portas, usa
`--network none`, `--pull=never`, não monta volumes e remove o container ao
final. Ainda assim, é uma criação temporária de container; deve ser autorizada
como parte da 3B.

**Pré-condições:** backup íntegro; imagem local; sem escritores; recursos
suficientes. **Abortos:** qualquer hash/tar/imagem/ferramenta/TOC/contagem/
storage/escritor divergente.

### 4.3 Fase C — Container isolado (7.3)

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
if docker inspect "$TMP_CTR" \
  --format '{{range .Mounts}}{{.Type}}:{{.Name}}:{{.Source}}:{{.Destination}} {{end}}' \
  | grep -Eq 'volume:|supabase_|/var/lib/postgresql/data|:/mnt'; then
  echo "ABORT: volume original ou bind de dados no alvo"
  exit 1
fi
```

**Classificação C.1:** cria container descartável, labels, dois tmpfs, sem rede,
sem portas, `--rm`. **Risco:** a checagem de mounts é denylist, não allowlist
(R2). **Abortos:** imagem/rede/porta/tmpfs/mount divergente.

### 4.4 Fase D — Inicialização do cluster (7.4)

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

**Classificação D.1:** escrita apenas no alvo (`/tmp/pgdata`, `/tmp/pgsock`);
cria cluster local. **Abortos:** `initdb`, `pg_ctl`, `pg_isready` ou preflight
falharem; alvo não isolado; `tmp_restore_admin` não superuser.

### 4.5 Fase E — Globals e banco de restore (7.5)

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

**Classificação E.1:** escreve roles/globals no alvo; cria banco de restore;
`ALTER DATABASE`; valida. **Abortos:** qualquer erro de `psql`, diff de roles/
memberships/rolconfig, contagem divergente, `supabase_admin` não superuser,
owner/propriedades divergentes.

**Observação:** `globals.sql` contém `ALTER ROLE ... PASSWORD`; os logs não
devem ser publicados e o arquivo não deve ser copiado para o repositório.

### 4.6 Fase F — Restore do dump (7.6)

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

**Classificação F.1:** restauração completa no alvo temporário; escrita apenas
em `$RESTORE_DB`. **Abortos:** qualquer erro de `pg_restore`; transação
revertida. **Risco:** event triggers (R7).

### 4.7 Fase G — Verificações do banco (7.7)

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

**Classificação G.1:** apenas leitura no alvo e no original; grava arquivos de
evidência. **Abortos:** qualquer `diff` divergente, alvo não isolado ou consulta
com erro. **Limitações:** owners de views, matviews, sequences, types/domains e
`pg_language` não são cobertos (R6).

### 4.8 Fase H — Storage (7.8)

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

**Classificação H.1:** escreve apenas em `$TMP_DIR/storage`; extrai, conta,
valida hashes e remove o conteúdo. **Limitações:** não preserva metadados/
permissões (R3). **Abortos:** entrada especial, contagem, symlink, hash ou
`FAILED`.

### 4.9 Fase I — Preservação do original e limpeza (7.9)

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

# Cleanup explícito (o trap também cobre falhas)
docker rm -f "$TMP_CTR" 2>/dev/null || true
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

**Classificação I.1:** verificação de original (leitura), hashes do backup
(leitura), `git` (leitura), cleanup (remoção). **Riscos:** `docker rm -f` sem
revalidação de labels/ID (R1); storage original só pelos 2 hashes (R4); original
sem revalidação de catálogo/ACL/role attrs (R5). **Abortos:** qualquer diff,
hash, storage ou limpeza divergente.

## 5. Critérios de sucesso

A 3B só pode ser considerada bem-sucedida se todos os itens abaixo forem
verdadeiros:

1. Hashes do dump, globals, tar, `MANIFEST` e listas de storage conferem.
2. Tar sem caminho absoluto, `..`, symlink, hardlink ou entrada especial.
3. Imagem exata; ferramentas, locale, ICU e plugins presentes.
4. TOC com 986 linhas, 971 entradas, 72 `TABLE DATA` e 6 event triggers.
5. Container com imagem exata, `NetworkMode=none`, sem portas, apenas dois
   tmpfs, sem bind/volume.
6. `initdb`/`pg_ctl`/`pg_isready`; alvo isolado e `tmp_restore_admin` superuser.
7. `globals.sql` aplicado; 16 roles, 25 memberships, 10 rolconfig;
   `supabase_admin` superuser.
8. Banco de restore com owner `postgres`, ICU `en-US`, locale
   `en_US.UTF-8`, encoding UTF8.
9. `pg_restore` completo sem erro; transação única.
10. Diffs de alvo, contagens-chave, propriedades, buckets, catálogo,
    storage, rowcounts, roles, extensões/schemas, ACLs de tabelas/funções,
    default ACLs, policies/triggers/event triggers sem diferença.
11. Storage extraído: 2 arquivos, 2 hashes OK, 0 symlinks, 0 `FAILED`.
12. Original: IDs/volumes inalterados; backup íntegro; linhas, rowcounts,
    propriedades, buckets, roles, memberships, rolconfig e git inalterados;
    storage original com 2 hashes OK.
13. Nenhum container/volume/rede temporário; `$TMP_DIR` removido ou retido
    apenas sob `G4_27E_KEEP_TMP=1`.
14. Nenhum recurso remoto, migration ou alteração de configuração.

## 6. Critérios de abortar

Abortar imediatamente, sem tentar “consertar” o banco, se ocorrer qualquer um
dos itens:

- hash, gzip, tar, imagem, ferramenta, locale, ICU, plugin ou TOC divergente;
- tar com caminho/tipo inseguro ou contagem diferente de 2 arquivos;
- container com imagem/rede/porta/mount divergente;
- `initdb`, `pg_ctl` ou `pg_isready` falhar;
- `globals.sql` falhar; contagem de roles/memberships/rolconfig divergir;
  `supabase_admin` não for superuser;
- owner/propriedades do banco de restore divergirem;
- `pg_restore` falhar ou emitir erro;
- qualquer `diff` de validação divergir;
- storage com hash divergente, arquivo extra/faltante, symlink ou `FAILED`;
- original mudar (ID, volume, linhas, rowcounts, propriedades, buckets, roles,
  memberships, rolconfig, git, storage);
- cleanup não conseguir provar ownership do recurso;
- qualquer ambiguidade sobre destino, ownership, credenciais ou alvo.

Em falha, não executar `db reset`, não fazer correção automática e não apagar
recursos cuja ownership não esteja comprovada. Preservar evidências para
auditoria.

## 7. Limites do parecer

- Não houve restore real; a compatibilidade de `pg_restore` com o dump não foi
  provada empiricamente.
- Não houve validação funcional de app, storage-api, edge functions ou E2E.
- A prova de storage é de conteúdo por SHA-256, não de permissões/metadados.
- A prova de ownership não é exaustiva (R6).
- A prova de preservação do original é parcial (R5).
- A execução de event triggers durante o restore é um risco residual (R7).
- A aprovação deste relatório não substitui autorização explícita da 3B.

## 8. Conclusão

**Veredito: correção documental concluída para R1–R2; APTO COM RESSALVAS; Etapa 3B bloqueada.**

O plano é tecnicamente coerente, o backup está íntegro e a arquitetura isolada
é adequada.

**Correções documentais aplicadas (somente documentos):**
1. **R1:** captura de `$TMP_CTR_ID` em 7.3; validação ID + nome + labels `connexy.g4.27e=disposable-restore` e `connexy.g4.27e.source=$SRC_DB`; `cleanup()` e remoção explícita da Fase I condicionados por ownership; ambiguidade → não remover substituto, registrar e marcar inseguro; sem remoção apenas por nome.
2. **R2:** checagem de mounts substituída por allowlist fail-closed com JSON estruturado: exatamente 2 tmpfs, destinos `/tmp/pgdata` e `/tmp/pgsock`, sem bind/volume/duplicados/opções proibidas.

**Limitações ainda não comprovadas em ambiente real:** ownership e isolamento não foram comprovados por execução; prova de storage apenas conteúdo (R3); detecção de arquivos extras (R4); escopo de prova de original/ownership (R5/R6).

**Bloqueio:** A Etapa 3B permanece **bloqueada** até nova autorização explícita e revisão das correções. Nenhum comando B–I foi executado nesta revisão.
