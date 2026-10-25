// Angaben für Impressum, Datenschutzerklärung und AGB, die nur der Inhaber kennt.
// Pro Feld: string = Angabe, false = trifft nicht zu (Zeile entfällt), null = noch offen.
// Offene Felder erscheinen auf den Seiten als deutlich markierter Platzhalter – solange etwas
// offen ist, darf die Seite nicht veröffentlicht werden (siehe isLegalComplete()).

export type LegalField = string | false | null;

export const LEGAL = {
  /** Stand der Texte (wird auf den Seiten angezeigt). */
  updated: "25.10.2026",

  // ===== Impressum (§ 5 Abs. 1 DDG) =====
  /** Nr. 1: Name der Inhaberin/des Inhabers bzw. Firma, unter der der Laden betrieben wird. */
  owner: null as LegalField,
  /** Nr. 1: Nur bei juristischen Personen (z. B. GmbH): Rechtsform, sonst false. */
  legalForm: null as LegalField,
  /** Nr. 1: Nur bei juristischen Personen: Vertretungsberechtigte (z. B. Geschäftsführer), sonst false. */
  representatives: null as LegalField,
  /** Nr. 4: Handelsregister/ähnliches Register mit Registernummer (z. B. "Amtsgericht Hanau, HRA 1234"), sonst false. */
  register: null as LegalField,
  /** Nr. 6: Umsatzsteuer-Identifikationsnummer bzw. Wirtschafts-Identifikationsnummer, falls vorhanden, sonst false. */
  vatId: null as LegalField,
  /** Nr. 3: Zuständige Aufsichtsbehörde, nur wenn die Tätigkeit eine behördliche Zulassung braucht, sonst false. */
  supervisoryAuthority: null as LegalField,

  // ===== Verbraucherstreitbeilegung (§ 36 VSBG) =====
  /**
   * false = nicht bereit und nicht verpflichtet, an Verfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
   * Sonst: Name, Anschrift und Webseite der Schlichtungsstelle (§ 36 Abs. 1 Nr. 2 VSBG).
   * Hinweis: Wer am 31.12. des Vorjahres höchstens 10 Personen beschäftigt hat, ist von der Angabe nach
   * Abs. 1 Nr. 1 befreit (§ 36 Abs. 3 VSBG); die Erklärung schadet aber nicht.
   */
  consumerArbitration: null as LegalField,

  // ===== Datenschutz (Art. 13 DSGVO) =====
  /** Art. 13 Abs. 1 lit. b: Kontakt der/des Datenschutzbeauftragten, falls benannt, sonst false. */
  dataProtectionOfficer: null as LegalField,
  /**
   * Art. 13 Abs. 1 lit. e/f: Hosting der Website (Lovable): Firmenname, Sitz und – falls Daten in ein Land
   * außerhalb der EU gehen – Angemessenheitsbeschluss oder Garantien (aus dem Vertrag/AVV mit Lovable).
   */
  hostingProvider: null as LegalField,
  /** Art. 13 Abs. 2 lit. a: Wie lange der Hosting-Anbieter Server-Protokolle (IP-Adressen) speichert. */
  hostingLogRetention: null as LegalField,
  /**
   * Besucherstatistik des Hosting-Anbieters (Lovable fügt auf der Live-Seite ein Statistik-Skript ein):
   * welche Daten sie erfasst und ob sie etwas auf dem Gerät speichert. false = abgeschaltet.
   */
  hostingAnalytics: null as LegalField,
  /** Datenbank für Bestellungen (Lovable Cloud): Anbieter, Sitz, Serverstandort, ggf. Drittlandgarantien. */
  databaseProvider: null as LegalField,
  /** Versand der Bestellbestätigung (Resend über Lovable): Anbieter, Sitz, ggf. Drittlandgarantien. */
  emailProvider: null as LegalField,
  /** Online-Zahlung (Stripe): Vertragspartner laut Stripe-Konto, Sitz, ggf. Drittlandgarantien. */
  paymentProvider: null as LegalField,
  /** Wie lange die anonyme Speisekarten-Statistik gespeichert wird. */
  statsRetention: null as LegalField,

  // ===== AGB =====
  /**
   * Stornierung und Erstattung – geschäftliche Entscheidung des Inhabers (Lovable prüft vor dem Go-Live,
   * ob eine Erstattungsregel vorhanden ist). Vom Inhaber am 25.10.2026 bestätigt.
   */
  cancellationPolicy:
    "Solange wir mit der Zubereitung noch nicht begonnen haben, kannst du deine Bestellung telefonisch stornieren. Bereits online bezahlte Beträge erstatten wir dann vollständig über die ursprüngliche Zahlungsart. Können wir eine Bestellung nicht ausführen, zum Beispiel weil etwas ausverkauft ist, informieren wir dich und erstatten bereits gezahlte Beträge vollständig." as LegalField,
  /** Inhaber hat den Vorschlag zur Stornierung/Erstattung geprüft und freigegeben. */
  cancellationPolicyConfirmed: true,
};

/** Alle Pflichtangaben gesetzt und der Erstattungsvorschlag freigegeben? Erst dann veröffentlichen. */
export function isLegalComplete() {
  return LEGAL.cancellationPolicyConfirmed && Object.values(LEGAL).every((value) => value !== null);
}
