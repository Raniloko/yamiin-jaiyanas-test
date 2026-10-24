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
