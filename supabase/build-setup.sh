#!/usr/bin/env sh
# Setzt supabase/setup.sql aus supabase/sql/0*.sql zusammen. Nach jeder Änderung an einer SQL-Datei ausführen:
#   sh supabase/build-setup.sh
set -eu
cd "$(dirname "$0")"
{
  cat <<'EOF'
-- Datenbank für ein NEUES Supabase-Projekt einrichten (Umzug von Lovable Cloud zu eigenem Supabase).
-- In Supabase: SQL Editor → New query → diesen ganzen Inhalt einfügen → Run.
--
-- Erzeugt von supabase/build-setup.sh aus supabase/sql/0000 bis 0009 – nicht von Hand ändern, sondern die
-- Einzeldateien ändern und das Skript neu ausführen. Jede Datei ist idempotent, das Ganze darf zweimal laufen.
--
-- Danach: Authentication → Users → Add user → deine Inhaber-E-Mail mit Passwort und "Auto Confirm User".
-- Nur E-Mails auf der Freigabeliste (public.admin_emails) dürfen Konten haben; dein Inhaber-Eintrag
-- wird unten in 0001/0006 angelegt. Weitere Teammitglieder lädst du danach im Dashboard ein.
EOF
  for file in sql/0*.sql; do
    printf '\n-- ===== %s =====\n\n' "${file##*/}"
    cat "$file"
  done
} > setup.sql
