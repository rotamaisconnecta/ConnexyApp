# G4.27E — Etapa 2: Backup local protegido

> **Etapa de backup autorizada.** Foram criados exclusivamente: dump lógico do
> PostgreSQL local, cópia do storage local, manifesto e validações de leitura.
> **Não** foram executados migration, E2E, restore, escrita no banco/storage
> original, alteração de configuração, operação remota, commit ou push.
>
> Relatórios-base: `connexy-database-g4-27e-private-avatar-e2e.md` e
> `connexy-database-g4-27e-snapshot-restore-readiness.md`.

Regra de evidência: **[F]** = verificado nesta execução; **[I]** = inferência;
**[H]** = hipótese não comprovada.

---

## 1. Autorização e escopo executado

| Autorizado | Executado |
| --- | --- |
| Backup local do PostgreSQL | sim — `pg_dump` custom + `pg_dumpall --globals-only` **[F]** |
| Cópia do storage local | sim — `tar` do backend `file` **[F]** |
| Diretório protegido fora do repositório | sim — `/home/ricardo/Documentos/Connexy/connexy-backups/...` `0700` **[F]** |
| Manifesto com inventário/tamanhos/hashes/data | sim — `MANIFEST.txt` **[F]** |
| Validação por leitura | sim — `pg_restore --list`, `gzip -t`, `tar -tzf`, hashes **[F]** |

| Não autorizado / não executado | Confirmação |
| --- | --- |
| Migration (inclusive G4.27B) | não **[F]** |
| E2E | não **[F]** |
| Restore (mesmo em scratch) | não **[F]** |
| Escrita no banco/storage original | não **[F]** |
| `supabase start/stop/db reset` | não **[F]** |
| Alteração de config/bucket/policy/RLS/grant | não **[F]** |
| Operação remota / commit / push | não **[F]** |
| C-06 / C-08 | não alterados **[F]** |

---

## 2. Pré-verificação

**Data/hora da execução:** `2026-10-22T22:17:07 -03:00`
(`2026-10-23T01:17:07 UTC`). **[F]**

| Item | Valor |
| --- | --- |
| Repositório (absoluto) | `/home/ricardo/Documentos/Connexy/ConnexyApp` **[F]** |
| Branch | `backup/connexy-snapshot-2026-10-02` **[F]** |
| HEAD | `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944` **[F]** |
| Container PostgreSQL | `supabase_db_lzejdgfvtybarpbgwsyp` **[F]** |
| Label `com.supabase.cli.project` | `lzejdgfvtybarpbgwsyp` **[F]** |
| Database alvo | `postgres` **[F]** |
| Conexão | socket Unix dentro do container (`inet_server_addr = unix_socket`) **[F]** |
| `data_directory` | `/var/lib/postgresql/data` **[F]** |
| Versão do servidor | PostgreSQL `17.6` **[F]** |
| Volume do DB | `supabase_db_lzejdgfvtybarpbgwsyp` → `/var/lib/postgresql/data` **[F]** |
| Container de storage | `supabase_storage_lzejdgfvtybarpbgwsyp` **[F]** |
| Volume de storage | `supabase_storage_lzejdgfvtybarpbgwsyp` → `/mnt` **[F]** |
| Backend de storage | `file`; `FILE_STORAGE_BACKEND_PATH=/mnt`; `TENANT_ID=stub` **[F]** |
| Caminho dos objetos | `/mnt/stub/stub` (2 arquivos) **[F]** |
| Listeners de app em `3000/5173/4173` | nenhum **[F]** |
| Espaço livre | `30 GB` em `/` **[F]** |
| Ferramentas | `pg_dump`/`pg_restore`/`pg_dumpall` `17.6`; BusyBox `tar 1.37.0`; GNU `tar 1.35`; `gzip 1.12`; `sha256sum 9.4` **[F]** |

**Conclusão da pré-verificação:** alvo inequivocamente local, sem uso do
Supabase CLI para resolver `project_id`, sem reinício de serviços e sem SQL de
escrita. **[F]**

### 2.1 Destino escolhido

```
/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z
```

- Fora do repositório: verificado por `realpath` (prefixo do repo **não** casa). **[F]**
- Permissão do diretório: `0700`; arquivos: `0600`. **[F]**
- Diretório pai: `/home/ricardo/Documentos/Connexy/connexy-backups` (`0700`). **[F]**

---

## 3. Backups criados

| Artefato | Caminho absoluto | Tamanho | SHA-256 | Modo |
| --- | --- | ---: | --- | --- |
| Dump PostgreSQL | `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/db-postgres.dump` | `1.033.956` B | `200fe72642b865955b230f0a6608d1e982b52c6e31015b67b906ab9783028361` | `600` |
| Globals/roles | `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/globals.sql` | `7.436` B | `93579a052a8967d92b71c1742932d5782134d649b6563f20cdf953e0488e5be8` | `600` |
| Storage (tar.gz) | `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/storage-mnt-stub.tar.gz` | `207.995` B | `c2ab0c450095d00a4a41d30de6adab4f66577eaec37c5b6f33927f1c37caf00d` | `600` |
| Manifesto | `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/MANIFEST.txt` | `2.842` B | `adfc312ec79b9ca3e7586c0bfbdb0958a100b7695a12394cfa032e8b87d9ff07` | `600` |
| Hash do manifesto | `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/MANIFEST.sha256` | `152` B | contém o hash acima | `600` |
| Lista de hashes | `/home/ricardo/Documentos/Connexy/connexy-backups/g4-27e-20261023T011705Z/SHA256SUMS` | `470` B | — | `600` |

- Tamanho total do diretório: `1,4 MB`. **[F]**
- O dump foi gerado por `pg_dump -Fc` (formato customizado), compatível com o
  servidor `17.6`. **[F]**
- `globals.sql` foi gerado por `pg_dumpall --globals-only` (16 `CREATE ROLE`). **[F]**
- O storage foi copiado por `tar -C /mnt -cf - stub | gzip -9 -n`, preservando
  estrutura, modos, owner/gid e mtime que o BusyBox tar registra. **[F]**

### 3.1 Cobertura do dump

| Evidência | Valor |
| --- | --- |
| Linhas no TOC | `986` |
| Entradas de dados (`TABLE DATA`) | `72` |
| Objetos por schema no TOC | `auth=23`, `public=26`, `storage=10`, `supabase_migrations=1`, `private=0` |
| Formato | `CUSTOM` |
| Versão do dump | `1.16-0` |
| Database | `postgres` |
| Versão de origem/destino | `17.6` |

O dump cobre as schemas relevantes (`auth`, `public`, `storage`,
`supabase_migrations`) e os dados do banco `postgres`. **[F]**

Bancos internos do stack não incluídos e sem dados de projeto: `_supabase`
(sem tabelas de usuário), `storage_vectors` (apenas a tabela interna
`migrations`) e `template1` (template padrão). **[F]**

Buckets no momento do backup: `avatars` (1 objeto), `bio-media` (1 objeto) e
`reels-media` (0 objetos, bucket legado vazio). Total: 2 objetos, consistente
com o dump e com o hash agregado do storage. **[F]**

---

## 4. Validações de leitura

| Validação | Resultado |
| --- | --- |
| `pg_restore --list` no `db-postgres.dump` | exit `0`; TOC com `986` linhas; stderr vazio **[F]** |
| `gzip -t` no `storage-mnt-stub.tar.gz` | OK **[F]** |
| `tar -tzf` no storage | sem erros; `8` diretórios + `2` arquivos **[F]** |
| Estrutura do tar | `8 drwxr-xr-x`, `2 -rw-r--r--` **[F]** |
| Inventário live × tar (por arquivo) | `match` (`2/2`) **[F]** |
| Hash agregado do storage antes × depois | `match` — `44b7380695f78367fa10da3954775d121e78856cb794bee29bf6b12650b9591c` **[F]** |
| `sha256sum -c SHA256SUMS` | `SUCESSO` para os 3 artefatos **[F]** |
| `MANIFEST.txt` × `MANIFEST.sha256` | `match` (`adfc312e…d9ff07`) **[F]** |
| Estado do DB antes × depois | `match` (`state-diff.txt` vazio) **[F]** |
| Varredura de padrões secretos no manifesto | `0` ocorrências para JWT, tokens de chave secreta/publishable, chave privada ou URL com credenciais **[F]** |

**O manifesto não contém segredos.** O dump, o `globals.sql` e os manifestos de
paths de storage são sensíveis e permanecem no diretório `0700` com arquivos
`0600`; nenhum conteúdo sensível foi impresso neste relatório. **[F]**

> **Restauração não comprovada.** Esta etapa validou apenas a integridade e a
> listagem dos artefatos. Nenhum restore (nem em scratch) foi executado. **[F]**

---

## 5. Verificação de não interferência

| Item | Antes | Depois |
| --- | --- | --- |
| Containers | 5 `Up 11h` (healthies) | inalterados **[F]** |
| Migrations | `13`, última `20260925030806` | `13`, última `20260925030806` **[F]** |
| `avatars.public` | `true` | `true` **[F]** |
| Policy `Avatars public read` | `1` | `1` **[F]** |
| Guard `g4_26b_is_canonical_avatar_path` | `0` | `0` **[F]** |
| `auth.users` | `840` | `840` **[F]** |
| `public.profiles` | `840` | `840` **[F]** |
| `public.profile_private` | `840` | `840` **[F]** |
| `public.connections` | `228` | `228` **[F]** |
| `storage.objects` | `2` (`avatars=1`, `bio-media=1`) | `2` (`avatars=1`, `bio-media=1`) **[F]** |
| Hash agregado do storage | `44b738…b9591c` | `44b738…b9591c` **[F]** |
| Git HEAD | `16f8c6b…` | inalterado **[F]** |
| `git status --porcelain` | `312` | `312` antes deste relatório **[F]** |
| Arquivos de backup no repositório | nenhum | nenhum (destino fora do repo) **[F]** |
| Operação remota / commit / push | — | nenhuma **[F]** |

- A atividade observada no PostgreSQL era `PostgREST` idle, `pg_net` idle e um
  backend cliente idle; **nenhuma escrita ativa** foi observada. **[F]**
- O estado do banco e o hash do storage coincidem antes/depois. Não há evidência
  de alteração concorrente; permanece a incerteza teórica de escrita no intervalo
  entre as leituras, não observada. **[F]/[I]**

---

## 6. Limitações e riscos

1. **Restore não comprovado** — deve ser validado em etapa futura, com
   autorização independente (preferencialmente em database descartável). **[F]**
2. **Dump lógico** — não inclui WAL/PITR; escritas concorrentes após o snapshot
   do dump não seriam capturadas. **[F]**
3. **Tar de storage não atômico** — a consistência foi inferida pelo hash
   agregado antes/depois e pela comparação live × tar; não há snapshot atômico
   do volume. **[F]/[I]**
4. **Metadados do tar** — BusyBox tar preserva estrutura, modo, uid/gid e mtime
   básicos; não há garantia de xattrs/ACL estendidas. **[F]/[I]**
5. **Sensibilidade** — `db-postgres.dump`, `globals.sql` e os manifestos de paths
   contêm dados/hashes/metadados sensíveis; o diretório é `0700` e os arquivos
   `0600`, mas o backup está no mesmo host/filesystem (sem offsite/criptografia
   adicional). **[F]**
6. **Divergência de `project_id`** — confirmada e contornada usando somente
   Docker; o Supabase CLI não foi usado para determinar alvo. **[F]**
7. **Backup não substitui o E2E nem a restauração** — esta etapa apenas preserva
   o estado anterior para uma futura execução autorizada. **[F]**

---

## 7. Veredito da etapa

**Backups criados e validados; estado original preservado.** **[F]**

- Dump do PostgreSQL (`postgres`, `17.6`) criado em formato customizado e
  listável por `pg_restore --list`.
- Storage local (`file`, `/mnt/stub/stub`) copiado e validado por `gzip -t`,
  `tar -tzf`, inventário e hashes.
- Manifesto com data/hora, containers/volumes, tamanhos, hashes, versões,
  validações e limitações criado sem segredos.
- Nenhuma migration, E2E, restore, escrita no original, operação remota, commit
  ou push.

**Restauração continua NÃO comprovada.** A próxima etapa (teste de restore em
scratch e/ou E2E) depende de nova autorização explícita do usuário.
