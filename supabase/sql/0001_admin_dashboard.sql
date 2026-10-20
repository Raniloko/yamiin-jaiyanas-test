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
