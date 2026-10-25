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
