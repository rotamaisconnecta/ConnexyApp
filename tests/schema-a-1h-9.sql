-- 1H-9 — validação Schema A (estrutura, constraints, RLS)
-- Executar contra o Postgres local. Transação revertida ao final.

begin;

do $$
declare
  missing text;
begin
  select string_agg(t, ', ')
  into missing
  from unnest(array[
    'profiles','profile_private','follows','connection_requests','connections',
    'conversations','conversation_participants','messages','posts','reels',
    'reel_likes','reel_comments','businesses','places','events','offers',
    'reservations','carona_offers','carona_requests','saves'
  ]) as t
  where not exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = t
  );
  if missing is not null then
    raise exception 'missing schema A tables: %', missing;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name in ('products','services','orders','order_items','payments','carts','tickets')
  ) then
    raise exception 'commerce B table leaked into schema A';
  end if;
end $$;

-- Integrity: self-follow, duplicate connection orientation, offer requires business, reservation XOR
do $$
declare
  u1 uuid;
  u2 uuid;
  biz uuid;
  conv uuid;
begin
  select id into u1 from public.profiles order by handle limit 1;
  select id into u2 from public.profiles order by handle desc limit 1;
  if u1 is null or u2 is null or u1 = u2 then
    raise exception 'need two distinct profiles for integrity tests';
  end if;

  begin
    insert into public.follows (follower_id, followee_id) values (u1, u1);
    raise exception 'self-follow should fail';
  exception when check_violation then null;
  end;

  insert into public.follows (follower_id, followee_id) values (u1, u2);
  begin
    insert into public.follows (follower_id, followee_id) values (u1, u2);
    raise exception 'duplicate follow should fail';
  exception when unique_violation then null;
  end;

  begin
    insert into public.connections (user_a_id, user_b_id) values (u2, u1);
    raise exception 'denormalized connection pair should fail';
  exception when check_violation then null;
  end;

  insert into public.connections (user_a_id, user_b_id)
  values (least(u1,u2), greatest(u1,u2));

  insert into public.businesses (id, owner_id, name, category, address)
  values (gen_random_uuid(), u1, 'Cafe Teste', 'CAFE', 'Rua A')
  returning id into biz;

  begin
    insert into public.offers (owner_id, business_id, title, discount_value, valid_until)
    values (u1, '00000000-0000-0000-0000-000000000000', 'x', 10, now() + interval '1 day');
    raise exception 'offer without real business should fail';
  exception when foreign_key_violation then null;
  end;

  insert into public.offers (owner_id, business_id, title, discount_value, valid_until)
  values (u1, biz, 'Promo', 10, now() + interval '1 day');

  begin
    insert into public.reservations (
      user_id, resource_type, business_id, place_id, resource_name, slot_date, slot_time, party_size, status
    ) values (u2, 'business', biz, null, 'Cafe Teste', current_date, '12:00', 2, 'pending');
  exception when others then
    raise exception 'valid reservation insert failed: %', sqlerrm;
  end;

  begin
    insert into public.reservations (
      user_id, resource_type, business_id, place_id, resource_name, slot_date, slot_time, party_size, status
    ) values (u2, 'business', biz, biz, 'Cafe Teste', current_date, '13:00', 2, 'pending');
    raise exception 'reservation XOR should fail';
  exception when check_violation then null;
  end;

  begin
    insert into public.reservations (
      user_id, resource_type, business_id, place_id, resource_name, slot_date, slot_time, party_size, status
    ) values (u2, 'business', biz, null, 'Cafe Teste', current_date, '14:00', 99, 'pending');
    raise exception 'party_size bound should fail';
  exception when check_violation then null;
  end;

  insert into public.conversations (kind, created_by)
  values ('direct', u1)
  returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id, status)
  values (conv, u1, 'accepted'), (conv, u2, 'accepted');
  insert into public.messages (conversation_id, sender_id, kind, text)
  values (conv, u1, 'text', 'oi');
  insert into public.messages (conversation_id, sender_id, kind, text, payload)
  values (conv, u1, 'call', '', jsonb_build_object('media','voice','outcome','ended'));
end $$;

-- RLS isolation
do $$
declare
  u1 uuid;
  u2 uuid;
  save_id uuid;
  seen int;
begin
  select id into u1 from public.profiles order by handle limit 1;
  select id into u2 from public.profiles order by handle desc limit 1;

  insert into public.saves (user_id, target_type, target_id)
  values (u1, 'post', gen_random_uuid())
  returning id into save_id;

  perform set_config('request.jwt.claim.sub', u2::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into seen from public.saves where id = save_id;
  if seen <> 0 then
    raise exception 'user B should not see user A saves';
  end if;

  perform set_config('role', 'postgres', true);
end $$;

do $$
declare
  u1 uuid;
  u2 uuid;
  conv uuid;
  seen int;
  pending_id uuid;
begin
  select id into u1 from public.profiles order by handle limit 1;
  select id into u2 from public.profiles order by handle desc limit 1;

  insert into public.conversations (kind, created_by)
  values ('direct', u1) returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id, status)
  values (conv, u1, 'accepted');
  insert into public.conversation_participants (conversation_id, user_id, status)
  values (conv, u2, 'pending') returning id into pending_id;
  insert into public.messages (conversation_id, sender_id, kind, text)
  values (conv, u1, 'text', 'secret');

  perform set_config('request.jwt.claim.sub', u2::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into seen from public.messages where conversation_id = conv;
  if seen <> 0 then
    raise exception 'pending participant should not read messages';
  end if;

  select count(*) into seen from public.conversation_participants where conversation_id = conv;
  if seen < 1 then
    raise exception 'pending participant should see membership';
  end if;

  perform set_config('role', 'postgres', true);

  perform set_config('request.jwt.claim.sub', u1::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into seen from public.messages where conversation_id = conv;
  if seen < 1 then
    raise exception 'accepted participant should read messages';
  end if;
  perform set_config('role', 'postgres', true);
end $$;

do $$
declare
  seen int;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  begin
    select count(*) into seen from public.profile_private;
    if seen <> 0 then
      raise exception 'anon should not read profile_private';
    end if;
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform set_config('role', 'anon', true);
    select count(*) into seen from public.messages;
    if seen <> 0 then
      raise exception 'anon should not read messages';
    end if;
  exception when insufficient_privilege then
    null;
  end;
  perform set_config('role', 'postgres', true);
end $$;

do $$
declare
  u1 uuid;
  u2 uuid;
  offer uuid;
begin
  select id into u1 from public.profiles order by handle limit 1;
  select id into u2 from public.profiles order by handle desc limit 1;
  insert into public.carona_offers (owner_id, origin, destination, meetup, ride_date, ride_time, available_seats, status)
  values (u1, 'A', 'B', 'Ponto', current_date, '09:00', 2, 'active')
  returning id into offer;
  begin
    insert into public.carona_requests (ride_offer_id, requester_id, status)
    values (offer, u1, 'requested');
    raise exception 'owner requesting own carona should fail';
  exception when check_violation then null;
  when raise_exception then
    if sqlerrm not like '%requester cannot be offer owner%' then
      raise;
    end if;
  end;
  insert into public.carona_requests (ride_offer_id, requester_id, status)
  values (offer, u2, 'requested');
end $$;

rollback;

select 'schema_a_1h9_ok' as result;
