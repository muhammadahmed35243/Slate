-- Slate: 005_functions.sql
-- Database functions called by Express through supabase.rpc(). Run after 003_triggers.sql.

-- create_business: atomically creates the business, its owner membership,
-- a free subscription and an activity entry. Either all rows exist or none do.
-- Only the service role (Express admin client) may call it; p_owner comes
-- from the verified JWT, never from the request body.
create or replace function public.create_business(p_owner uuid, p_data jsonb)
returns businesses
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text;
  b businesses;
begin
  select email into v_email from profiles where id = p_owner and is_active;
  if v_email is null then
    raise exception 'Owner profile not found or inactive' using errcode = '23503';
  end if;

  insert into businesses (owner_id, name, category, website_url, address, lat, lng, phone, hours, timezone)
  values (
    p_owner,
    p_data->>'name',
    p_data->>'category',
    p_data->>'website_url',
    p_data->>'address',
    (p_data->>'lat')::double precision,
    (p_data->>'lng')::double precision,
    p_data->>'phone',
    coalesce(p_data->'hours', '{}'::jsonb),
    coalesce(p_data->>'timezone', 'Asia/Karachi')
  )
  returning * into b;

  insert into business_members (business_id, user_id, invited_email, role, status)
  values (b.id, p_owner, lower(v_email), 'owner', 'active');

  insert into subscriptions (business_id, plan_name, status)
  values (b.id, 'free', 'active');

  insert into activity_log (business_id, actor_id, type, summary)
  values (b.id, p_owner, 'business.created', 'Business "' || b.name || '" created');

  return b;
end;
$$;

revoke all on function public.create_business(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_business(uuid, jsonb) to service_role;
