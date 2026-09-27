-- 1H-9 — Schema A Core (contrato docs/audits/remote-schema-contract-1h-8.md)
-- Evolui o schema legado local sem DROP de migrations anteriores e sem db reset.
-- Não cria Schema B, Storage buckets novos, nem Realtime novo.
-- Tabelas legado fora do A (bio_posts, blocked_users, user_locations, user_presence)
-- permanecem; não são o contrato.

-- =============================================================================
-- 0. Helpers
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 1. profiles + profile_private + auth mapping
-- =============================================================================

alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists city text,
  add column if not exists locale text,
  add column if not exists visibility jsonb not null default jsonb_build_object(
    'confirmed_activity', 'connections',
    'liked_places', 'connections',
    'mutual_connections', 'everyone'
  );

update public.profiles
set
  name = coalesce(nullif(btrim(name), ''), 'Connexy'),
  handle = coalesce(nullif(btrim(handle), ''), 'u' || substr(replace(id::text, '-', ''), 1, 16));

alter table public.profiles
  alter column name set not null,
  alter column handle set not null;

alter table public.profiles drop constraint if exists profiles_handle_key;
create unique index if not exists profiles_handle_lower_key on public.profiles (lower(handle));

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete restrict;

drop policy if exists "Profiles are public" on public.profiles;
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy profiles_select_authenticated
  on public.profiles for select to authenticated
  using (true);
create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_own
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon, public;
grant select, insert, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  birth_date date,
  home_address text,
  work_address text,
  updated_at timestamptz not null default now()
);

drop trigger if exists profile_private_updated_at on public.profile_private;
create trigger profile_private_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();

alter table public.profile_private enable row level security;

create policy profile_private_owner_select
  on public.profile_private for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profile_private_owner_insert
  on public.profile_private for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy profile_private_owner_update
  on public.profile_private for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy profile_private_owner_delete
  on public.profile_private for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.profile_private from anon, public;
grant select, insert, update, delete on table public.profile_private to authenticated;
grant all on table public.profile_private to service_role;

insert into public.profile_private (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handle text;
  v_name text;
begin
  v_handle := 'u' || substr(replace(new.id::text, '-', ''), 1, 16);
  v_name := coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), v_handle);
  insert into public.profiles (id, name, handle, photo_url)
  values (
    new.id,
    v_name,
    v_handle,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  insert into public.profile_private (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- =============================================================================
-- 2. follows
-- =============================================================================

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete restrict,
  followee_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint follows_not_self check (follower_id <> followee_id),
  constraint follows_pair_unique unique (follower_id, followee_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy follows_select_authenticated
  on public.follows for select to authenticated
  using (true);
create policy follows_insert_own
  on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);
create policy follows_delete_own
  on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

revoke all on table public.follows from anon, public;
grant select, insert, delete on table public.follows to authenticated;
grant all on table public.follows to service_role;

-- =============================================================================
-- 3. connection_requests (legado → contrato 1H-8)
-- =============================================================================

drop policy if exists connection_requests_participants_select on public.connection_requests;

drop index if exists connection_requests_one_pending_pair_idx;
drop index if exists connection_requests_sender_status_idx;
drop index if exists connection_requests_receiver_status_idx;

alter table public.connection_requests
  alter column status drop default;

alter table public.connection_requests
  alter column status type text using (status::text);

update public.connection_requests
set status = 'declined'
where status in ('rejected', 'canceled');

alter table public.connection_requests
  alter column status set default 'pending';

alter table public.connection_requests
  drop constraint if exists connection_requests_status_check;
alter table public.connection_requests
  add constraint connection_requests_status_check
  check (status in ('pending', 'accepted', 'declined'));

alter table public.connection_requests rename column sender_id to from_user_id;
alter table public.connection_requests rename column receiver_id to to_user_id;

alter table public.connection_requests drop constraint if exists connection_requests_not_self;
alter table public.connection_requests
  add constraint connection_requests_not_self check (from_user_id <> to_user_id);

alter table public.connection_requests drop constraint if exists connection_requests_sender_id_fkey;
alter table public.connection_requests drop constraint if exists connection_requests_receiver_id_fkey;
alter table public.connection_requests drop constraint if exists connection_requests_from_user_id_fkey;
alter table public.connection_requests drop constraint if exists connection_requests_to_user_id_fkey;

alter table public.connection_requests
  add constraint connection_requests_from_user_id_fkey
  foreign key (from_user_id) references public.profiles(id) on delete restrict;
alter table public.connection_requests
  add constraint connection_requests_to_user_id_fkey
  foreign key (to_user_id) references public.profiles(id) on delete restrict;

alter table public.connection_requests
  add column if not exists updated_at timestamptz not null default now();

alter table public.connection_requests
  add constraint connection_requests_pair_unique unique (from_user_id, to_user_id);

create index if not exists connection_requests_to_status_idx
  on public.connection_requests (to_user_id, status);
create index if not exists connection_requests_from_idx
  on public.connection_requests (from_user_id);

drop trigger if exists connection_requests_updated_at on public.connection_requests;
create trigger connection_requests_updated_at
  before update on public.connection_requests
  for each row execute function public.set_updated_at();

create policy connection_requests_select_party
  on public.connection_requests for select to authenticated
  using ((select auth.uid()) in (from_user_id, to_user_id));
create policy connection_requests_insert_from
  on public.connection_requests for insert to authenticated
  with check ((select auth.uid()) = from_user_id);
create policy connection_requests_update_party
  on public.connection_requests for update to authenticated
  using ((select auth.uid()) in (from_user_id, to_user_id))
  with check ((select auth.uid()) in (from_user_id, to_user_id));

revoke all on table public.connection_requests from anon, public;
grant select, insert, update on table public.connection_requests to authenticated;
grant all on table public.connection_requests to service_role;

-- =============================================================================
-- 4. connections
-- =============================================================================

drop policy if exists connections_participants_select on public.connections;

alter table public.connections rename column created_at to connected_at;

alter table public.connections drop constraint if exists connections_user_a_id_fkey;
alter table public.connections drop constraint if exists connections_user_b_id_fkey;
alter table public.connections
  add constraint connections_user_a_id_fkey
  foreign key (user_a_id) references public.profiles(id) on delete restrict;
alter table public.connections
  add constraint connections_user_b_id_fkey
  foreign key (user_b_id) references public.profiles(id) on delete restrict;

alter table public.connections
  add column if not exists conversation_id uuid;

alter table public.connections drop constraint if exists connections_conversation_id_fkey;
alter table public.connections
  add constraint connections_conversation_id_fkey
  foreign key (conversation_id) references public.conversations(id) on delete set null;

create index if not exists connections_user_a_idx on public.connections (user_a_id);
create index if not exists connections_user_b_idx on public.connections (user_b_id);

create policy connections_select_party
  on public.connections for select to authenticated
  using ((select auth.uid()) in (user_a_id, user_b_id));
create policy connections_insert_party
  on public.connections for insert to authenticated
  with check ((select auth.uid()) in (user_a_id, user_b_id));
create policy connections_update_party
  on public.connections for update to authenticated
  using ((select auth.uid()) in (user_a_id, user_b_id))
  with check ((select auth.uid()) in (user_a_id, user_b_id));

revoke all on table public.connections from anon, public;
grant select, insert on table public.connections to authenticated;
grant update (conversation_id) on table public.connections to authenticated;
grant all on table public.connections to service_role;

-- =============================================================================
-- 5. conversations + participants + messages
-- =============================================================================

drop policy if exists conversations_participants_select on public.conversations;
drop policy if exists conversation_participants_members_select on public.conversation_participants;
drop policy if exists conversation_participants_self_update on public.conversation_participants;
drop policy if exists messages_participants_select on public.messages;
drop policy if exists messages_participants_insert on public.messages;
drop policy if exists messages_sender_update on public.messages;

alter table public.conversations
  alter column kind drop default;
alter table public.conversations
  alter column kind type text using kind::text;
alter table public.conversations
  alter column kind set default 'direct';
alter table public.conversations drop constraint if exists conversations_kind_check;
alter table public.conversations
  add constraint conversations_kind_check check (kind in ('direct', 'group'));

create or replace function public.get_direct_conversation(other_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.conversation_id
  from public.connections c
  where auth.uid() is not null
    and c.user_a_id = least(auth.uid(), other_user_id)
    and c.user_b_id = greatest(auth.uid(), other_user_id);
$$;

create or replace function public.respond_to_connection_request(request_id uuid, decision text)
returns public.connection_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_request public.connection_requests;
  v_mapped text;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  v_mapped := case decision
    when 'rejected' then 'declined'
    when 'accepted' then 'accepted'
    when 'declined' then 'declined'
    else null
  end;
  if v_mapped is null then raise exception 'invalid decision' using errcode = '22023'; end if;
  select * into v_request from public.connection_requests r where r.id = request_id for update;
  if not found or v_request.to_user_id <> v_user or v_request.status <> 'pending' then
    raise exception 'request unavailable' using errcode = '42501';
  end if;
  update public.connection_requests r
    set status = v_mapped, responded_at = now()
    where r.id = request_id
    returning * into v_request;
  if v_mapped = 'accepted' then
    insert into public.connections(user_a_id, user_b_id)
    values (
      least(v_request.from_user_id, v_request.to_user_id),
      greatest(v_request.from_user_id, v_request.to_user_id)
    )
    on conflict (user_a_id, user_b_id) do nothing;
  end if;
  return v_request;
end;
$$;

alter table public.conversations drop constraint if exists conversations_connection_id_fkey;
alter table public.conversations drop constraint if exists conversations_connection_id_key;
alter table public.conversations drop column if exists connection_id;

alter table public.conversations
  add column if not exists name text,
  add column if not exists created_by uuid,
  add column if not exists source_conversation_id uuid,
  add column if not exists last_message_text text,
  add column if not exists last_message_kind text,
  add column if not exists last_message_at timestamptz;

alter table public.conversations drop constraint if exists conversations_created_by_fkey;
alter table public.conversations
  add constraint conversations_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete restrict;
alter table public.conversations
  alter column created_by set not null;
alter table public.conversations drop constraint if exists conversations_source_conversation_id_fkey;
alter table public.conversations
  add constraint conversations_source_conversation_id_fkey
  foreign key (source_conversation_id) references public.conversations(id) on delete set null;

-- conversation_participants
alter table public.conversation_participants
  add column if not exists id uuid;
update public.conversation_participants set id = gen_random_uuid() where id is null;
alter table public.conversation_participants
  alter column id set default gen_random_uuid();
alter table public.conversation_participants
  alter column id set not null;

alter table public.conversation_participants drop constraint if exists conversation_participants_pkey;
alter table public.conversation_participants
  add constraint conversation_participants_pkey primary key (id);
alter table public.conversation_participants drop constraint if exists conversation_participants_membership_key;
alter table public.conversation_participants
  add constraint conversation_participants_membership_key unique (conversation_id, user_id);

alter table public.conversation_participants
  add column if not exists status text not null default 'accepted',
  add column if not exists pinned boolean not null default false,
  add column if not exists gesture_handled_at timestamptz,
  add column if not exists invited_at timestamptz not null default now(),
  add column if not exists responded_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table public.conversation_participants drop constraint if exists conversation_participants_status_check;
alter table public.conversation_participants
  add constraint conversation_participants_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled'));

alter table public.conversation_participants drop constraint if exists conversation_participants_user_id_fkey;
alter table public.conversation_participants
  add constraint conversation_participants_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete restrict;

create index if not exists conversation_participants_user_status_idx
  on public.conversation_participants (user_id, status);

create or replace function private.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_accepted_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = (select auth.uid())
      and cp.status = 'accepted'
  );
$$;

grant execute on function private.is_conversation_member(uuid) to authenticated;
grant execute on function private.is_accepted_participant(uuid) to authenticated;

-- messages
alter table public.messages
  alter column kind drop default;
alter table public.messages
  alter column kind type text using kind::text;
alter table public.messages
  alter column kind set default 'text';
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages
  add constraint messages_kind_check
  check (kind in ('text', 'event', 'location', 'image', 'video', 'audio', 'call'));

alter table public.messages rename column content to text;
update public.messages set text = coalesce(text, '');
alter table public.messages alter column text set default '';
alter table public.messages alter column text set not null;

alter table public.messages drop constraint if exists messages_has_payload;
alter table public.messages
  add column if not exists payload jsonb;

alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete restrict;

create or replace function public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
$$;

create policy conversations_select_member
  on public.conversations for select to authenticated
  using (private.is_conversation_member(id));
create policy conversations_insert_creator
  on public.conversations for insert to authenticated
  with check ((select auth.uid()) = created_by);
create policy conversations_update_creator
  on public.conversations for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

create policy conversation_participants_select_member
  on public.conversation_participants for select to authenticated
  using (private.is_conversation_member(conversation_id));
create policy conversation_participants_insert_self_or_creator
  on public.conversation_participants for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.created_by = (select auth.uid())
    )
  );
create policy conversation_participants_update_self
  on public.conversation_participants for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy messages_select_accepted
  on public.messages for select to authenticated
  using (private.is_accepted_participant(conversation_id));
create policy messages_insert_accepted_sender
  on public.messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and private.is_accepted_participant(conversation_id)
  );

revoke all on table public.conversations, public.conversation_participants, public.messages
  from anon, public;
grant select, insert, update on table public.conversations to authenticated;
grant select, insert, update on table public.conversation_participants to authenticated;
grant select, insert on table public.messages to authenticated;
grant all on table public.conversations, public.conversation_participants, public.messages to service_role;

-- RPCs legado: aceite NÃO cria Conversation (1H-8).
create or replace function public.send_connection_request(receiver_id uuid)
returns public.connection_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender uuid := auth.uid();
  v_result public.connection_requests;
begin
  if v_sender is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if receiver_id is null or receiver_id = v_sender then raise exception 'invalid receiver' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles p where p.id = receiver_id) then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if public.is_blocked_between(v_sender, receiver_id) then
    raise exception 'request unavailable' using errcode = '42501';
  end if;
  if public.are_connected(v_sender, receiver_id) then
    raise exception 'request unavailable' using errcode = '23505';
  end if;
  insert into public.connection_requests(from_user_id, to_user_id)
  values (v_sender, receiver_id)
  returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.respond_to_connection_request(request_id uuid, decision text)
returns public.connection_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_request public.connection_requests;
  v_mapped text;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  v_mapped := case decision
    when 'rejected' then 'declined'
    when 'accepted' then 'accepted'
    when 'declined' then 'declined'
    else null
  end;
  if v_mapped is null then raise exception 'invalid decision' using errcode = '22023'; end if;
  select * into v_request from public.connection_requests r where r.id = request_id for update;
  if not found or v_request.to_user_id <> v_user or v_request.status <> 'pending' then
    raise exception 'request unavailable' using errcode = '42501';
  end if;
  update public.connection_requests r
    set status = v_mapped, responded_at = now()
    where r.id = request_id
    returning * into v_request;
  if v_mapped = 'accepted' then
    insert into public.connections(user_a_id, user_b_id)
    values (
      least(v_request.from_user_id, v_request.to_user_id),
      greatest(v_request.from_user_id, v_request.to_user_id)
    )
    on conflict (user_a_id, user_b_id) do nothing;
  end if;
  return v_request;
end;
$$;

create or replace function public.cancel_connection_request(request_id uuid)
returns public.connection_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_result public.connection_requests;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  update public.connection_requests r
    set status = 'declined', responded_at = now()
    where r.id = request_id and r.from_user_id = v_user and r.status = 'pending'
    returning * into v_result;
  if not found then raise exception 'request unavailable' using errcode = '42501'; end if;
  return v_result;
end;
$$;

create or replace function public.find_pending_request_for_receiver(p_sender_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.id from public.connection_requests r
  where r.from_user_id = p_sender_id
    and r.to_user_id = auth.uid()
    and r.status = 'pending'
  limit 1;
$$;

create or replace function public.get_direct_conversation(other_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.conversation_id
  from public.connections c
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
  select s.id, s.name, s.handle, s.photo_url, s.headline, s.age,
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

-- =============================================================================
-- 6. posts / reels
-- =============================================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  text text,
  category text,
  privacy text not null,
  location_label text,
  hashtags text[] not null default '{}',
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint posts_privacy_check check (privacy in ('PUBLIC', 'CONNECTIONS', 'PRIVATE'))
);

create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);

alter table public.posts enable row level security;

create policy posts_select_privacy
  on public.posts for select to authenticated
  using (
    privacy = 'PUBLIC'
    or author_id = (select auth.uid())
    or (privacy = 'CONNECTIONS' and public.are_connected((select auth.uid()), author_id))
  );
create policy posts_insert_author
  on public.posts for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy posts_update_author
  on public.posts for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
create policy posts_delete_author
  on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id);

revoke all on table public.posts from anon, public;
grant select, insert, update, delete on table public.posts to authenticated;
grant all on table public.posts to service_role;

drop policy if exists "Reels are public" on public.reels;
drop policy if exists "Author can insert reel" on public.reels;
drop policy if exists "Author can update reel" on public.reels;
drop policy if exists "Author can delete reel" on public.reels;
drop policy if exists "Likes are public" on public.reel_likes;
drop policy if exists "User can like" on public.reel_likes;
drop policy if exists "User can unlike" on public.reel_likes;
drop policy if exists "Comments are public" on public.reel_comments;
drop policy if exists "Auth can comment" on public.reel_comments;
drop policy if exists "Author can delete comment" on public.reel_comments;

alter table public.reels
  add column if not exists category text not null default 'MOMENT',
  add column if not exists context_type text,
  add column if not exists context_id uuid,
  add column if not exists context_title text;

update public.reels set caption = coalesce(caption, '');
alter table public.reels alter column caption set default '';
alter table public.reels alter column caption set not null;

update public.reels set duration_s = coalesce(duration_s, 0);
alter table public.reels alter column duration_s set default 0;
alter table public.reels alter column duration_s set not null;

alter table public.reels drop constraint if exists reels_author_id_fkey;
alter table public.reels
  add constraint reels_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete restrict;

create index if not exists reels_author_created_idx on public.reels (author_id, created_at desc);

alter table public.reel_likes add column if not exists id uuid;
update public.reel_likes set id = gen_random_uuid() where id is null;
alter table public.reel_likes alter column id set default gen_random_uuid();
alter table public.reel_likes alter column id set not null;
alter table public.reel_likes drop constraint if exists reel_likes_pkey;
alter table public.reel_likes add constraint reel_likes_pkey primary key (id);
alter table public.reel_likes drop constraint if exists reel_likes_unique_pair;
alter table public.reel_likes add constraint reel_likes_unique_pair unique (reel_id, user_id);

alter table public.reel_likes drop constraint if exists reel_likes_user_id_fkey;
alter table public.reel_likes
  add constraint reel_likes_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete restrict;

alter table public.reel_comments
  add column if not exists parent_id uuid,
  add column if not exists sibling_order integer;

alter table public.reel_comments drop constraint if exists reel_comments_parent_id_fkey;
alter table public.reel_comments
  add constraint reel_comments_parent_id_fkey
  foreign key (parent_id) references public.reel_comments(id) on delete restrict;

alter table public.reel_comments drop constraint if exists reel_comments_author_id_fkey;
alter table public.reel_comments
  add constraint reel_comments_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete restrict;

create index if not exists reel_comments_parent_idx on public.reel_comments (parent_id);

create policy reels_select_authenticated
  on public.reels for select to authenticated
  using (true);
create policy reels_insert_author
  on public.reels for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy reels_update_author
  on public.reels for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
create policy reels_delete_author
  on public.reels for delete to authenticated
  using ((select auth.uid()) = author_id);

create policy reel_likes_select_authenticated
  on public.reel_likes for select to authenticated
  using (true);
create policy reel_likes_insert_own
  on public.reel_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy reel_likes_delete_own
  on public.reel_likes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy reel_comments_select_authenticated
  on public.reel_comments for select to authenticated
  using (true);
create policy reel_comments_insert_author
  on public.reel_comments for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy reel_comments_delete_author
  on public.reel_comments for delete to authenticated
  using ((select auth.uid()) = author_id);

revoke all on table public.reels, public.reel_likes, public.reel_comments from anon, public;
grant select, insert, update, delete on table public.reels to authenticated;
grant select, insert, delete on table public.reel_likes to authenticated;
grant select, insert, delete on table public.reel_comments to authenticated;
grant all on table public.reels, public.reel_likes, public.reel_comments to service_role;

-- =============================================================================
-- 7. catalog: businesses, places, events, offers
-- =============================================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  category text not null,
  address text not null,
  description text,
  cover_url text,
  lat numeric,
  lng numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on public.businesses (owner_id);

drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

alter table public.places
  add column if not exists address text not null default '',
  add column if not exists hours text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.places drop constraint if exists places_owner_id_fkey;
alter table public.places
  add constraint places_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete restrict;

drop trigger if exists places_updated_at on public.places;
create trigger places_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

create index if not exists places_owner_idx on public.places (owner_id);

drop policy if exists "Places are public" on public.places;
drop policy if exists "Owner can insert place" on public.places;
drop policy if exists "Owner can update place" on public.places;
drop policy if exists "Owner can delete place" on public.places;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  capacity integer,
  price numeric,
  photo_url text,
  business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_owner_idx on public.events (owner_id);
create index if not exists events_start_idx on public.events (start_at);
create index if not exists events_business_idx on public.events (business_id);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  title text not null,
  description text,
  discount_value numeric not null,
  valid_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_owner_idx on public.offers (owner_id);
create index if not exists offers_business_idx on public.offers (business_id);
create index if not exists offers_valid_until_idx on public.offers (valid_until);

drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.events enable row level security;
alter table public.offers enable row level security;

create policy businesses_select_authenticated
  on public.businesses for select to authenticated
  using (true);
create policy businesses_insert_owner
  on public.businesses for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy businesses_update_owner
  on public.businesses for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy businesses_delete_owner
  on public.businesses for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy places_select_authenticated
  on public.places for select to authenticated
  using (true);
create policy places_insert_owner
  on public.places for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy places_update_owner
  on public.places for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy places_delete_owner
  on public.places for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy events_select_authenticated
  on public.events for select to authenticated
  using (true);
create policy events_insert_owner
  on public.events for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy events_update_owner
  on public.events for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy events_delete_owner
  on public.events for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy offers_select_authenticated
  on public.offers for select to authenticated
  using (true);
create policy offers_insert_owner
  on public.offers for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy offers_update_owner
  on public.offers for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy offers_delete_owner
  on public.offers for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on table public.businesses, public.places, public.events, public.offers from anon, public;
grant select, insert, update, delete on table public.businesses to authenticated;
grant select, insert, update, delete on table public.places to authenticated;
grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update, delete on table public.offers to authenticated;
grant all on table public.businesses, public.places, public.events, public.offers to service_role;

-- =============================================================================
-- 8. reservations
-- =============================================================================

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  resource_type text not null,
  business_id uuid references public.businesses(id) on delete restrict,
  place_id uuid references public.places(id) on delete restrict,
  resource_name text not null,
  slot_date date not null,
  slot_time time not null,
  party_size integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_resource_type_check check (resource_type in ('business', 'place')),
  constraint reservations_status_check check (status in ('pending', 'confirmed', 'cancelled')),
  constraint reservations_party_size_check check (party_size between 1 and 20),
  constraint reservations_target_xor check (
    (resource_type = 'business' and business_id is not null and place_id is null)
    or (resource_type = 'place' and place_id is not null and business_id is null)
  )
);

create index if not exists reservations_user_created_idx on public.reservations (user_id, created_at desc);
create index if not exists reservations_business_idx on public.reservations (business_id);
create index if not exists reservations_place_idx on public.reservations (place_id);

drop trigger if exists reservations_updated_at on public.reservations;
create trigger reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

create or replace function private.is_reservation_target_owner(p_business_id uuid, p_place_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.places p
    where p.id = p_place_id and p.owner_id = (select auth.uid())
  );
$$;

grant execute on function private.is_reservation_target_owner(uuid, uuid) to authenticated;

alter table public.reservations enable row level security;

create policy reservations_select_customer_or_target
  on public.reservations for select to authenticated
  using (
    (select auth.uid()) = user_id
    or private.is_reservation_target_owner(business_id, place_id)
  );
create policy reservations_insert_customer
  on public.reservations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy reservations_update_customer_or_target
  on public.reservations for update to authenticated
  using (
    (select auth.uid()) = user_id
    or private.is_reservation_target_owner(business_id, place_id)
  )
  with check (
    (select auth.uid()) = user_id
    or private.is_reservation_target_owner(business_id, place_id)
  );

revoke all on table public.reservations from anon, public;
grant select, insert, update on table public.reservations to authenticated;
grant all on table public.reservations to service_role;

-- =============================================================================
-- 9. carona
-- =============================================================================

create table if not exists public.carona_offers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  origin text not null,
  destination text not null,
  meetup text not null,
  ride_date date not null,
  ride_time time not null,
  available_seats integer not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carona_offers_seats_check check (available_seats >= 0),
  constraint carona_offers_status_check check (status in ('active', 'full', 'cancelled', 'completed'))
);

create index if not exists carona_offers_owner_idx on public.carona_offers (owner_id);
create index if not exists carona_offers_status_date_idx on public.carona_offers (status, ride_date);

drop trigger if exists carona_offers_updated_at on public.carona_offers;
create trigger carona_offers_updated_at
  before update on public.carona_offers
  for each row execute function public.set_updated_at();

create table if not exists public.carona_requests (
  id uuid primary key default gen_random_uuid(),
  ride_offer_id uuid not null references public.carona_offers(id) on delete restrict,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  status text not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carona_requests_status_check check (status in ('requested', 'accepted', 'rejected', 'cancelled')),
  constraint carona_requests_unique_pair unique (ride_offer_id, requester_id)
);

create index if not exists carona_requests_offer_status_idx on public.carona_requests (ride_offer_id, status);
create index if not exists carona_requests_requester_idx on public.carona_requests (requester_id);

drop trigger if exists carona_requests_updated_at on public.carona_requests;
create trigger carona_requests_updated_at
  before update on public.carona_requests
  for each row execute function public.set_updated_at();

create or replace function private.carona_request_not_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.carona_offers o
    where o.id = new.ride_offer_id and o.owner_id = new.requester_id
  ) then
    raise exception 'requester cannot be offer owner' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists carona_requests_not_owner on public.carona_requests;
create trigger carona_requests_not_owner
  before insert or update of ride_offer_id, requester_id on public.carona_requests
  for each row execute function private.carona_request_not_owner();

create or replace function private.is_carona_offer_owner(p_offer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.carona_offers o
    where o.id = p_offer_id and o.owner_id = (select auth.uid())
  );
$$;

grant execute on function private.is_carona_offer_owner(uuid) to authenticated;

alter table public.carona_offers enable row level security;
alter table public.carona_requests enable row level security;

create policy carona_offers_select_active_or_owner
  on public.carona_offers for select to authenticated
  using (status = 'active' or (select auth.uid()) = owner_id);
create policy carona_offers_insert_owner
  on public.carona_offers for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy carona_offers_update_owner
  on public.carona_offers for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy carona_offers_delete_owner
  on public.carona_offers for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy carona_requests_select_parties
  on public.carona_requests for select to authenticated
  using (
    (select auth.uid()) = requester_id
    or private.is_carona_offer_owner(ride_offer_id)
  );
create policy carona_requests_insert_requester
  on public.carona_requests for insert to authenticated
  with check ((select auth.uid()) = requester_id);
create policy carona_requests_update_parties
  on public.carona_requests for update to authenticated
  using (
    (select auth.uid()) = requester_id
    or private.is_carona_offer_owner(ride_offer_id)
  )
  with check (
    (select auth.uid()) = requester_id
    or private.is_carona_offer_owner(ride_offer_id)
  );

revoke all on table public.carona_offers, public.carona_requests from anon, public;
grant select, insert, update, delete on table public.carona_offers to authenticated;
grant select, insert, update on table public.carona_requests to authenticated;
grant all on table public.carona_offers, public.carona_requests to service_role;

-- =============================================================================
-- 10. saves
-- =============================================================================

create table if not exists public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  constraint saves_target_type_check check (
    target_type in ('business', 'place', 'event', 'offer', 'reel', 'post')
  ),
  constraint saves_unique_target unique (user_id, target_type, target_id)
);

alter table public.saves enable row level security;

create policy saves_owner_select
  on public.saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy saves_owner_insert
  on public.saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy saves_owner_delete
  on public.saves for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.saves from anon, public;
grant select, insert, delete on table public.saves to authenticated;
grant all on table public.saves to service_role;

-- Recreate helper now that carona_offers / businesses exist
create or replace function private.is_reservation_target_owner(p_business_id uuid, p_place_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.places p
    where p.id = p_place_id and p.owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_carona_offer_owner(p_offer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.carona_offers o
    where o.id = p_offer_id and o.owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_accepted_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = (select auth.uid())
      and cp.status = 'accepted'
  );
$$;
