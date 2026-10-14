create table public.orders (
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
  status text not null default 'bestaetigt'
);

-- Guest checkout: no login, so anon may insert and read its orders.
grant select, insert, update on public.orders to anon, authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "Anyone can create an order"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read orders"
  on public.orders for select
  to anon, authenticated
  using (true);

create policy "Anyone can update an order status"
  on public.orders for update
  to anon, authenticated
  using (true)
  with check (true);

-- Live status: guests and the kitchen view get instant updates.
alter publication supabase_realtime add table public.orders;
