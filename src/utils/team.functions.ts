import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type InviteResult = { status: "invited" | "granted" } | { error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Neue Team-Konten gibt es nur per Einladung durch den Inhaber.
// Die Freigabe setzt die Datenbank selbst (owner_set_access prüft is_owner() mit dem Login des Inhabers);
// erst danach lässt der Trigger auf auth.users das neue Konto zu, das die Einladung anlegt.
export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; stats: boolean }) => {
    const email = typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email) || email.length > 200) throw new Error("Ungültige E-Mail-Adresse");
    return { email, stats: data.stats === true };
  })
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

    const request = getRequest();
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${origin}/admin`,
      data: { needs_password: true },
    });
    if (error) {
      // Freigabe nicht stehen lassen, wenn die Einladung für eine neue Adresse scheitert.
      if (!known?.is_admin) await context.supabase.rpc("owner_set_access", { p_email: data.email, p_admin: false, p_stats: false });
      return { error: error.message };
    }
    return { status: "invited" };
  });
