-- Slate: 003_triggers.sql
-- Profile on signup + updated_at maintenance. Run after 001_schema.sql.

-- Create a profile row whenever a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger assistants_updated_at before update on assistants
  for each row execute function public.set_updated_at();
create trigger faqs_updated_at before update on faqs
  for each row execute function public.set_updated_at();

-- Track lead status changes (used by the auto-Lost job and pipeline stats).
create or replace function public.touch_lead_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;
  return new;
end;
$$;

create trigger leads_status_changed before update on leads
  for each row execute function public.touch_lead_status();

-- Bump conversations.last_message_at on every new message.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation after insert on messages
  for each row execute function public.touch_conversation();
