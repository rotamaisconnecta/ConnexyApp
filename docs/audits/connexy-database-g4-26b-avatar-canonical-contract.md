# G4.26B — Contrato canônico de avatar (escritores + descoberta)

> Fase: G4.26B (preparação local). Nenhuma operação remota foi executada.
> Branch: `backup/connexy-snapshot-2026-10-02` — HEAD `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`.
> Escopo: tornar escritores ativos gravadores de **caminho canônico** validado,
> remover a **URL pública bruta** como contrato obrigatório da RPC de descoberta,
> preservar leitura legada e cobrir tudo com testes. Sem privatizar bucket, sem
> backfill, sem remoto.

## A. Objetivo e restrições

Fechar, em código local, a dependência de URL pública no caminho de escrita e no
contrato de descoberta de avatar, **sem** alterar bucket, políticas/RLS, grants,
TTL de assinatura, `.env`, dependências ou o flag `VITE_APP_SCHEMA_A_MEDIA_URL`
(que permanece OFF). Leitura permanece no Modelo 2 (qualquer autenticado vê o
avatar do outro, sujeito às validações existentes).

## B. Inventário de escritores de `profiles.photo_url`

| Escritor | Situação | Ação nesta fase |
| --- | --- | --- |
| `src/components/bio/bio-avatar.tsx` | Persistia `getPublicUrl(path)` (URL pública) | **Alterado** → persiste `path` canônico validado |
| `src/routes/completar-perfil.tsx` (ramo legado `configured && user`) | Persistia `getPublicUrl(path)` | **Alterado** → persiste `path` canônico validado |
| `src/routes/completar-perfil.tsx` (ramo Schema A) | Já persiste `photo = path`; gated por `isRemoteProfileEnabled()` (OFF) | Sem mudança |
| `src/hooks/api/use-upload.ts` (`uploadAvatar`) | Hook **não consumido** (nenhum `useUpload(` no projeto) | Fora de escopo (código morto) |

Formato canônico implementado: `{auth.uid()}/{uuid}.jpg`, bucket `avatars`,
validado por `validateMediaPath` (1º segmento UUID, extensão obrigatória).

## C. Mudanças de escrita

### C.1 `bio-avatar.tsx`
- Remove `supabase.storage.from(BUCKETS.avatars).getPublicUrl(path)` e a escrita
  de `urlData.publicUrl`.
- Persiste `photo_url: path` (retorno de `UploadService.uploadAvatar`).
- Valida com `validateMediaPath(path)` e confere `validation.ownerId === userId`;
  se inválida/estrangeira, apaga o upload recém-enviado e aborta (`fail-closed`).
- Remoção de arquivo antigo continua via `UploadService.extractStoragePathFromUrl`
  (agora também entende caminho canônico — ver E).
- Import de `@/lib/supabase/client` removido (não mais necessário).

### C.2 `completar-perfil.tsx` (ramo legado)
- Remove `getPublicUrl` e `urlData.publicUrl`; persiste `photoUrl = path`.
- Valida `validateMediaPath(path)` + `validation.ownerId !== user.id`; caso
  falhe, remove o objeto do bucket e lança erro antes do `updateProfile`.

## D. Contrato da RPC `get_nearby_profiles`

Nova migration versionada:
`supabase/migrations/20261020120000_g4_26b_avatar_canonical_discovery_contract.sql`.

- **Assinatura preservada** (`p_radius_km`, `p_limit`; colunas `id, name, handle,
  photo_url, headline, ...`) → consumidores legados não quebram.
- `photo_url` passa a ser projetada como `btrim(photo_url)` **apenas** quando é
  caminho canônico; caso contrário `NULL`. Ou seja, a RPC deixa de entregar URL
  pública/assinada/externa bruta.
- Guard `private.g4_26b_is_canonical_avatar_path(text)` (immutable): rejeita
  scheme, barra inicial, `..`, `\`, octeto codificado, segmento vazio; exige 1º
  segmento UUID e extensão válida. `revoke all` de `public, anon, authenticated`.
- Grants mantidos: `revoke execute ... from public, anon`; `grant ... to authenticated`.
- **Não** cria bucket, **não** altera RLS/políticas, **não** faz backfill, **não**
  altera `update public.profiles`.

Verificação estática dedicada confirma assinatura, projeção condicional e ausência
de efeitos colaterais proibidos.

## E. Compatibilidade de leitura

- `AuthenticatedAvatarImage` resolve por `profileId` (UUID) via endpoint
  server-side; para qualquer valor persistido (público legado, assinado legado,
  canônico, externo, local) o comportamento de exibição é preservado. Passar o
  valor canônico como `legacyUrl` é seguro: `shouldResolve=true` ignora
  `legacyUrl` e usa a resolução server-side (fail-closed → fallback local).
- `UploadService.extractStoragePathFromUrl` agora aceita **caminho canônico**
  (além da URL pública `/public/`). Isso corrige a remoção do objeto antigo,
  que antes falhava quando `photo_url` guardava caminho canônico.
- `resolveAvatarDisplayUrl` continua devolvendo `null` para canônico (por design);
  a exibição depende do componente autenticado, não deste resolvedor offline.

## F. Consumidores de descoberta

`ConnectionsRepository.listNearby` → `ConnectionsService` → `DiscoveryService` →
`useDiscovery` (`_app.pessoas.tsx`, `_app.connecta.tsx`, `_app/discover.tsx`) e
`UserRepository.getNearby` → `UserService.getNearbyUsers` (`getNearbyUsers` sem
consumidor ativo). Todos passam `profileId={p.id}` + `legacyUrl={p.photo_url}`.
Como `p.id` é UUID, a resolução server-side é usada independentemente de
`photo_url`; entregar `NULL` na RPC cai no fallback local — sem regressão de
imagem.

## G. Testes

- Novo: `tests/avatar-canonical-contract-g4-26b.test.ts` (13 testes):
  escritores bio/cadastro sem URL pública, validação de dono, rollback de upload,
  extração canônica/URL pública/inválida, classificação canônica do próprio dono,
  resolver offline `null`, e verificação estática da migration.
- Ajustado: `tests/completar-perfil-avatar-g4-20.test.ts` — a asserção de
  `getPublicUrl` (comportamento anterior) foi substituída por asserções de
  persistência canônica validada; adicionados casos de extração canônica e
  `fail-closed`.

Resultados (reproduzíveis):
- 5 arquivos de avatar (`g4-20`, `g4-21`, `g4-23`, `g4-24`, `g4-26b`): **49 pass / 0 fail** (161 asserts).
- 8 arquivos media/profile/conexões relacionados: **116 pass / 0 fail** (441 asserts).
- `tsc --noEmit`: exit 0.
- `eslint` (escopo): exit 0. `prettier --check` (escopo): conformante.
- `git diff --check`: exit 0.

## H. Git — antes/depois

- Antes: `??` 150, `AM` 4, `D` 1, `M` 137, `MM` 1 → 293 entradas.
- Depois: `??` 152, `AM` 4, `D` 1, `M` 138, `MM` 1 → 296 entradas.
- Delta = **+3**: `supabase/migrations/20261020120000_...sql` (novo),
  `tests/avatar-canonical-contract-g4-26b.test.ts` (novo) e o arquivo de teste
  `completar-perfil-avatar-g4-20.test.ts` recoberto. Nenhum trabalho
  staged/unstaged/untracked pré-existente foi removido. Sem `reset`, `clean`,
  `checkout`, `restore`, `stash`, rebase, commit ou push.

## I. Confirmação de não-remoto e decisões pendentes

- Nenhuma conexão ao Supabase, login, link, pull, push, SQL remoto, migration
  aplicada, alteração de bucket/política/RLS/grant, backfill ou signed URL de
  TTL longo foram executados nesta fase.
- A migration **não foi aplicada** — apenas criada localmente.
- Pendente de autorização explícita (etapas futuras, fora do escopo G4.26B):
  aplicação da migration, backfill de valores legados, privacidade do bucket e
  fechamento do C2. Estado remoto real (buckets/políticas/grants/CDN) permanece
  desconhecido localmente.
