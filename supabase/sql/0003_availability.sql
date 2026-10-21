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
