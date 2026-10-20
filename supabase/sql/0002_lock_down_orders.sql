-- Bestellungen absichern (Schritt 2) – erst NACH dem Merge des Admin-Dashboards anwenden,
-- weil ältere Code-Stände Bestellungen ohne Login lesen und ändern.
-- Danach: Kundendaten lesen/ändern nur noch Admins (Küche, Dashboard). Gäste legen Bestellungen an
-- und sehen ihre eigene Bestellung über eine Server-Funktion mit geheimem Gast-Schlüssel.

drop policy if exists "Anyone can read orders" on public.orders;
drop policy if exists "Anyone can update an order status" on public.orders;
drop policy if exists "Anyone can create an order" on public.orders;

-- Neue Bestellungen: nie als bezahlt, immer mit Status "bestätigt", ohne Stripe-Session.
create policy "Anyone can create an order" on public.orders
  for insert to anon, authenticated
  with check (paid = false and status = 'bestaetigt' and stripe_session_id is null);

create policy "Admins read orders" on public.orders
  for select to authenticated using (public.is_admin());

create policy "Admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke update on public.orders from anon;
