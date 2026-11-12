-- Datenbank für ein NEUES Supabase-Projekt einrichten (Umzug von Lovable Cloud zu eigenem Supabase).
-- In Supabase: SQL Editor → New query → diesen ganzen Inhalt einfügen → Run.
--
-- Erzeugt von supabase/build-setup.sh aus supabase/sql/0000 bis 0009 – nicht von Hand ändern, sondern die
-- Einzeldateien ändern und das Skript neu ausführen. Jede Datei ist idempotent, das Ganze darf zweimal laufen.
--
-- Danach: Authentication → Users → Add user → deine Inhaber-E-Mail mit Passwort und "Auto Confirm User".
-- Nur E-Mails auf der Freigabeliste (public.admin_emails) dürfen Konten haben; dein Inhaber-Eintrag
-- wird unten in 0001/0006 angelegt. Weitere Teammitglieder lädst du danach im Dashboard ein.

-- ===== 0000_orders.sql =====

-- Grundtabelle der Bestellungen, so wie sie in der Datenbank steht. Bisher stand sie nur verteilt in
-- drizzle/migrations/0000_create_orders.sql und teils direkt in Lovable Cloud (paid, stripe_session_id).
-- Für ein neues Supabase-Projekt als Erstes ausführen, danach 0001 bis 0009 in dieser Reihenfolge
-- (supabase/setup.sql enthält alles zusammen). Idempotent: auf der bestehenden Datenbank ändert sie nichts.
-- Bewusst ohne die offenen Policies aus der Drizzle-Migration – wer was darf, regeln 0002 und 0009.

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  pickup_at timestamptz not null,
  pickup_label text not null,
  fulfillment text not null default 'pickup',
  address jsonb,
  delivery_fee numeric not null default 0,
  payment text not null,
  contact jsonb not null,
  note text not null default '',
  items jsonb not null,
  total numeric not null,
  status text not null default 'bestaetigt',
  paid boolean not null default false,
  stripe_session_id text
);
alter table public.orders add column if not exists paid boolean not null default false;
alter table public.orders add column if not exists stripe_session_id text;

alter table public.orders enable row level security;
grant all on public.orders to service_role;

-- Live-Status: Küche und Dashboard bekommen neue und geänderte Bestellungen sofort.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ===== 0001_admin_dashboard.sql =====

-- Admin-Dashboard & Speisekarten-Statistik (Schritt 1, rein ergänzend – ändert kein bestehendes Verhalten).
-- Über Lovable Cloud angewendet. Idempotent geschrieben, darf erneut ausgeführt werden.

-- 1) Admin-Freigabe per E-Mail-Liste ------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security; -- keine Policies: nur Service-Rolle/Funktionen
insert into public.admin_emails (email) values ('traoretidiane635@gmail.com') on conflict do nothing;

-- true, wenn die angemeldete Person eine bestätigte E-Mail auf der Admin-Liste hat.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2) Geheimer Gast-Schlüssel pro Bestellung (für die Statusseite ohne Login) --------------------
alter table public.orders add column if not exists access_token uuid not null default gen_random_uuid();

-- 3) Anonyme Speisekarten-Interaktionen (keine personenbezogenen Daten, keine IP, keine Cookies) -
create table if not exists public.menu_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null check (char_length(session_id) between 8 and 40),
  event text not null check (event in (
    'page_view', 'category_view', 'item_view', 'add_to_cart', 'remove_from_cart',
    'search', 'checkout_start', 'order_placed'
  )),
  item text check (char_length(item) <= 100),
  category text check (char_length(category) <= 40),
  variant text check (char_length(variant) <= 120),
  query text check (char_length(query) <= 60),
  qty integer check (qty between 0 and 100),
  value numeric check (value between 0 and 2000),
  device text check (device in ('mobile', 'tablet', 'desktop'))
);
create index if not exists menu_events_created_at_idx on public.menu_events (created_at);
create index if not exists menu_events_event_created_idx on public.menu_events (event, created_at);

alter table public.menu_events enable row level security;
grant insert on public.menu_events to anon, authenticated;
grant select on public.menu_events to authenticated;
grant all on public.menu_events to service_role;

drop policy if exists "Anyone can log menu events" on public.menu_events;
create policy "Anyone can log menu events" on public.menu_events
  for insert to anon, authenticated with check (created_at > now() - interval '5 minutes');
drop policy if exists "Admins read menu events" on public.menu_events;
create policy "Admins read menu events" on public.menu_events
  for select to authenticated using (public.is_admin());

-- 4) Auswertung für das Dashboard (aggregiert in der Datenbank, nur für Admins) ------------------
create or replace function public.admin_menu_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  with ev as (
    select * from public.menu_events where created_at >= p_from and created_at < p_to
  )
  select jsonb_build_object(
    'totals', (select jsonb_object_agg(event, jsonb_build_object('events', n, 'sessions', s))
               from (select event, count(*) as n, count(distinct session_id) as s from ev group by event) t),
    'sessions', (select count(distinct session_id) from ev),
    'items', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                select item, category, event, count(*) as n, count(distinct session_id) as s, coalesce(sum(qty), 0) as qty
                from ev where item is not null group by item, category, event) t),
    'variants', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                select item, variant, count(*) as n, coalesce(sum(qty), 0) as qty
                from ev where event = 'add_to_cart' and variant is not null group by item, variant) t),
    'categories', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                select category, count(distinct session_id) as s
                from ev where event = 'category_view' and category is not null group by category) t),
    'searches', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                select lower(query) as query, count(*) as n, count(distinct session_id) as s
                from ev where event = 'search' and query is not null group by lower(query)
                order by count(*) desc limit 25) t),
    'devices', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                select coalesce(device, 'unbekannt') as device, count(distinct session_id) as s
                from ev group by coalesce(device, 'unbekannt')) t),
    'daily', (select coalesce(jsonb_agg(t order by t.day), '[]'::jsonb) from (
                select (created_at at time zone 'Europe/Berlin')::date as day, event, count(distinct session_id) as s
                from ev where event in ('page_view', 'add_to_cart', 'order_placed') group by 1, 2) t)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_menu_analytics(timestamptz, timestamptz) from public;
grant execute on function public.admin_menu_analytics(timestamptz, timestamptz) to authenticated;

-- ===== 0002_lock_down_orders.sql =====

-- Bestellungen absichern (Schritt 2) – erst NACH dem Merge des Admin-Dashboards anwenden,
-- weil ältere Code-Stände Bestellungen ohne Login lesen und ändern.
-- Danach: Kundendaten lesen/ändern nur noch Admins (Küche, Dashboard). Gäste legen Bestellungen an
-- und sehen ihre eigene Bestellung über eine Server-Funktion mit geheimem Gast-Schlüssel.

drop policy if exists "Anyone can read orders" on public.orders;
drop policy if exists "Anyone can update an order status" on public.orders;
drop policy if exists "Anyone can create an order" on public.orders;
drop policy if exists "Admins read orders" on public.orders;
drop policy if exists "Admins update orders" on public.orders;

-- Neue Bestellungen: nie als bezahlt, immer mit Status "bestätigt", ohne Stripe-Session.
create policy "Anyone can create an order" on public.orders
  for insert to anon, authenticated
  with check (paid = false and status = 'bestaetigt' and stripe_session_id is null);

create policy "Admins read orders" on public.orders
  for select to authenticated using (public.is_admin());

create policy "Admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke update on public.orders from anon;

-- ===== 0003_availability.sql =====

-- Ausverkauft & Bestellungen pausieren.
-- Lesen darf jeder (Speisekarte/Kasse zeigen es an), ändern nur Admins (Küche, Dashboard).
-- Ein Trigger auf public.orders lehnt neue Bestellungen ab, solange pausiert ist oder etwas
-- Ausverkauftes im Warenkorb liegt – die Anzeige im Browser allein reicht nicht.

create table if not exists public.shop_status (
  id smallint primary key default 1 check (id = 1),
  -- Pausiert, solange paused_until in der Zukunft liegt; "bis auf Weiteres" = 9999-12-31.
  paused_until timestamptz,
  pause_note text check (pause_note is null or char_length(pause_note) <= 160),
  updated_at timestamptz not null default now()
);
insert into public.shop_status (id) values (1) on conflict (id) do nothing;

-- Eine Zeile = ausverkauft. key: 'item:<Gericht>' oder 'option:<Auswahl>' (z. B. 'option:Oat Milk').
-- until: bis wann (z. B. Ende des Tages); null = bis jemand es wieder freigibt.
create table if not exists public.menu_availability (
  key text primary key check (key ~ '^(item|option):.+' and char_length(key) <= 120),
  until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.shop_status enable row level security;
alter table public.menu_availability enable row level security;

drop policy if exists "Anyone reads shop status" on public.shop_status;
drop policy if exists "Admins update shop status" on public.shop_status;
drop policy if exists "Anyone reads availability" on public.menu_availability;
drop policy if exists "Admins manage availability" on public.menu_availability;

create policy "Anyone reads shop status" on public.shop_status
  for select to anon, authenticated using (true);
create policy "Admins update shop status" on public.shop_status
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Anyone reads availability" on public.menu_availability
  for select to anon, authenticated using (true);
create policy "Admins manage availability" on public.menu_availability
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke insert, update, delete on public.shop_status, public.menu_availability from anon;
grant select on public.shop_status, public.menu_availability to anon, authenticated;
grant update on public.shop_status to authenticated;
grant insert, update, delete on public.menu_availability to authenticated;

create or replace function public.check_order_available()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  blocked text;
begin
  if exists (select 1 from public.shop_status where id = 1 and paused_until > now()) then
    raise exception 'ORDERS_PAUSED' using errcode = 'P0001';
  end if;

  select string_agg(distinct entry->'ref'->>'name', ', ') into blocked
  from jsonb_array_elements(case when jsonb_typeof(new.items) = 'array' then new.items else '[]'::jsonb end) as entry
  where exists (
    select 1 from public.menu_availability as a
    where (a.until is null or a.until > now())
      and a.key in (
        'item:' || (entry->'ref'->>'name'),
        'option:' || (entry->'ref'->>'option'),
        'option:' || (entry->'ref'->>'base')
      )
  );
  if blocked is not null then
    raise exception 'SOLD_OUT:%', blocked using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.check_order_available() from public, anon, authenticated;

drop trigger if exists orders_check_available on public.orders;
create trigger orders_check_available
  before insert on public.orders
  for each row execute function public.check_order_available();

-- Live: Speisekarte und Kasse sehen Änderungen sofort.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'shop_status') then
    alter publication supabase_realtime add table public.shop_status;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'menu_availability') then
    alter publication supabase_realtime add table public.menu_availability;
  end if;
end $$;

-- ===== 0004_admin_email_change.sql =====

-- Admin ändert die eigene E-Mail im Dashboard: Sobald Supabase Auth die Änderung bestätigt hat
-- (Link in der E-Mail), wird die Admin-Freigabe von der alten auf die neue Adresse übertragen.
-- Ohne das wäre man nach der Änderung ausgesperrt, weil public.is_admin() die E-Mail-Liste prüft.
-- Nur Adressen, die schon auf der Liste stehen, werden übertragen – niemand kann sich so selbst freischalten.

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
    insert into public.admin_emails (email) values (lower(new.email)) on conflict do nothing;
    delete from public.admin_emails where email = lower(old.email);
  end if;
  return new;
end;
$$;

revoke execute on function public.transfer_admin_email() from public, anon, authenticated;

drop trigger if exists on_auth_email_change_transfer_admin on auth.users;
create trigger on_auth_email_change_transfer_admin
  after update of email on auth.users
  for each row execute function public.transfer_admin_email();

-- ===== 0005_admin_accounts.sql =====

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

-- ===== 0006_team_roles.sql =====

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

-- ===== 0007_emails.sql =====

-- E-Mails über Resend: Bestellbestätigung an Gäste und Team-Mails (Einladung, Passwort, E-Mail-Wechsel).
-- Versand nur serverseitig mit Service-Rolle. Idempotent geschrieben, darf erneut ausgeführt werden.

-- 1) Bestellbestätigung genau einmal pro Bestellung (atomar per update … where … is null).
alter table public.orders add column if not exists confirmation_sent_at timestamptz;

-- 2) Protokoll für Team-Mails: Schutz vor Missbrauch ("Passwort vergessen" für fremde Adressen spammen).
create table if not exists public.auth_mail_log (
  id bigint generated always as identity primary key,
  email text not null check (email = lower(email)),
  kind text not null check (kind in ('invite', 'recovery', 'email_change')),
  sent_at timestamptz not null default now()
);
create index if not exists auth_mail_log_email_sent_idx on public.auth_mail_log (email, sent_at);
alter table public.auth_mail_log enable row level security; -- keine Policies: nur Service-Rolle
revoke all on public.auth_mail_log from anon, authenticated;
grant all on public.auth_mail_log to service_role;

-- ===== 0008_custom_bowl.sql =====

-- Eigene Bowl ("Bowl selbst bauen"): Der Trigger aus 0003 prüft zusätzlich jede gewählte Zutat.
-- Eine eigene Bowl liegt als ref { kind: 'custom', name, size, base, picks: { protein: [...], veggies: [...], ... } }
-- in orders.items; ausverkauft markiert wird jede Zutat wie bisher als 'option:<Zutat>'.
-- Idempotent geschrieben, darf erneut ausgeführt werden.

create or replace function public.check_order_available()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  blocked text;
begin
  if exists (select 1 from public.shop_status where id = 1 and paused_until > now()) then
    raise exception 'ORDERS_PAUSED' using errcode = 'P0001';
  end if;

  select string_agg(distinct entry->'ref'->>'name', ', ') into blocked
  from jsonb_array_elements(case when jsonb_typeof(new.items) = 'array' then new.items else '[]'::jsonb end) as entry
  where exists (
    select 1 from public.menu_availability as a
    where (a.until is null or a.until > now())
      and (
        a.key in (
          'item:' || (entry->'ref'->>'name'),
          'option:' || (entry->'ref'->>'option'),
          'option:' || (entry->'ref'->>'base')
        )
        -- Zutaten einer eigenen Bowl
        or exists (
          select 1
          from jsonb_each(case when jsonb_typeof(entry->'ref'->'picks') = 'object' then entry->'ref'->'picks' else '{}'::jsonb end) as step(id, picks),
               jsonb_array_elements_text(case when jsonb_typeof(step.picks) = 'array' then step.picks else '[]'::jsonb end) as pick(value)
          where a.key = 'option:' || pick.value
        )
      )
  );
  if blocked is not null then
    raise exception 'SOLD_OUT:%', blocked using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.check_order_available() from public, anon, authenticated;

-- ===== 0009_server_side_orders.sql =====

-- Bestellungen legt nur noch der Server an (Schritt 3).
--
-- REIHENFOLGE: erst NACH dem Veröffentlichen des Codes anwenden, der `placeOrder` nutzt
-- (src/utils/orders.functions.ts). Ältere Code-Stände schreiben Bestellungen direkt aus dem Browser
-- und könnten danach nichts mehr speichern – die Kasse wäre dann kaputt.
--
-- Danach gilt:
--   * Gäste (anon) haben auf public.orders gar keine Rechte mehr. Anlegen, Bezahlen und Statusabfrage
--     laufen über Server-Funktionen mit Service-Rolle, die Preise und Summen selbst berechnen.
--   * Das Team darf an Bestellungen nur den Status ändern – nicht "bezahlt", Betrag oder Positionen.
--   * Grants sind auf das Nötige gekürzt. Row Level Security bleibt die Regel, die Grants sind die
--     zweite Schutzschicht, falls einmal eine Policy fehlt oder zu weit gefasst ist.
-- Idempotent geschrieben, darf erneut ausgeführt werden.

-- 1) Bestellungen ----------------------------------------------------------------------------------
drop policy if exists "Anyone can create an order" on public.orders;

revoke all on public.orders from anon;
revoke all on public.orders from authenticated;
grant select on public.orders to authenticated;          -- wer was sieht, regelt "Admins read orders"
grant update (status) on public.orders to authenticated; -- wer ändern darf, regelt "Admins update orders"
grant all on public.orders to service_role;

-- Sicherheitsnetz für alles, was in die Tabelle kommt (auch über die Service-Rolle).
alter table public.orders drop constraint if exists orders_id_format;
alter table public.orders add constraint orders_id_format check (id ~ '^YJ-[0-9]{4,6}$');
alter table public.orders drop constraint if exists orders_payment_check;
alter table public.orders add constraint orders_payment_check check (payment in ('online', 'paypal', 'onsite'));
alter table public.orders drop constraint if exists orders_fulfillment_check;
alter table public.orders add constraint orders_fulfillment_check check (fulfillment in ('pickup', 'delivery'));
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('bestaetigt', 'zubereitung', 'abholbereit', 'abgeholt'));
alter table public.orders drop constraint if exists orders_amounts_check;
alter table public.orders add constraint orders_amounts_check check (total >= 0 and total <= 5000 and delivery_fee >= 0 and delivery_fee <= total);
alter table public.orders drop constraint if exists orders_shape_check;
alter table public.orders add constraint orders_shape_check check (jsonb_typeof(items) = 'array' and jsonb_typeof(contact) = 'object');

-- Für die Mengenbegrenzung in placeOrder ("wie viele Bestellungen in den letzten Minuten?") und das Dashboard.
create index if not exists orders_created_at_idx on public.orders (created_at);

-- 2) Übrige Tabellen: nur die Rechte, die die Website wirklich braucht -----------------------------
-- Der Server (Service-Rolle) braucht alle Tabellen – ausdrücklich vergeben, damit es nicht von den
-- Voreinstellungen eines neuen Supabase-Projekts abhängt.
grant all on public.orders, public.admin_emails, public.auth_mail_log, public.menu_events,
  public.shop_status, public.menu_availability to service_role;

-- Admin-Liste und Mail-Protokoll: ausschließlich Service-Rolle und die security-definer-Funktionen.
revoke all on public.admin_emails from anon, authenticated;
revoke all on public.auth_mail_log from anon, authenticated;

-- Statistik: Gäste schreiben nur, lesen darf das Team mit Statistik-Recht (Policy).
revoke all on public.menu_events from anon, authenticated;
grant insert on public.menu_events to anon, authenticated;
grant select on public.menu_events to authenticated;

-- Pause & Ausverkauft: jeder liest, das Team ändert (Policies).
revoke all on public.shop_status, public.menu_availability from anon, authenticated;
grant select on public.shop_status, public.menu_availability to anon, authenticated;
grant update on public.shop_status to authenticated;
grant insert, update, delete on public.menu_availability to authenticated;
