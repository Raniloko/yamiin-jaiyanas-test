import { LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAuth, useAdminSession, type AdminState } from "@/lib/admin-auth";

type Mode = "signin" | "signup" | "reset";

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-Mail oder Passwort stimmt nicht.",
  "Email not confirmed": "Bitte bestätige zuerst deine E-Mail – der Link liegt in deinem Postfach.",
  "User already registered": "Für diese E-Mail gibt es schon ein Konto. Bitte melde dich an.",
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
          {state.status === "recovery" && <NewPasswordForm />}
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
      const { error } = await adminAuth.resetPassword(address);
      if (error) setError(translate(error.message));
      else setInfo("Wenn es ein Konto gibt, ist ein Link zum Zurücksetzen unterwegs. Schau in dein Postfach.");
    } else if (mode === "signup") {
      const { data, error } = await adminAuth.signUp(address, password);
      if (error) setError(translate(error.message));
      else if (!data.session) setInfo("Fast geschafft: Bitte bestätige deine E-Mail über den Link in deinem Postfach und melde dich dann an.");
    } else {
      const { error } = await adminAuth.signIn(address, password);
      if (error) setError(translate(error.message));
    }
    setBusy(false);
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div role="tablist" className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => { setMode(value); setError(""); setInfo(""); }}
            className={`rounded-full py-2 transition-colors ${mode === value ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {value === "signin" ? "Anmelden" : "Konto anlegen"}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-email">E-Mail</Label>
        <Input id="admin-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 bg-background" />
      </div>
      {mode !== "reset" && (
        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Passwort</Label>
          <Input id="admin-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 bg-background" />
          {mode === "signup" && <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen. Zugang gibt es nur für freigeschaltete E-Mails.</p>}
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {info && <p role="status" className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground">{info}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">
        {busy && <LoaderCircle className="size-4 animate-spin" />}
        {mode === "signin" ? "Anmelden" : mode === "signup" ? "Konto anlegen" : "Link senden"}
      </Button>
      <button type="button" onClick={() => { setMode(mode === "reset" ? "signin" : "reset"); setError(""); setInfo(""); }} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
        {mode === "reset" ? "Zurück zur Anmeldung" : "Passwort vergessen?"}
      </button>
    </form>
  );
}

function NewPasswordForm() {
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
      <p className="text-sm text-muted-foreground">Lege ein neues Passwort fest.</p>
      <div className="space-y-1.5">
        <Label htmlFor="admin-new-password">Neues Passwort</Label>
        <Input id="admin-new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 bg-background" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">Passwort speichern</Button>
    </form>
  );
}
