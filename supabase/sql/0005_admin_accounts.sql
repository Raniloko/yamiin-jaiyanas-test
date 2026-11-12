-- Übersicht für das Dashboard: alle Admin-Freigaben und alle Login-Konten (ohne Passwörter/Tokens).
-- Nur für Admins (is_admin()), sonst leer.
-- 0006 ersetzt die Funktion durch eine Fassung mit mehr Spalten; drop statt "create or replace",
-- damit die Dateien auch erneut in Reihenfolge laufen dürfen.
drop function if exists public.admin_accounts();
create function public.admin_accounts()
returns table (email text, is_admin boolean, has_account boolean, confirmed boolean, last_sign_in_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(a.email, lower(u.email)) as email,
         a.email is not null as is_admin,
         u.id is not null as has_account,
         u.email_confirmed_at is not null as confirmed,
         u.last_sign_in_at,
         u.created_at
  from public.admin_emails a
  full join auth.users u on lower(u.email) = a.email
  where public.is_admin()
  order by (a.email is not null) desc, u.last_sign_in_at desc nulls last;
$$;
revoke all on function public.admin_accounts() from public, anon;
grant execute on function public.admin_accounts() to authenticated;
