// Datenschutzerklärung. Aufbau entlang der Pflichtangaben aus Art. 13 DSGVO (amtlicher Wortlaut:
// BfDI, „DSGVO – BDSG“, Stand April 2026):
// - Abs. 1 lit. a–f: Verantwortlicher, Datenschutzbeauftragter, Zwecke + Rechtsgrundlagen (Art. 6),
//   berechtigte Interessen bei lit. f, Empfänger, Drittlandübermittlung
// - Abs. 2 lit. a–f: Speicherdauer, Betroffenenrechte (Art. 15–18, 20, 21), Beschwerderecht (Art. 77),
//   Pflicht zur Bereitstellung, automatisierte Entscheidungen (Art. 22)
// - § 25 TDDDG: Speicherung auf dem Gerät nur, wenn für den gewünschten Dienst unbedingt erforderlich (Abs. 2 Nr. 2)
// - § 147 Abs. 3 AO: Aufbewahrung Buchungsbelege 8 Jahre, sonstige steuerlich relevante Unterlagen 6 Jahre
// - Aufsichtsbehörde Hessen: Angaben laut Impressum/Kontaktseite datenschutz.hessen.de
// Was technisch passiert, ist im Code geprüft: Bestellungen (orders), Bestätigungs-Mail (Resend über
// Lovable), Online-Zahlung (Stripe über Lovable), Geräte-Speicher (yj-cart, yj-orders, yj-order-tokens),
// anonyme Speisekarten-Statistik (menu_events, Besuchs-ID nur im Arbeitsspeicher), Schriften lokal.
import { createFileRoute } from "@tanstack/react-router";

import { Fill, LegalPage, LegalSection } from "@/components/site/legal-page";
import { LEGAL } from "@/lib/legal-info";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung | Yamiin & Jaiyana's Hanau" },
      { name: "description", content: "Wie Yamiin & Jaiyana's personenbezogene Daten auf der Website und bei Bestellungen verarbeitet." },
    ],
  }),
  component: DatenschutzPage,
});

function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz" intro={<p>Hier erfährst du, welche personenbezogenen Daten wir verarbeiten, wenn du unsere Website besuchst und bei uns bestellst, wofür wir sie nutzen und welche Rechte du hast.</p>}>
      <LegalSection title="1. Verantwortlicher">
        <p>
          <Fill value={LEGAL.owner} hint="Name der Inhaberin/des Inhabers bzw. Firma" />
          <br />
          {SITE.name} Healthy Fastfood, {SITE.street}, {SITE.zipCity}
          <br />
          Telefon: <a href={SITE.phoneHref}>{SITE.phone}</a>, E-Mail: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      </LegalSection>

      <LegalSection title="2. Datenschutzbeauftragter">
        {LEGAL.dataProtectionOfficer === false ? (
          <p>Wir haben keinen Datenschutzbeauftragten benannt. Bei Fragen zum Datenschutz erreichst du uns über die Kontaktdaten oben.</p>
        ) : (
          <p><Fill value={LEGAL.dataProtectionOfficer} hint="Kontakt der/des Datenschutzbeauftragten oder false" /></p>
        )}
      </LegalSection>

      <LegalSection title="3. Aufruf der Website">
        <p>
          Wenn du unsere Website aufrufst, verarbeitet unser Hosting-Anbieter technisch notwendige Daten: deine IP-Adresse, Datum und Uhrzeit, die aufgerufene Seite sowie Angaben zu Browser und Betriebssystem. Das ist nötig, um dir die Seite auszuliefern und den Betrieb abzusichern.
        </p>
        <ul>
          <li>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist eine sichere und funktionierende Website.</li>
          <li>Empfänger (Hosting): <Fill value={LEGAL.hostingProvider} hint="Anbieter, Sitz und ggf. Drittlandübermittlung laut Vertrag mit Lovable" /></li>
          <li>Speicherdauer: <Fill value={LEGAL.hostingLogRetention} hint="Speicherdauer der Server-Protokolle beim Hosting-Anbieter" /></li>
        </ul>
        {LEGAL.hostingAnalytics !== false && (
          <p>
            Besucherstatistik des Hosting-Anbieters: <Fill value={LEGAL.hostingAnalytics} hint="welche Daten die Lovable-Besucherstatistik erfasst und ob sie etwas auf dem Gerät speichert – oder false, wenn abgeschaltet" />
          </p>
        )}
      </LegalSection>

      <LegalSection title="4. Bestellungen">
        <p>
          Wenn du bei uns bestellst, verarbeiten wir deinen Namen, deine Telefonnummer und E-Mail-Adresse, bei Lieferung deine Anschrift, deinen Hinweis an die Küche, die bestellten Speisen, die gewählte Abhol- oder Lieferzeit und die Zahlungsart. Wir nutzen diese Daten, um deine Bestellung zuzubereiten, an dich zu übergeben oder zu liefern, dich bei Rückfragen zu erreichen und dir den Status deiner Bestellung anzuzeigen.
        </p>
        <ul>
          <li>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Vertrags).</li>
          <li>Ohne diese Angaben können wir deine Bestellung nicht annehmen. Die Anschrift brauchen wir nur bei Lieferung.</li>
          <li>Empfänger (Datenbank): <Fill value={LEGAL.databaseProvider} hint="Anbieter, Sitz, Serverstandort und ggf. Drittlandübermittlung der Lovable-Cloud-Datenbank" /></li>
          <li>
            Speicherdauer: so lange, wie wir die Daten für die Abwicklung der Bestellung brauchen. Unterlagen, die wir aus steuerlichen Gründen aufbewahren müssen, speichern wir darüber hinaus für die gesetzliche Frist: Buchungsbelege acht Jahre, sonstige steuerlich relevante Unterlagen sechs Jahre (§ 147 Abs. 3 Abgabenordnung). Rechtsgrundlage dafür ist Art. 6 Abs. 1 lit. c DSGVO.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Bestellbestätigung per E-Mail">
        <p>Nach deiner Bestellung schicken wir dir eine Bestätigung an die angegebene E-Mail-Adresse. Dafür geben wir deine E-Mail-Adresse, deinen Namen und die Bestelldaten an unseren E-Mail-Dienstleister weiter.</p>
        <ul>
          <li>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</li>
          <li>Empfänger: <Fill value={LEGAL.emailProvider} hint="E-Mail-Dienstleister (Resend), Sitz und ggf. Drittlandübermittlung" /></li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Online-Zahlung">
        <p>
          Wenn du online mit Karte, Apple Pay, Google Pay oder PayPal bezahlst, gibst du deine Zahlungsdaten direkt bei unserem Zahlungsdienstleister ein. Wir erhalten keine Kartennummern, sondern nur die Bestätigung, ob die Zahlung erfolgreich war. Dafür übermitteln wir dem Zahlungsdienstleister die Bestellnummer, den Betrag und deine E-Mail-Adresse. Beim Bezahlen kann der Zahlungsdienstleister zur Betrugsvorbeugung eigene Cookies setzen; Einzelheiten stehen in seiner Datenschutzerklärung.
        </p>
        <ul>
          <li>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</li>
          <li>Empfänger: <Fill value={LEGAL.paymentProvider} hint="Zahlungsdienstleister (Stripe) laut Stripe-Konto, Sitz und ggf. Drittlandübermittlung" /></li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Speicherung auf deinem Gerät">
        <p>
          Damit dein Warenkorb und deine Bestellungen nicht verloren gehen, speichern wir im Speicher deines Browsers: den Inhalt deines Warenkorbs, eine Übersicht deiner Bestellungen auf diesem Gerät und je Bestellung einen Zugangsschlüssel, mit dem nur du den Live-Status abrufen kannst. Diese Speicherung ist für den von dir gewünschten Dienst unbedingt erforderlich und deshalb ohne Einwilligung zulässig (§ 25 Abs. 2 Nr. 2 TDDDG). Wir setzen keine Cookies für Werbung oder Tracking.
        </p>
        <p>Du kannst diese Daten jederzeit in den Einstellungen deines Browsers löschen. Danach siehst du deine bisherigen Bestellungen auf diesem Gerät nicht mehr.</p>
      </LegalSection>

      <LegalSection title="8. Anonyme Speisekarten-Statistik">
        <p>
          Um unsere Speisekarte zu verbessern, zählen wir, welche Kategorien und Gerichte angesehen, in den Warenkorb gelegt und bestellt werden. Dabei erfassen wir nur das Ereignis, das Gericht, die Geräteart (Handy, Tablet oder Computer) und eine zufällige Besuchs-ID, die nur während deines Besuchs im Arbeitsspeicher der Seite existiert und nicht auf deinem Gerät gespeichert wird. Namen, Kontaktdaten oder IP-Adressen speichern wir dafür nicht.
        </p>
        <ul>
          <li>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist es, unser Angebot an der Nachfrage auszurichten.</li>
          <li>Speicherdauer: <Fill value={LEGAL.statsRetention} hint="wie lange die Statistik gespeichert wird" /></li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Kontakt per Telefon oder E-Mail">
        <p>
          Wenn du uns anrufst oder schreibst, verarbeiten wir deine Angaben, um dein Anliegen zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn es um eine Bestellung geht, sonst Art. 6 Abs. 1 lit. f DSGVO – unser berechtigtes Interesse ist es, deine Anfrage zu beantworten.
        </p>
      </LegalSection>

      <LegalSection title="10. Links zu anderen Anbietern und Schriftarten">
        <p>
          Unsere Seite enthält Links zu Google Maps (Route planen) sowie zu unserer Speisekarte bei Lieferando und Wolt. Daten werden an diese Anbieter erst übertragen, wenn du einen solchen Link anklickst; dann gilt die Datenschutzerklärung des jeweiligen Anbieters. Unsere Schriftarten liefern wir selbst aus – beim Laden der Seite werden dafür keine Daten an Dritte übertragen.
        </p>
      </LegalSection>

      <LegalSection title="11. Deine Rechte">
        <p>Du hast gegenüber uns folgende Rechte hinsichtlich deiner personenbezogenen Daten:</p>
        <ul>
          <li>Auskunft über die Daten, die wir über dich verarbeiten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        </ul>
        <p>Wende dich dafür einfach an die Kontaktdaten unter Punkt 1.</p>
      </LegalSection>

      <LegalSection title="12. Widerspruchsrecht">
        <p className="font-semibold">
          Soweit wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeiten (berechtigtes Interesse), kannst du dieser Verarbeitung aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen (Art. 21 DSGVO).
        </p>
      </LegalSection>

      <LegalSection title="13. Beschwerderecht bei der Aufsichtsbehörde">
        <p>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO). Für uns zuständig ist:
        </p>
        <p>
          Der Hessische Beauftragte für Datenschutz und Informationsfreiheit
          <br />
          Wilhelmstraße 7, 65185 Wiesbaden (Postanschrift: Postfach 3163, 65021 Wiesbaden)
          <br />
          Telefon: +49 611 1408-0, E-Mail: poststelle@datenschutz.hessen.de
          <br />
          <a href="https://datenschutz.hessen.de" target="_blank" rel="noreferrer">datenschutz.hessen.de</a>
        </p>
      </LegalSection>

      <LegalSection title="14. Keine automatisierte Entscheidungsfindung">
        <p>Wir treffen keine Entscheidungen, die ausschließlich auf einer automatisierten Verarbeitung einschließlich Profiling beruhen (Art. 22 DSGVO).</p>
      </LegalSection>
    </LegalPage>
  );
}
