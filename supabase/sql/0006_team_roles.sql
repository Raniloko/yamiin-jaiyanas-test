-- Team & Rechte: Inhaber verwaltet, wer ins Dashboard/in die Küche darf und wer die Statistiken sieht.
-- Neue Konten entstehen nur noch per Einladung aus dem Dashboard (Server-Funktion mit Service-Rolle),
-- Selbstregistrierung über die Login-Seite ist in der Datenbank gesperrt.
-- Idempotent geschrieben, darf erneut ausgeführt werden.

-- 1) Rollen auf der Freigabeliste ----------------------------------------------------------------
alter table public.admin_emails add column if not exists role text not null default 'staff';
alter table public.admin_emails add column if not exists can_view_stats boolean not null default false;
alter table public.admin_emails add column if not exists added_at timestamptz not null default now();
alter table public.admin_emails drop constraint if exists admin_emails_role_check;
alter table public.admin_emails add constraint admin_emails_role_check check (role in ('owner', 'staff'));
update public.admin_emails set role = 'owner', can_view_stats = true where email = 'traoretidiane635@gmail.com';

-- Eintrag der angemeldeten Person (nur mit bestätigter E-Mail).
create or replace function public.my_admin_entry()
returns public.admin_emails
language sql
stable
security definer
set search_path = public
as $$
  select a.*
  from auth.users u
  join public.admin_emails a on a.email = lower(u.email)
  where u.id = auth.uid() and u.email_confirmed_at is not null;
$$;
revoke all on function public.my_admin_entry() from public, anon, authenticated;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'owner' from public.my_admin_entry()), false);
$$;
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated;

create or replace function public.can_view_stats()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'owner' or can_view_stats from public.my_admin_entry()), false);
$$;
revoke all on function public.can_view_stats() from public;
grant execute on function public.can_view_stats() to authenticated;

-- Für die Oberfläche: was darf ich? (Die Daten selbst schützen weiterhin die Policies.)
create or replace function public.my_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('admin', public.is_admin(), 'owner', public.is_owner(), 'stats', public.can_view_stats());
$$;
revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- 2) Statistik nur mit Statistik-Recht ---------------------------------------------------------
drop policy if exists "Admins read menu events" on public.menu_events;
create policy "Admins read menu events" on public.menu_events
  for select to authenticated using (public.can_view_stats());

-- admin_menu_analytics: gleiche Auswertung, aber Statistik-Recht statt nur Admin.
do $$
declare
  src text;
begin
  select pg_get_functiondef('public.admin_menu_analytics(timestamptz, timestamptz)'::regprocedure) into src;
  if position('public.can_view_stats()' in src) = 0 then
    execute replace(src, 'if not public.is_admin() then', 'if not public.can_view_stats() then');
  end if;
end;
$$;

-- Bestellungen: Team ohne Statistik-Recht sieht nur das laufende Geschäft (letzte 7 Tage bzw.
-- vorbestellte Abholungen), aber keine Umsatz-Historie und keine Kundenauswertung.
drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders" on public.orders
  for select to authenticated
  using (public.is_admin() and (public.can_view_stats() or greatest(created_at, pickup_at) > now() - interval '7 days'));

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders
  for update to authenticated
  using (public.is_admin() and (public.can_view_stats() or greatest(created_at, pickup_at) > now() - interval '7 days'))
  with check (public.is_admin());

-- 3) Übersicht für das Dashboard -----------------------------------------------------------------
drop function if exists public.admin_accounts();
create function public.admin_accounts()
returns table (email text, is_admin boolean, role text, can_view_stats boolean, has_account boolean, confirmed boolean, last_sign_in_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(a.email, lower(u.email)), a.email is not null, a.role, coalesce(a.role = 'owner' or a.can_view_stats, false),
         u.id is not null, u.email_confirmed_at is not null, u.last_sign_in_at, coalesce(u.created_at, a.added_at)
  from public.admin_emails a
  full join auth.users u on lower(u.email) = a.email
  where public.is_admin()
  order by (a.role = 'owner') desc nulls last, (a.email is not null) desc, u.last_sign_in_at desc nulls last;
$$;
revoke all on function public.admin_accounts() from public, anon;
grant execute on function public.admin_accounts() to authenticated;

-- 4) Rechte vergeben/entziehen – nur der Inhaber, nie für Inhaber-Einträge (auch nicht sich selbst).
create or replace function public.owner_set_access(p_email text, p_admin boolean, p_stats boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target text := lower(trim(p_email));
begin
  if not public.is_owner() then
    raise exception 'Nur der Inhaber kann Rechte ändern.' using errcode = '42501';
  end if;
  if target is null or target !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Ungültige E-Mail-Adresse.' using errcode = '22023';
  end if;
  if exists (select 1 from public.admin_emails where email = target and role = 'owner') then
    raise exception 'Inhaber-Zugänge lassen sich hier nicht ändern.' using errcode = '42501';
  end if;
  if p_admin then
    insert into public.admin_emails (email, role, can_view_stats) values (target, 'staff', coalesce(p_stats, false))
    on conflict (email) do update set can_view_stats = excluded.can_view_stats;
  else
    delete from public.admin_emails where email = target;
  end if;
end;
$$;
revoke all on function public.owner_set_access(text, boolean, boolean) from public, anon;
grant execute on function public.owner_set_access(text, boolean, boolean) to authenticated;

-- 5) Keine Selbstregistrierung: neue Login-Konten nur für E-Mails auf der Freigabeliste
--    (die Einladung trägt die Adresse vorher ein). Gäste bestellen ohne Konto.
create or replace function public.block_uninvited_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or not exists (select 1 from public.admin_emails where email = lower(new.email)) then
    raise exception 'Registrierung nur per Einladung.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.block_uninvited_signup() from public, anon, authenticated;

drop trigger if exists before_auth_user_insert_require_invite on auth.users;
create trigger before_auth_user_insert_require_invite
  before insert on auth.users
  for each row execute function public.block_uninvited_signup();

-- 6) E-Mail-Wechsel: Freigabe samt Rolle und Statistik-Recht mitnehmen (ersetzt 0004).
create or replace function public.transfer_admin_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email
     and old.email is not null and new.email is not null
     and exists (select 1 from public.admin_emails where email = lower(old.email)) then
    delete from public.admin_emails where email = lower(new.email);
    update public.admin_emails set email = lower(new.email) where email = lower(old.email);
  end if;
  return new;
end;
$$;
revoke execute on function public.transfer_admin_email() from public, anon, authenticated;
