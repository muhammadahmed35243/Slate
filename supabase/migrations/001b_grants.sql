-- Slate: 001b_grants.sql
-- Newer Supabase projects don't auto-grant API roles access to tables created in SQL.
-- Run right after 001_schema.sql.
--   service_role (Express admin client): full access, bypasses RLS
--   authenticated (logged-in users via Express userClient): CRUD, filtered by RLS (002_rls.sql)
--   anon: nothing. The public widget goes through Express, never straight to the DB.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Tables created later get the same grants automatically.
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
