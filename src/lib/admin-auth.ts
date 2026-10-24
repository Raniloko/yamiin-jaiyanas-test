import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AdminState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "recovery"; session: Session }
  | { status: "no-access"; session: Session }
  | { status: "admin"; session: Session };

/**
 * Login-Zustand für interne Seiten (Dashboard, Küche).
 * Ob jemand Admin ist, entscheidet die Datenbank (`is_admin()`: bestätigte E-Mail auf der Admin-Liste) –
 * dieselbe Prüfung schützt auch die Daten selbst (Row Level Security).
 */
export function useAdminSession(): AdminState {
  const [state, setState] = useState<AdminState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const resolve = async (session: Session | null, recovery = false) => {
      if (!session) return active && setState({ status: "signed-out" });
      if (recovery) return active && setState({ status: "recovery", session });
      const { data, error } = await supabase.rpc("is_admin");
      if (!active) return;
      setState(!error && data === true ? { status: "admin", session } : { status: "no-access", session });
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
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } }),
  resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() }),
  updatePassword: (password: string) => supabase.auth.updateUser({ password }),
  /** Passwort im Konto ändern – Supabase verlangt dafür das aktuelle Passwort ("Secure password change"). */
  changePassword: (currentPassword: string, password: string) => supabase.auth.updateUser({ password, current_password: currentPassword }),
  /** Alle Admin-Freigaben und Login-Konten (nur für Admins, sonst leer). */
  listAccounts: () => supabase.rpc("admin_accounts"),
  /** Aktuelles Passwort prüfen, bevor E-Mail oder Passwort geändert werden. */
  verifyPassword: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  },
  /** Neue E-Mail: Supabase schickt Bestätigungslinks; erst danach gilt sie (Admin-Freigabe zieht die Datenbank mit). */
  changeEmail: (email: string) => supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/admin` }),
  signOut: () => supabase.auth.signOut(),
};
