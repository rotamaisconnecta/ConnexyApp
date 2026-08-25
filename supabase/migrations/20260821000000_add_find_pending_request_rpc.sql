-- Adds a helper RPC to find a pending connection request where the caller is the receiver.
-- This avoids the 403 from PostgREST when querying connection_requests directly.
-- Security definer bypasses RLS so authenticated users can find their own incoming requests.

create or replace function public.find_pending_request_for_receiver(p_sender_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select r.id from public.connection_requests r
  where r.sender_id = p_sender_id
    and r.receiver_id = auth.uid()
    and r.status = 'pending'
  limit 1;
$$;

revoke execute on function public.find_pending_request_for_receiver(uuid)
  from public, anon;
grant execute on function public.find_pending_request_for_receiver(uuid)
  to authenticated;
