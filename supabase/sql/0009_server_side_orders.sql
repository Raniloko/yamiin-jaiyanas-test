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
