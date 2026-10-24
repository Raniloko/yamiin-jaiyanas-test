import { LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAuth, useAdminSession, type AdminState } from "@/lib/admin-auth";

type Mode = "signin" | "reset";

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-Mail oder Passwort stimmt nicht.",
  "Email not confirmed": "Bitte bestätige zuerst deine E-Mail – der Link liegt in deinem Postfach.",
};
const translate = (message: string) => MESSAGES[message] ?? message;

/** Zeigt die Kinder nur für angemeldete Admins, sonst Login bzw. "Kein Zugriff". */
export function AdminGate({ children, title }: { children: (state: Extract<AdminState, { status: "admin" }>) => ReactNode; title: string }) {
  const state = useAdminSession();
  if (state.status === "admin") return <>{children(state)}</>;
  return (
    <main className="admin-theme flex min-h-dvh items-center justify-center bg-background px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="size-16 grayscale" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Yamiin &amp; Jaiyana&rsquo;s · Intern</p>
          <h1 className="mt-2 text-3xl">{title}</h1>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
          {state.status === "loading" && (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Anmeldung wird geprüft …
            </p>
          )}
          {state.status === "signed-out" && <LoginForm />}
          {state.status === "recovery" && <NewPasswordForm email={state.session.user.email ?? ""} invited={state.invited === true} />}
          {state.status === "no-access" && (
            <div className="text-center">
              <LockKeyhole className="mx-auto size-8" />
              <p className="mt-4 font-semibold">Kein Zugriff</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {state.session.user.email} ist nicht als Admin freigeschaltet
                {state.session.user.email_confirmed_at ? "." : " oder die E-Mail ist noch nicht bestätigt."}
              </p>
              <Button variant="outline" className="mt-5 w-full rounded-full" onClick={() => void adminAuth.signOut()}>
                <LogOut className="size-4" /> Abmelden
              </Button>
            </div>
          )}
        </div>
        {/* Neuer Tab: In der Home-Bildschirm-App gibt es keine Zurück-Taste, die Website öffnet so in Safari. */}
        <a href="/" target="_blank" rel="noreferrer" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
          Zur Website ↗
        </a>
      </div>
    </main>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const address = email.trim().toLowerCase();
    if (mode === "reset") {
      try {
        await adminAuth.resetPassword(address);
        setInfo("Wenn es ein Konto gibt, ist ein Link zum Zurücksetzen unterwegs. Schau in dein Postfach.");
      } catch {
        setError("Das hat nicht geklappt. Bitte prüfe die E-Mail-Adresse und deine Internetverbindung.");
      }
    } else {
      const { error } = await adminAuth.signIn(address, password);
      if (error) setError(translate(error.message));
    }
    setBusy(false);
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      {mode === "reset" && <p className="text-sm text-muted-foreground">Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p>}
      <div className="space-y-1.5">
        <Label htmlFor="admin-email">E-Mail</Label>
        <Input id="admin-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 bg-background" />
      </div>
      {mode !== "reset" && (
        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Passwort</Label>
          <Input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 bg-background" />
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {info && <p role="status" className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground">{info}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">
        {busy && <LoaderCircle className="size-4 animate-spin" />}
        {mode === "signin" ? "Anmelden" : "Link senden"}
      </Button>
      <button type="button" onClick={() => { setMode(mode === "reset" ? "signin" : "reset"); setError(""); setInfo(""); }} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
        {mode === "reset" ? "Zurück zur Anmeldung" : "Passwort vergessen?"}
      </button>
      {mode === "signin" && <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">Noch kein Zugang? Konten gibt es nur per Einladung vom Inhaber.</p>}
    </form>
  );
}

function NewPasswordForm({ email, invited }: { email: string; invited?: boolean }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await adminAuth.updatePassword(password);
    if (error) setError(translate(error.message));
    setBusy(false);
  };
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      {invited ? (
        <div>
          <p className="font-semibold">Willkommen im Team!</p>
          <p className="mt-1 text-sm text-muted-foreground">Lege ein Passwort für <strong className="text-foreground">{email}</strong> fest. Damit meldest du dich künftig im Dashboard und in der Küche an.</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Lege ein neues Passwort fest.</p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="admin-new-password">Neues Passwort</Label>
        <Input id="admin-new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 bg-background" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">Passwort speichern</Button>
    </form>
  );
}
