import { BarChart3, Crown, LoaderCircle, Send, ShieldCheck, ShieldOff, ShieldPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { adminAuth } from "@/lib/admin-auth";
import { inviteTeamMember } from "@/utils/team.functions";

type Account = {
  email: string;
  is_admin: boolean;
  role: string | null;
  can_view_stats: boolean;
  has_account: boolean;
  confirmed: boolean;
  last_sign_in_at: string | null;
  created_at: string | null;
};
type Notice = { kind: "ok" | "error"; text: string } | null;

const MESSAGES: Record<string, string> = {
  "Email rate limit exceeded": "Gerade wurden zu viele E-Mails verschickt. Bitte in ein paar Minuten nochmal versuchen.",
  "email rate limit exceeded": "Gerade wurden zu viele E-Mails verschickt. Bitte in ein paar Minuten nochmal versuchen.",
  "Failed to fetch": "Keine Verbindung – bitte nochmal versuchen.",
};
const translate = (message: string) => MESSAGES[message] ?? message;
const when = (value: string | null) => (value ? new Date(value).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "noch nie");

/** "Team & Rechte" (nur Inhaber): einladen, Admin-Recht geben/entziehen, Statistik-Recht setzen. */
export function TeamButton({ email, variant = "icon" }: { email: string; variant?: "icon" | "nav" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "icon" ? (
        <button type="button" aria-label="Team & Rechte" onClick={() => setOpen(true)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card"><Users className="size-4" /></button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-foreground/70 hover:bg-muted hover:text-foreground"><Users className="size-4" />Team &amp; Rechte</button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="admin-theme w-full overflow-y-auto bg-background p-0 sm:max-w-md [&>button]:top-[max(1rem,env(safe-area-inset-top))]">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-left">
            <SheetTitle className="text-2xl">Team &amp; Rechte</SheetTitle>
            <SheetDescription>Wer ins Dashboard und in die Küche darf – und wer Umsatz &amp; Statistiken sieht.</SheetDescription>
          </SheetHeader>
          {open && <TeamPanel email={email} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function TeamPanel({ email }: { email: string }) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async () => {
    const { data, error } = await adminAuth.listAccounts();
    if (error) setError(error.message);
    else setAccounts((data ?? []) as Account[]);
  }, []);
  useEffect(() => void load(), [load]);

  const setAccess = async (entry: Account, admin: boolean, stats: boolean, done: string) => {
    setBusy(entry.email);
    setNotice(null);
    const { error } = await adminAuth.setAccess(entry.email, admin, stats);
    if (error) setNotice({ kind: "error", text: error.message });
    else setNotice({ kind: "ok", text: done });
    await load();
    setBusy(null);
  };

  const resend = async (entry: Account) => {
    setBusy(entry.email);
    setNotice(null);
    try {
      const result = await inviteTeamMember({ data: { email: entry.email, stats: entry.can_view_stats } });
      setNotice("error" in result ? { kind: "error", text: translate(result.error) } : { kind: "ok", text: `Einladung an ${entry.email} erneut gesendet.` });
    } catch (cause) {
      setNotice({ kind: "error", text: cause instanceof Error ? translate(cause.message) : "Einladung fehlgeschlagen." });
    }
    await load();
    setBusy(null);
  };

  const team = accounts?.filter((entry) => entry.is_admin) ?? [];
  const others = accounts?.filter((entry) => !entry.is_admin && entry.has_account) ?? [];
  const me = email.toLowerCase();

  return (
    <div className="space-y-8 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
      <InviteForm onDone={load} />

      <section className="border-t border-border pt-8">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><ShieldCheck className="size-4" />Mit Zugang</h3>
        {error && <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">Konnte nicht geladen werden: {error}</p>}
        {!accounts && !error && <p className="mt-3 text-sm text-muted-foreground">Wird geladen …</p>}
        {notice && (
          <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-3 rounded-xl px-3 py-2 text-sm ${notice.kind === "error" ? "bg-destructive/10 text-destructive" : "border border-border bg-muted text-foreground"}`}>{notice.text}</p>
        )}
        <ul className="mt-2 divide-y divide-border">
          {team.map((entry) => {
            const owner = entry.role === "owner";
            const pending = !entry.has_account || !entry.confirmed;
            const working = busy === entry.email;
            return (
              <li key={entry.email} className="py-3.5">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${pending ? "bg-[#fab219]" : "bg-[#087508]"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <span className="truncate">{entry.email}</span>
                      {entry.email === me && <span className="shrink-0 font-normal text-muted-foreground">(du)</span>}
                      {owner && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground"><Crown className="size-3" />Inhaber</span>}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {!entry.has_account ? "Eingeladen – Konto noch nicht angelegt" : !entry.confirmed ? "Eingeladen – Link noch nicht geöffnet" : `Zuletzt angemeldet: ${when(entry.last_sign_in_at)}`}
                    </span>
                  </span>
                  {working && <LoaderCircle className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" />}
                </div>
                {owner ? (
                  <p className="ml-5 mt-2 text-xs text-muted-foreground">Alle Rechte, inklusive Team verwalten.</p>
                ) : (
                  <div className="ml-5 mt-3 space-y-2">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2"><BarChart3 className="size-4 text-muted-foreground" />Umsatz, Statistiken &amp; Kunden</span>
                      <Switch checked={entry.can_view_stats} disabled={working} aria-label={`Statistiken für ${entry.email}`}
                        onCheckedChange={(checked) => void setAccess(entry, true, checked, checked ? `${entry.email} sieht jetzt Umsatz, Statistiken und Kunden.` : `${entry.email} sieht keine Statistiken mehr.`)} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {pending && (
                        <Button type="button" variant="outline" size="sm" disabled={working} onClick={() => void resend(entry)} className="rounded-full"><Send className="size-3.5" />Einladung erneut senden</Button>
                      )}
                      <Button type="button" variant="outline" size="sm" disabled={working} className="rounded-full text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`${entry.email} den Zugang zu Dashboard und Küche entziehen?`)) void setAccess(entry, false, false, `${entry.email} hat keinen Zugang mehr.`);
                        }}>
                        <ShieldOff className="size-3.5" />Zugang entziehen
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {others.length > 0 && (
        <section className="border-t border-border pt-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Konten ohne Zugang ({others.length})</h3>
          <ul className="mt-2 divide-y divide-border">
            {others.map((entry) => (
              <li key={entry.email} className="flex items-center gap-3 py-3">
                <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{entry.email}</span>
                  <span className="block text-xs text-muted-foreground">Zuletzt angemeldet: {when(entry.last_sign_in_at)}</span>
                </span>
                <Button type="button" variant="outline" size="sm" disabled={busy === entry.email} onClick={() => void setAccess(entry, true, false, `${entry.email} hat wieder Zugang (ohne Statistiken).`)} className="shrink-0 rounded-full">
                  <ShieldPlus className="size-3.5" />Zugang geben
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
        Neue Konten entstehen nur über eine Einladung von dir – auf der Login-Seite kann sich niemand selbst registrieren. Mit Zugang sieht man Bestellungen, Küche und Ausverkauft-Schalter; ohne Statistik-Recht nur die Bestellungen der letzten 7 Tage.
      </p>
    </div>
  );
}

function InviteForm({ onDone }: { onDone: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return setNotice({ kind: "error", text: "Bitte gib eine gültige E-Mail-Adresse ein." });
    setBusy(true);
    try {
      const result = await inviteTeamMember({ data: { email: address, stats } });
      if ("error" in result) setNotice({ kind: "error", text: translate(result.error) });
      else {
        setEmail("");
        setStats(false);
        setNotice({
          kind: "ok",
          text: result.status === "invited"
            ? `Einladung an ${address} gesendet. Über den Link legt die Person ihr Passwort fest und ist dann direkt drin.`
            : `${address} hat schon ein Konto und kann sich ab sofort anmelden.`,
        });
      }
    } catch (cause) {
      setNotice({ kind: "error", text: cause instanceof Error ? translate(cause.message) : "Einladung fehlgeschlagen." });
    }
    await onDone();
    setBusy(false);
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><Send className="size-4" />Per E-Mail einladen</h3>
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">E-Mail</Label>
        <Input id="invite-email" type="email" autoComplete="off" required placeholder="name@beispiel.de" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 bg-background" />
      </div>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
        <span>
          <span className="block font-semibold">Darf Statistiken sehen</span>
          <span className="block text-xs text-muted-foreground">Umsatz, Produkte, Speisekarte &amp; Kunden</span>
        </span>
        <Switch checked={stats} onCheckedChange={setStats} aria-label="Darf Statistiken sehen" />
      </label>
      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm ${notice.kind === "error" ? "bg-destructive/10 text-destructive" : "border border-border bg-muted text-foreground"}`}>{notice.text}</p>
      )}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">{busy && <LoaderCircle className="size-4 animate-spin" />}Einladung senden</Button>
    </form>
  );
}
