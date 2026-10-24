import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/** Rechte der angemeldeten Person – die Datenbank setzt sie zusätzlich selbst durch (RLS). */
export type AdminAccess = { owner: boolean; stats: boolean };

export type AdminState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "recovery"; session: Session; invited?: boolean }
  | { status: "no-access"; session: Session }
  | { status: "admin"; session: Session; access: AdminAccess };

/**
 * Login-Zustand für interne Seiten (Dashboard, Küche).
 * Ob jemand Admin ist, entscheidet die Datenbank (`is_admin()`: bestätigte E-Mail auf der Admin-Liste) –
 * dieselbe Prüfung schützt auch die Daten selbst (Row Level Security). `my_access()` liefert zusätzlich,
 * ob die Person Inhaber ist und die Statistiken sehen darf.
 */
export function useAdminSession(): AdminState {
  const [state, setState] = useState<AdminState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const resolve = async (session: Session | null, recovery = false) => {
      if (!session) return active && setState({ status: "signed-out" });
      if (recovery) return active && setState({ status: "recovery", session });
      // Eingeladene legen beim ersten Öffnen des Links ihr Passwort fest.
      if (session.user.user_metadata?.["needs_password"] === true) return active && setState({ status: "recovery", session, invited: true });
      const { data, error } = await supabase.rpc("my_access");
      if (!active) return;
      const access = (data ?? {}) as { admin?: boolean; owner?: boolean; stats?: boolean };
      setState(!error && access.admin === true
        ? { status: "admin", session, access: { owner: access.owner === true, stats: access.stats === true } }
        : { status: "no-access", session });
    };
    void supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Rückkehr über den Link aus "Passwort vergessen": neues Passwort setzen lassen.
      void resolve(session, event === "PASSWORD_RECOVERY");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

const redirectTo = () => `${window.location.origin}${window.location.pathname}`;

export const adminAuth = {
  signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() }),
  /** Neues Passwort nach "Passwort vergessen" oder beim Annehmen einer Einladung. */
  updatePassword: (password: string) => supabase.auth.updateUser({ password, data: { needs_password: false } }),
  /** Passwort im Konto ändern – Supabase verlangt dafür das aktuelle Passwort ("Secure password change"). */
  changePassword: (currentPassword: string, password: string) => supabase.auth.updateUser({ password, current_password: currentPassword }),
  /** Alle Admin-Freigaben und Login-Konten (nur für Admins, sonst leer). */
  listAccounts: () => supabase.rpc("admin_accounts"),
  /** Nur Inhaber: Admin-Recht geben/entziehen und Statistik-Recht setzen (prüft die Datenbank). */
  setAccess: (email: string, admin: boolean, stats: boolean) => supabase.rpc("owner_set_access", { p_email: email, p_admin: admin, p_stats: stats }),
  /** Aktuelles Passwort prüfen, bevor E-Mail oder Passwort geändert werden. */
  verifyPassword: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  },
  /** Neue E-Mail: Supabase schickt Bestätigungslinks; erst danach gilt sie (Admin-Freigabe zieht die Datenbank mit). */
  changeEmail: (email: string) => supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/admin` }),
  signOut: () => supabase.auth.signOut(),
};
