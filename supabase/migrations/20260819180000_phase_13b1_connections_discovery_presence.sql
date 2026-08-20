-- FASE 13B1: conexões, descoberta privada, afinidade dinâmica, conversas e Presence.

create type public.connection_request_status as enum ('pending', 'accepted', 'rejected', 'canceled');
create type public.conversation_kind as enum ('direct');
create type public.message_kind as enum ('text', 'share', 'audio', 'system');

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status public.connection_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connection_requests_not_self check (sender_id <> receiver_id)
);

create unique index connection_requests_one_pending_pair_idx
  on public.connection_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';
create index connection_requests_sender_status_idx on public.connection_requests (sender_id, status);
create index connection_requests_receiver_status_idx on public.connection_requests (receiver_id, status);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint connections_normalized_pair check (user_a_id < user_b_id),
  constraint connections_pair_unique unique (user_a_id, user_b_id)
);
create index connections_user_b_idx on public.connections (user_b_id);

create table public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);
create index blocked_users_blocked_idx on public.blocked_users (blocked_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind public.conversation_kind not null default 'direct',
  connection_id uuid not null unique references public.connections(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  kind public.message_kind not null default 'text',
  content text,
  shared_entity_type text,
  shared_entity_id uuid,
  media_bucket text,
  media_path text,
  media_mime text,
  media_duration_ms integer,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint messages_has_payload check (
    nullif(btrim(content), '') is not null
    or (shared_entity_type is not null and shared_entity_id is not null)
    or (media_bucket is not null and media_path is not null)
  ),
  constraint messages_media_duration_valid check (media_duration_ms is null or media_duration_ms >= 0)
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id);

create table public.user_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision check (accuracy_m is null or accuracy_m >= 0),
  discoverable boolean not null default true,
  updated_at timestamptz not null default now()
);
create index user_locations_discovery_idx on public.user_locations (discoverable, updated_at desc);

create table public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null check (status in ('online', 'available', 'dnd')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_presence_last_seen_idx on public.user_presence (last_seen_at desc);

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

create or replace function public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
) returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = p_user_id
  );
$$;

create or replace function public.are_connected(p_user_a uuid, p_user_b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_user_a is not null and p_user_b is not null and exists (
    select 1 from public.connections c
    where c.user_a_id = least(p_user_a, p_user_b)
      and c.user_b_id = greatest(p_user_a, p_user_b)
  );
$$;

create or replace function public.is_blocked_between(p_user_a uuid, p_user_b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

alter table public.connection_requests enable row level security;
alter table public.connections enable row level security;
alter table public.blocked_users enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.user_locations enable row level security;
alter table public.user_presence enable row level security;

create policy connection_requests_participants_select on public.connection_requests
  for select to authenticated using (auth.uid() in (sender_id, receiver_id));
create policy connections_participants_select on public.connections
  for select to authenticated using (auth.uid() in (user_a_id, user_b_id));
create policy blocked_users_owner_select on public.blocked_users
  for select to authenticated using (auth.uid() = blocker_id);
create policy blocked_users_owner_insert on public.blocked_users
  for insert to authenticated with check (auth.uid() = blocker_id);
create policy blocked_users_owner_delete on public.blocked_users
  for delete to authenticated using (auth.uid() = blocker_id);
create policy conversations_participants_select on public.conversations
  for select to authenticated using (public.is_conversation_participant(id));
create policy conversation_participants_members_select on public.conversation_participants
  for select to authenticated using (public.is_conversation_participant(conversation_id));
create policy conversation_participants_self_update on public.conversation_participants
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy messages_participants_select on public.messages
  for select to authenticated using (public.is_conversation_participant(conversation_id));
create policy messages_participants_insert on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and public.is_conversation_participant(conversation_id)
  );
create policy messages_sender_update on public.messages
  for update to authenticated using (
    sender_id = auth.uid() and public.is_conversation_participant(conversation_id)
  ) with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));
create policy user_locations_self_select on public.user_locations
  for select to authenticated using (auth.uid() = user_id);
create policy user_locations_self_insert on public.user_locations
  for insert to authenticated with check (auth.uid() = user_id);
create policy user_locations_self_update on public.user_locations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_locations_self_delete on public.user_locations
  for delete to authenticated using (auth.uid() = user_id);
create policy user_presence_self_insert on public.user_presence
  for insert to authenticated with check (auth.uid() = user_id);
create policy user_presence_self_update on public.user_presence
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_presence_self_delete on public.user_presence
  for delete to authenticated using (auth.uid() = user_id);
create policy user_presence_connected_select on public.user_presence
  for select to authenticated using (
    not public.is_blocked_between(auth.uid(), user_id)
    and (auth.uid() = user_id or public.are_connected(auth.uid(), user_id))
  );

revoke all on public.connection_requests, public.connections, public.blocked_users,
  public.conversations, public.conversation_participants, public.messages, public.user_locations,
  public.user_presence
  from anon, authenticated;
grant select on public.connection_requests, public.connections, public.conversations,
  public.conversation_participants, public.messages to authenticated;
grant select, insert, delete on public.blocked_users to authenticated;
grant select, insert, update, delete on public.user_locations to authenticated;
grant select, insert, update, delete on public.user_presence to authenticated;
grant insert, update on public.messages to authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;

create or replace function public.send_connection_request(receiver_id uuid)
returns public.connection_requests
language plpgsql security definer set search_path = ''
as $$
declare v_sender uuid := auth.uid(); v_result public.connection_requests;
begin
  if v_sender is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if receiver_id is null or receiver_id = v_sender then raise exception 'invalid receiver' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles p where p.id = receiver_id) then raise exception 'profile not found' using errcode = 'P0002'; end if;
  if public.is_blocked_between(v_sender, receiver_id) then raise exception 'request unavailable' using errcode = '42501'; end if;
  if public.are_connected(v_sender, receiver_id) then raise exception 'request unavailable' using errcode = '23505'; end if;
  insert into public.connection_requests(sender_id, receiver_id)
  values (v_sender, receiver_id) returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.respond_to_connection_request(request_id uuid, decision text)
returns public.connection_requests
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_request public.connection_requests;
  v_connection_id uuid;
  v_conversation_id uuid;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if decision not in ('accepted', 'rejected') then raise exception 'invalid decision' using errcode = '22023'; end if;
  select * into v_request from public.connection_requests r where r.id = request_id for update;
  if not found or v_request.receiver_id <> v_user or v_request.status <> 'pending' then
    raise exception 'request unavailable' using errcode = '42501';
  end if;
  if public.is_blocked_between(v_request.sender_id, v_request.receiver_id) then
    raise exception 'request unavailable' using errcode = '42501';
  end if;
  update public.connection_requests r
    set status = decision::public.connection_request_status, responded_at = now()
    where r.id = request_id returning * into v_request;
  if decision = 'accepted' then
    insert into public.connections(user_a_id, user_b_id)
    values (least(v_request.sender_id, v_request.receiver_id), greatest(v_request.sender_id, v_request.receiver_id))
    on conflict (user_a_id, user_b_id) do update set user_a_id = excluded.user_a_id
    returning id into v_connection_id;
    insert into public.conversations(connection_id)
    values (v_connection_id)
    on conflict (connection_id) do update set connection_id = excluded.connection_id
    returning id into v_conversation_id;
    insert into public.conversation_participants(conversation_id, user_id)
    values (v_conversation_id, v_request.sender_id), (v_conversation_id, v_request.receiver_id)
    on conflict do nothing;
  end if;
  return v_request;
end;
$$;

create or replace function public.cancel_connection_request(request_id uuid)
returns public.connection_requests
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_result public.connection_requests;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  update public.connection_requests r set status = 'canceled', responded_at = now()
  where r.id = request_id and r.sender_id = v_user and r.status = 'pending'
  returning * into v_result;
  if not found then raise exception 'request unavailable' using errcode = '42501'; end if;
  return v_result;
end;
$$;

create or replace function public.remove_connection(connection_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  delete from public.connections c where c.id = connection_id and auth.uid() in (c.user_a_id, c.user_b_id);
  if not found then raise exception 'connection unavailable' using errcode = '42501'; end if;
end;
$$;

create or replace function public.block_user(blocked_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if blocked_id is null or blocked_id = v_user then raise exception 'invalid blocked user' using errcode = '22023'; end if;
  insert into public.blocked_users(blocker_id, blocked_id) values (v_user, blocked_id) on conflict do nothing;
  delete from public.connection_requests r
    where (r.sender_id = v_user and r.receiver_id = blocked_id)
       or (r.sender_id = blocked_id and r.receiver_id = v_user);
  delete from public.connections c
    where c.user_a_id = least(v_user, blocked_id) and c.user_b_id = greatest(v_user, blocked_id);
end;
$$;

create or replace function public.unblock_user(blocked_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  delete from public.blocked_users b where b.blocker_id = auth.uid() and b.blocked_id = unblock_user.blocked_id;
end;
$$;

create or replace function public.get_direct_conversation(other_user_id uuid)
returns uuid language sql stable security definer set search_path = ''
as $$
  select cv.id from public.connections c
  join public.conversations cv on cv.connection_id = c.id
  where auth.uid() is not null
    and c.user_a_id = least(auth.uid(), other_user_id)
    and c.user_b_id = greatest(auth.uid(), other_user_id);
$$;

create or replace function public.get_nearby_profiles(
  p_radius_km double precision default 25,
  p_limit integer default 50
) returns table (
  id uuid, name text, handle text, photo_url text, headline text, age integer,
  common_interests text[], common_vibe_tags text[], common_looks_for text[],
  compatibility_score integer, proximity_tier text, distance_km numeric
)
language sql stable security definer set search_path = ''
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
          and least(r.sender_id, r.receiver_id) = least(auth.uid(), p.id)
          and greatest(r.sender_id, r.receiver_id) = greatest(auth.uid(), p.id)
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
  select s.id, s.name, s.handle, s.photo_url, s.headline, s.age,
    s.common_i, s.common_v, s.common_l,
    -- Weighted Jaccard (50/25/25), renormalized across comparable categories.
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

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_presence'
  ) then
    alter publication supabase_realtime add table public.user_presence;
  end if;
end;
$$;

revoke execute on function public.is_conversation_participant(uuid, uuid),
  public.are_connected(uuid, uuid), public.is_blocked_between(uuid, uuid),
  public.send_connection_request(uuid), public.respond_to_connection_request(uuid, text),
  public.cancel_connection_request(uuid), public.remove_connection(uuid), public.block_user(uuid),
  public.unblock_user(uuid), public.get_direct_conversation(uuid),
  public.get_nearby_profiles(double precision, integer)
  from public, anon;
grant execute on function public.is_conversation_participant(uuid, uuid),
  public.are_connected(uuid, uuid), public.is_blocked_between(uuid, uuid),
  public.send_connection_request(uuid), public.respond_to_connection_request(uuid, text),
  public.cancel_connection_request(uuid), public.remove_connection(uuid), public.block_user(uuid),
  public.unblock_user(uuid), public.get_direct_conversation(uuid),
  public.get_nearby_profiles(double precision, integer)
  to authenticated;
