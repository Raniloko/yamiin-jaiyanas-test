// Allgemeine Geschäftsbedingungen für Bestellungen über die Website. Grundlagen (amtliche Fassungen,
// gesetze-im-internet.de):
// - § 305 Abs. 2 BGB: Einbeziehung (Hinweis + Möglichkeit der Kenntnisnahme – Hinweis an der Kasse)
// - Art. 246c EGBGB Nr. 1–5 i. V. m. § 312i Abs. 1 BGB: technische Schritte zum Vertragsschluss,
//   Speicherung des Vertragstexts, Korrektur von Eingabefehlern, Sprache, Verhaltenskodizes;
//   Eingangsbestätigung, Abruf/Speichern der AGB
// - § 312j Abs. 1 BGB: Lieferbeschränkungen und Zahlungsmittel spätestens bei Beginn des Bestellvorgangs
// - § 312j Abs. 3 BGB: Bestell-Button „zahlungspflichtig bestellen“
// - § 312g Abs. 2 Nr. 1, 2 und 9 BGB: kein Widerrufsrecht (individuell zusammengestellt, schnell
//   verderblich, Lieferung von Speisen zu einem bestimmten Termin/Zeitraum);
//   Art. 246a § 1 Abs. 3 Nr. 1 EGBGB: Pflicht, darüber zu informieren
// - § 36 VSBG: Information zur Verbraucherschlichtung (auch zusammen mit AGB)
// Liefergebiet, Gebühren, Zahlungsarten und Zeiten kommen aus denselben Quellen wie die Kasse.
import { createFileRoute, Link } from "@tanstack/react-router";

import { Fill, LegalPage, LegalSection } from "@/components/site/legal-page";
import { euro } from "@/lib/cart-store";
import { LEGAL } from "@/lib/legal-info";
import { menuNotes } from "@/lib/menu-data";
import { DELIVERY } from "@/lib/menu-pricing";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB | Yamiin & Jaiyana's Hanau" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen für Bestellungen bei Yamiin & Jaiyana's über unsere Website." },
    ],
  }),
  component: AgbPage,
});

function AgbPage() {
  return (
    <LegalPage title="AGB" intro={<p>Allgemeine Geschäftsbedingungen für Bestellungen über unsere Website zur Abholung oder Lieferung.</p>}>
      <LegalSection title="1. Geltungsbereich und Anbieter">
        <p>
          Diese Bedingungen gelten für alle Bestellungen über die Website {SITE.url.replace("https://", "")}. Dein Vertragspartner ist <Fill value={LEGAL.owner} hint="Name der Inhaberin/des Inhabers bzw. Firma" />, {SITE.name} Healthy Fastfood, {SITE.street}, {SITE.zipCity}, Telefon {SITE.phone}, E-Mail {SITE.email}. Weitere Angaben findest du im <Link to="/impressum">Impressum</Link>.
        </p>
      </LegalSection>

      <LegalSection title="2. Bestellung und Vertragsschluss">
        <p>Die Darstellung der Speisen auf unserer Website ist noch kein verbindliches Angebot. So kommt der Vertrag zustande:</p>
        <ul>
          <li>Du wählst Speisen und Getränke aus und legst sie in den Warenkorb.</li>
          <li>An der Kasse wählst du nacheinander Abholung oder Lieferung, die gewünschte Zeit, gibst deine Kontaktdaten ein und wählst die Zahlungsart.</li>
          <li>In der Übersicht siehst du alle Angaben und den Gesamtpreis noch einmal.</li>
          <li>Mit dem Klick auf „Zahlungspflichtig bestellen“ gibst du ein verbindliches Angebot ab. Bei Online-Zahlung schließt du danach die Zahlung ab.</li>
          <li>Wir bestätigen den Eingang deiner Bestellung sofort auf der Bestellseite. Der Vertrag kommt zustande, wenn wir deine Bestellung annehmen. Das tun wir mit der Bestellbestätigung per E-Mail, spätestens aber, indem wir mit der Zubereitung beginnen.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Eingabefehler korrigieren">
        <p>Bis zum Klick auf „Zahlungspflichtig bestellen“ kannst du deinen Warenkorb jederzeit ändern und in der Übersicht jede Angabe über „Ändern“ korrigieren. Mit „Zurück“ gelangst du zu den vorherigen Schritten.</p>
      </LegalSection>

      <LegalSection title="4. Vertragstext, Sprache und Verhaltenskodizes">
        <p>
          Wir speichern deine Bestellung. Die Bestelldaten erhältst du mit der Bestellbestätigung per E-Mail; den Status siehst du auf der Bestellseite und unter „Meine Bestellungen“ auf dem Gerät, mit dem du bestellt hast. Diese AGB kannst du jederzeit auf dieser Seite abrufen, ausdrucken oder speichern. Vertragssprache ist Deutsch. Wir haben uns keinen besonderen Verhaltenskodizes unterworfen.
        </p>
      </LegalSection>

      <LegalSection title="5. Preise">
        <p>{menuNotes.pricing} Bei Lieferung kommt eine Liefergebühr von {euro(DELIVERY.fee)} hinzu. Den Gesamtpreis siehst du vor dem Absenden der Bestellung.</p>
      </LegalSection>

      <LegalSection title="6. Abholung und Lieferung">
        <ul>
          <li>Abholung: kostenlos in unserem Laden, {SITE.street}, {SITE.zipCity}, zur gewählten Zeit.</li>
          <li>Lieferung: nur innerhalb von {DELIVERY.city} und ab einem Bestellwert von {euro(DELIVERY.minOrder)}.</li>
          <li>Angegebene Abhol- und Lieferzeiten sind Richtwerte. Bei hohem Andrang kann es länger dauern.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Zahlung">
        <p>Du kannst so bezahlen:</p>
        <ul>
          <li>online mit Karte (z. B. Visa, Mastercard), Apple Pay, Google Pay oder PayPal – fällig mit der Bestellung,</li>
          <li>vor Ort bar oder mit Karte – fällig bei Abholung beziehungsweise bei Übergabe der Lieferung.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Kein Widerrufsrecht">
        <p className="font-semibold">
          Ein Widerrufsrecht besteht nicht. Du kannst deine Bestellung nicht widerrufen, weil wir Speisen nach deiner Auswahl frisch zubereiten, weil sie schnell verderben können und weil die Lieferung von Speisen zu einem bestimmten Termin oder Zeitraum vereinbart wird (§ 312g Abs. 2 Nr. 1, 2 und 9 BGB).
        </p>
      </LegalSection>

      <LegalSection title="9. Stornierung und Erstattung">
        <p><Fill value={LEGAL.cancellationPolicy} hint="Regel für Stornierung und Erstattung" /></p>
        {!LEGAL.cancellationPolicyConfirmed && (
          <p><mark className="rounded bg-brick/15 px-1 font-semibold text-brick">[Vorschlag – bitte bestätigen oder ändern]</mark></p>
        )}
      </LegalSection>

      <LegalSection title="10. Mängel">
        <p>Es gelten die gesetzlichen Gewährleistungsrechte. Ist etwas mit deiner Bestellung nicht in Ordnung, melde dich bitte möglichst direkt bei uns, damit wir schnell helfen können.</p>
      </LegalSection>

      <LegalSection title="11. Zutaten und Allergene">
        <p>{menuNotes.nutrition} {menuNotes.allergens}</p>
      </LegalSection>

      <LegalSection title="12. Verbraucherstreitbeilegung">
        {LEGAL.consumerArbitration === false ? (
          <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        ) : (
          <p>
            Wir nehmen an Streitbeilegungsverfahren vor folgender Verbraucherschlichtungsstelle teil:{" "}
            <Fill value={LEGAL.consumerArbitration} hint="false (keine Teilnahme) oder Name, Anschrift und Webseite der Schlichtungsstelle" />
          </p>
        )}
      </LegalSection>
    </LegalPage>
  );
}
