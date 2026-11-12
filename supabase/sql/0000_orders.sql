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
