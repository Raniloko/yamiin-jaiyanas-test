import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type InviteResult = { status: "invited" | "granted" } | { error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOO_MANY = "Gerade wurden zu viele E-Mails an diese Adresse verschickt. Bitte in einer Stunde nochmal versuchen.";

const cleanEmail = (value: unknown) => {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 200) throw new Error("Ungültige E-Mail-Adresse");
  return email;
};

// Alle Team-Mails (Einladung, Passwort, E-Mail-Wechsel) erzeugt der Server selbst: Supabase liefert nur den Link
// (generateLink verschickt nichts), die Mail im Look der Website geht über Resend raus.

// Neue Team-Konten gibt es nur per Einladung durch den Inhaber.
// Die Freigabe setzt die Datenbank selbst (owner_set_access prüft is_owner() mit dem Login des Inhabers);
// erst danach lässt der Trigger auf auth.users das neue Konto zu, das die Einladung anlegt.
export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; stats: boolean }) => ({ email: cleanEmail(data?.email), stats: data?.stats === true }))
  .handler(async ({ data, context }): Promise<InviteResult> => {
    const { data: owner } = await context.supabase.rpc("is_owner");
    if (owner !== true) return { error: "Nur der Inhaber kann einladen." };

    const { data: before } = await context.supabase.rpc("admin_accounts");
    const known = (before ?? []).find((entry) => entry.email === data.email);
    if (known?.role === "owner") return { error: "Das ist ein Inhaber-Zugang." };

    const { error: grantError } = await context.supabase.rpc("owner_set_access", { p_email: data.email, p_admin: true, p_stats: data.stats });
    if (grantError) return { error: grantError.message };
    // Wer schon ein bestätigtes Konto hat, braucht keine neue Einladung – die Freigabe reicht.
    if (known?.has_account && known.confirmed) return { status: "granted" };

    const revert = async () => {
      // Freigabe nicht stehen lassen, wenn die Einladung für eine neue Adresse scheitert.
      if (!known?.is_admin) await context.supabase.rpc("owner_set_access", { p_email: data.email, p_admin: false, p_stats: false });
    };
    const { allowAuthMail, appOrigin } = await import("@/lib/mailer.server");
    if (!(await allowAuthMail(data.email, "invite"))) {
      await revert();
      return { error: TOO_MANY };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: data.email,
      options: { redirectTo: `${appOrigin(getRequest())}/admin`, data: { needs_password: true } },
    });
    if (error || !link.properties?.action_link) {
      await revert();
      return { error: error?.message ?? "Einladungslink konnte nicht erstellt werden." };
    }
    const [{ sendEmail }, { teamInviteEmail }] = await Promise.all([import("@/lib/email.server"), import("@/lib/email-templates")]);
    const sent = await sendEmail("team", teamInviteEmail(data.email, link.properties.action_link, data.stats));
    if (!sent.ok) {
      await revert();
      return { error: sent.error };
    }
    return { status: "invited" };
  });

// "Passwort vergessen" auf der Login-Seite. Antwortet immer gleich, damit niemand herausfinden kann,
// welche Adressen ein Konto haben; Mails gehen nur an freigeschaltete Team-Adressen.
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; page: "admin" | "kitchen" }) => ({ email: cleanEmail(data?.email), page: data?.page === "kitchen" ? "kitchen" : "admin" }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: entry } = await supabaseAdmin.from("admin_emails").select("email").eq("email", data.email).maybeSingle();
    if (!entry) return { ok: true };
    const { allowAuthMail, appOrigin } = await import("@/lib/mailer.server");
    if (!(await allowAuthMail(data.email, "recovery"))) return { ok: true };
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: `${appOrigin(getRequest())}/${data.page}` },
    });
    // Kein Konto (nur Freigabe) → generateLink scheitert, die Antwort bleibt trotzdem dieselbe.
    if (error || !link.properties?.action_link) return { ok: true };
    const [{ sendEmail }, { passwordResetEmail }] = await Promise.all([import("@/lib/email.server"), import("@/lib/email-templates")]);
    await sendEmail("team", passwordResetEmail(data.email, link.properties.action_link));
    return { ok: true };
  });

// Eigene E-Mail ändern ("Konto & Sicherheit"): aktuelles Passwort wird hier auf dem Server geprüft,
// dann gehen Bestätigungslinks an die neue und – bei "Secure email change" – auch an die bisherige Adresse.
export const requestEmailChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; password: string }) => {
    if (typeof data?.password !== "string" || data.password.length < 1 || data.password.length > 200) throw new Error("Passwort fehlt");
    return { email: cleanEmail(data.email), password: data.password };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; both: boolean } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const current = me.user?.email?.toLowerCase();
    if (!current) return { error: "Konto nicht gefunden." };
    if (current === data.email) return { error: "Das ist bereits deine aktuelle E-Mail." };

    const { error: wrong } = await context.supabase.auth.signInWithPassword({ email: current, password: data.password });
    if (wrong) return { error: "Das Passwort stimmt nicht." };

    const { allowAuthMail, appOrigin } = await import("@/lib/mailer.server");
    if (!(await allowAuthMail(current, "email_change"))) return { error: TOO_MANY };
    const redirectTo = `${appOrigin(getRequest())}/admin`;
    const next = await supabaseAdmin.auth.admin.generateLink({ type: "email_change_new", email: current, newEmail: data.email, options: { redirectTo } });
    if (next.error || !next.data.properties?.action_link) {
      const taken = next.error?.message.includes("already been registered");
      return { error: taken ? "Für diese E-Mail gibt es schon ein Konto." : (next.error?.message ?? "Link konnte nicht erstellt werden.") };
    }
    // Nur mit "Secure email change" muss auch die bisherige Adresse bestätigen – sonst lehnt Supabase diesen Link ab.
    const old = await supabaseAdmin.auth.admin.generateLink({ type: "email_change_current", email: current, newEmail: data.email, options: { redirectTo } });

    const [{ sendEmail }, { emailChangeEmail }] = await Promise.all([import("@/lib/email.server"), import("@/lib/email-templates")]);
    const change = { from: current, to: data.email };
    const sent = await sendEmail("team", emailChangeEmail(data.email, next.data.properties.action_link, change, "new"));
    if (!sent.ok) return { error: sent.error };
    const oldLink = old.error ? undefined : old.data.properties?.action_link;
    if (oldLink) await sendEmail("team", emailChangeEmail(current, oldLink, change, "current"));
    return { ok: true, both: Boolean(oldLink) };
  });
