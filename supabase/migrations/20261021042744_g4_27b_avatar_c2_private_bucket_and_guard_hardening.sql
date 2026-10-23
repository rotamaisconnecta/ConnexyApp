-- G4.27B — Bucket `avatars` privado e endurecimento do guard de path canônico.
--
-- Registra localmente o endurecimento aplicado no remoto em 2026-10-21
-- (versão `20261021042744`). Esta migration:
--   1. substitui SOMENTE a função `private.g4_26b_is_canonical_avatar_path`,
--      trocando as verificações de barra invertida e de caracteres de controle
--      por formas explícitas e equivalentes:
--        - barra invertida: `position(chr(92) in v_value) > 0`
--        - controles:       `v_value ~ E'[\x01-\x1F\x7F]'`
--   2. remove SOMENTE a policy pública de leitura do bucket `avatars`
--      (`Avatars public read`), se existir;
--   3. define `storage.buckets.public = false` no bucket `avatars`.
--
-- NÃO altera a assinatura, a lógica de descoberta nem as demais permissões da
-- RPC `get_nearby_profiles`. NÃO modifica outras policies nem outros buckets
-- (`bio-media`, `reels-media`). NÃO faz backfill, rotação de URL ou conexão.
-- A aplicação remota é decisão de etapa futura; esta migration é a
-- representação local do estado confirmado no remoto.

-- 1. Guard endurecido (mesma assinatura, mesmas regras, formas explícitas).
create or replace function private.g4_26b_is_canonical_avatar_path(p_path text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_value text;
  v_segments text[];
  v_last text;
  v_dot integer;
  v_ext text;
begin
  if p_path is null then
    return false;
  end if;
  v_value := btrim(p_path);
  if v_value = '' then
    return false;
  end if;
  if v_value ~ '^[a-zA-Z][a-zA-Z0-9+.\-]*:' then
    return false;
  end if;
  if left(v_value, 1) = '/' then
    return false;
  end if;
  if position('..' in v_value) > 0 then
    return false;
  end if;
  if position(chr(92) in v_value) > 0 then
    return false;
  end if;
  if v_value ~ '%[0-9a-fA-F]{2}' then
    return false;
  end if;
  if v_value ~ E'[\x01-\x1F\x7F]' then
    return false;
  end if;

  v_segments := string_to_array(v_value, '/');
  if array_position(v_segments, '') is not null then
    return false;
  end if;

  if v_segments[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  v_last := v_segments[array_length(v_segments, 1)];
  v_dot := length(v_last) - length(replace(v_last, '.', ''));
  if v_dot <> 1 then
    return false;
  end if;
  v_ext := lower(split_part(v_last, '.', 2));
  if v_ext !~ '^[a-z0-9]{1,8}$' then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function private.g4_26b_is_canonical_avatar_path(text)
  from public, anon, authenticated;

-- 2. Remove a leitura pública do bucket `avatars`, se existir.
drop policy if exists "Avatars public read" on storage.objects;

-- 3. Torna o bucket `avatars` privado (somente o bucket de avatar).
update storage.buckets
  set public = false
  where id = 'avatars';
