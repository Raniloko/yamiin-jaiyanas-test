import { Eye, EyeOff, KeyRound, LoaderCircle, Mail, UserCog } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminAuth } from "@/lib/admin-auth";

const MESSAGES: Record<string, string> = {
  "New password should be different from the old password.": "Das neue Passwort muss sich vom alten unterscheiden.",
  "A user with this email address has already been registered": "Für diese E-Mail gibt es schon ein Konto.",
  "Email address is invalid": "Diese E-Mail-Adresse ist ungültig.",
  "Password should be at least 6 characters.": "Das Passwort ist zu kurz.",
  "Current password required when setting new password.": "Bitte gib dein aktuelles Passwort ein.",
  "Invalid current password": "Das aktuelle Passwort stimmt nicht.",
};
const translate = (message: string) => MESSAGES[message] ?? message;

type Notice = { kind: "ok" | "error"; text: string } | null;

/** "Konto": eigene E-Mail und Passwort ändern – jeweils mit dem aktuellen Passwort bestätigt. */
export function AccountButton({ email, variant = "icon" }: { email: string; variant?: "icon" | "nav" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "icon" ? (
        <button type="button" aria-label="Konto & Sicherheit" onClick={() => setOpen(true)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card"><UserCog className="size-4" /></button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-foreground/70 hover:bg-muted hover:text-foreground"><UserCog className="size-4" />Konto &amp; Sicherheit</button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="admin-theme w-full overflow-y-auto bg-background p-0 sm:max-w-md [&>button]:top-[max(1rem,env(safe-area-inset-top))]">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-left">
            <SheetTitle className="text-2xl">Konto &amp; Sicherheit</SheetTitle>
            <SheetDescription>Angemeldet als <strong className="text-foreground">{email}</strong></SheetDescription>
          </SheetHeader>
          <div className="space-y-8 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
            <PasswordForm email={email} />
            <EmailForm email={email} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, hint }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 bg-background pr-11" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"} className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p role={notice.kind === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm ${notice.kind === "error" ? "bg-destructive/10 text-destructive" : "border border-border bg-muted text-foreground"}`}>
      {notice.text}
    </p>
  );
}

function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (next.length < 8) return setNotice({ kind: "error", text: "Das neue Passwort braucht mindestens 8 Zeichen." });
    if (next !== repeat) return setNotice({ kind: "error", text: "Die beiden neuen Passwörter stimmen nicht überein." });
    setBusy(true);
    if (!(await adminAuth.verifyPassword(email, current))) {
      setBusy(false);
      return setNotice({ kind: "error", text: "Das aktuelle Passwort stimmt nicht." });
    }
    const { error } = await adminAuth.changePassword(current, next);
    setBusy(false);
    if (error) return setNotice({ kind: "error", text: translate(error.message) });
    setCurrent("");
    setNext("");
    setRepeat("");
    setNotice({ kind: "ok", text: "Passwort geändert. Ab sofort meldest du dich mit dem neuen Passwort an – auch in der Küchen-App." });
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><KeyRound className="size-4" />Passwort ändern</h3>
      <PasswordField id="pw-current" label="Aktuelles Passwort" value={current} onChange={setCurrent} autoComplete="current-password" />
      <PasswordField id="pw-new" label="Neues Passwort" value={next} onChange={setNext} autoComplete="new-password" hint="Mindestens 8 Zeichen." />
      <PasswordField id="pw-repeat" label="Neues Passwort wiederholen" value={repeat} onChange={setRepeat} autoComplete="new-password" />
      <NoticeBox notice={notice} />
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">{busy && <LoaderCircle className="size-4 animate-spin" />}Passwort speichern</Button>
    </form>
  );
}

function EmailForm({ email }: { email: string }) {
  const [nextEmail, setNextEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    const address = nextEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return setNotice({ kind: "error", text: "Bitte gib eine gültige E-Mail-Adresse ein." });
    if (address === email.toLowerCase()) return setNotice({ kind: "error", text: "Das ist bereits deine aktuelle E-Mail." });
    setBusy(true);
    let result: Awaited<ReturnType<typeof adminAuth.changeEmail>>;
    try {
      result = await adminAuth.changeEmail(address, password);
    } catch {
      setBusy(false);
      return setNotice({ kind: "error", text: "Das hat nicht geklappt. Bitte prüfe deine Internetverbindung." });
    }
    setBusy(false);
    if ("error" in result) return setNotice({ kind: "error", text: translate(result.error) });
    setPassword("");
    setNotice({
      kind: "ok",
      text: result.both
        ? `Fast geschafft: Bitte bestätige den Wechsel über die Links, die wir an ${address} und an ${email} geschickt haben. Bis dahin bleibt ${email} gültig – danach zieht dein Admin-Zugang automatisch mit.`
        : `Fast geschafft: Bitte bestätige ${address} über den Link in der E-Mail. Bis dahin bleibt ${email} gültig – danach zieht dein Admin-Zugang automatisch mit.`,
    });
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4 border-t border-border pt-8">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><Mail className="size-4" />E-Mail ändern</h3>
      <div className="space-y-1.5">
        <Label htmlFor="mail-new">Neue E-Mail</Label>
        <Input id="mail-new" type="email" autoComplete="email" required value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} className="h-11 bg-background" />
      </div>
      <PasswordField id="mail-pw" label="Passwort zur Bestätigung" value={password} onChange={setPassword} autoComplete="current-password" />
      <NoticeBox notice={notice} />
      <Button type="submit" variant="outline" disabled={busy} className="h-11 w-full rounded-full">{busy && <LoaderCircle className="size-4 animate-spin" />}Bestätigungslink senden</Button>
    </form>
  );
}
