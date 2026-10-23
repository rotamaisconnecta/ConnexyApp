-- G4.26B — Contrato canônico de avatar na descoberta.
--
-- Objetivo: `get_nearby_profiles` deixa de expor uma URL pública bruta como
-- valor obrigatório de `photo_url`. A coluna permanece na MESMA assinatura
-- (compatível com consumidores legados) mas só devolve a referência persistida
-- quando ela é um CAMINHO CANÔNICO de Storage (`{ownerId}/{objectId}.{ext}`,
-- primeiro segmento UUID). Qualquer outro formato (URL pública, URL assinada,
-- URL externa, lixo) é normalizado para `NULL`.
--
-- Consequências:
--  - Não altera `returns table` (mesmos nomes/tipos), então não quebra
--    consumidores que leem a coluna.
--  - Não cria bucket, não altera RLS/políticas, não altera grants, não faz
--    backfill, não conecta ao remoto. Aplicação é decisão de etapa futura.
--  - Leitura de avatar não depende do valor entregue aqui: o componente
--    `AuthenticatedAvatarImage` resolve via função server-side por `profileId`.
--    Logo, entregar `NULL` aqui é seguro (o consumidor usa o fallback local).
--
-- Não substitui a validação de autorização: a referência devolvida NÃO é fonte
-- de autorização de leitura. Ela é apenas um identificador classificável.

-- Guard de path canônico (inline, sem criar objetos novos no schema).
-- Regras: sem scheme, sem barra inicial, sem `..`/`\`, sem octeto codificado,
-- sem caractere de controle, sem segmento vazio, primeiro segmento UUID,
-- último segmento com extensão.
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
  if position('\' in v_value) > 0 then
    return false;
  end if;
  if v_value ~ '%[0-9a-fA-F]{2}' then
    return false;
  end if;
  if v_value ~ '[\x00-\x1f\x7f]' then
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

-- Reescreve a RPC preservando integralmente a lógica, mudando apenas a
-- projeção de `photo_url` para o valor canônico-ou-nulo.
create or replace function public.get_nearby_profiles(
  p_radius_km double precision default 25,
  p_limit integer default 50
) returns table (
  id uuid, name text, handle text, photo_url text, headline text, age integer,
  common_interests text[], common_vibe_tags text[], common_looks_for text[],
  compatibility_score integer, proximity_tier text, distance_km numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select l.latitude, l.longitude, p.interests, p.vibe_tags, p.looks_for
    from public.user_locations l join public.profiles p on p.id = l.user_id
    where l.user_id = auth.uid() and l.discoverable
      and l.updated_at >= now() - interval '15 minutes'
  ), candidates as (
    select p.*, l.latitude, l.longitude,
      6371 * 2 * asin(sqrt(
        power(sin(radians(l.latitude - me.latitude) / 2), 2) +
        cos(radians(me.latitude)) * cos(radians(l.latitude)) *
        power(sin(radians(l.longitude - me.longitude) / 2), 2)
      )) as km, me.interests as my_interests, me.vibe_tags as my_vibes, me.looks_for as my_looks
    from me join public.user_locations l on l.user_id <> auth.uid()
    join public.profiles p on p.id = l.user_id
    where auth.uid() is not null and l.discoverable
      and l.updated_at >= now() - interval '15 minutes'
      and p.name is not null and nullif(btrim(p.name), '') is not null
      and p.handle is not null and nullif(btrim(p.handle), '') is not null
      and not public.is_blocked_between(auth.uid(), p.id)
      and not public.are_connected(auth.uid(), p.id)
      and not exists (
        select 1 from public.connection_requests r where r.status = 'pending'
          and least(r.from_user_id, r.to_user_id) = least(auth.uid(), p.id)
          and greatest(r.from_user_id, r.to_user_id) = greatest(auth.uid(), p.id)
      )
  ), normalized as (
    select c.*,
      array(select distinct lower(btrim(x)) from unnest(c.my_interests) x where btrim(x) <> '') mi,
      array(select distinct lower(btrim(x)) from unnest(c.interests) x where btrim(x) <> '') ci,
      array(select distinct lower(btrim(x)) from unnest(c.my_vibes) x where btrim(x) <> '') mv,
      array(select distinct lower(btrim(x)) from unnest(c.vibe_tags) x where btrim(x) <> '') cv,
      array(select distinct lower(btrim(x)) from unnest(c.my_looks) x where btrim(x) <> '') ml,
      array(select distinct lower(btrim(x)) from unnest(c.looks_for) x where btrim(x) <> '') cl
    from candidates c
  ), scored as (
    select n.*,
      array(select x from unnest(n.mi) x where x = any(n.ci) order by x) common_i,
      array(select x from unnest(n.mv) x where x = any(n.cv) order by x) common_v,
      array(select x from unnest(n.ml) x where x = any(n.cl) order by x) common_l,
      case when cardinality(n.mi) > 0 and cardinality(n.ci) > 0 then 50 else 0 end wi,
      case when cardinality(n.mv) > 0 and cardinality(n.cv) > 0 then 25 else 0 end wv,
      case when cardinality(n.ml) > 0 and cardinality(n.cl) > 0 then 25 else 0 end wl
    from normalized n
  )
  select s.id, s.name, s.handle,
    case when private.g4_26b_is_canonical_avatar_path(s.photo_url)
      then btrim(s.photo_url) else null end,
    s.headline, s.age,
    s.common_i, s.common_v, s.common_l,
    case when s.wi + s.wv + s.wl = 0 then null else round(100 * (
      coalesce(s.wi * cardinality(s.common_i)::numeric / nullif(cardinality(array(select distinct x from unnest(s.mi || s.ci) x)), 0), 0) +
      coalesce(s.wv * cardinality(s.common_v)::numeric / nullif(cardinality(array(select distinct x from unnest(s.mv || s.cv) x)), 0), 0) +
      coalesce(s.wl * cardinality(s.common_l)::numeric / nullif(cardinality(array(select distinct x from unnest(s.ml || s.cl) x)), 0), 0)
    ) / (s.wi + s.wv + s.wl))::integer end,
    case when s.km <= 0.3 then 'very_close' when s.km <= 0.8 then 'around_here'
      when s.km < 2 then 'nearby' else 'distance' end,
    case when s.km >= 2 then round(s.km::numeric, 1) else null end
  from scored s
  where s.km <= least(greatest(coalesce(p_radius_km, 25), 0.1), 100)
  order by s.km, s.id
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke execute on function public.get_nearby_profiles(double precision, integer)
  from public, anon;
grant execute on function public.get_nearby_profiles(double precision, integer)
  to authenticated;
