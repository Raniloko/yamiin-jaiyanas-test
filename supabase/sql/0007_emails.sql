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
