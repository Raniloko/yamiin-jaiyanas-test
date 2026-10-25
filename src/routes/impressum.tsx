// Impressum. Grundlagen (amtliche Fassungen, gesetze-im-internet.de):
// - § 5 Abs. 1 DDG: Pflichtangaben (Name/Anschrift, Kontakt inkl. E-Mail, ggf. Rechtsform/Vertretung,
//   Register, USt-IdNr., Aufsichtsbehörde)
// - § 36 VSBG: Information zur Teilnahme an Verbraucherschlichtung (gilt für Webseite und AGB)
// - Die EU-Plattform zur Online-Streitbeilegung (OS-Plattform) ist seit 20.07.2025 eingestellt
//   (Verordnung (EU) 2024/3228, Hinweis der EU-Kommission) – deshalb kein OS-Link mehr.
import { createFileRoute } from "@tanstack/react-router";

import { Fill, LegalPage, LegalSection } from "@/components/site/legal-page";
import { LEGAL } from "@/lib/legal-info";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum | Yamiin & Jaiyana's Hanau" },
      { name: "description", content: "Impressum von Yamiin & Jaiyana's Healthy Fastfood, Willy-Brandt-Straße 23, 63450 Hanau." },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <LegalSection title="Angaben gemäß § 5 DDG">
        <p>
          <Fill value={LEGAL.owner} hint="Name der Inhaberin/des Inhabers bzw. Firma" />
          <br />
          {SITE.name} Healthy Fastfood
          <br />
          {SITE.street}
          <br />
          {SITE.zipCity}
        </p>
        {LEGAL.legalForm !== false && <p>Rechtsform: <Fill value={LEGAL.legalForm} hint="Rechtsform (nur bei z. B. GmbH, sonst false)" /></p>}
        {LEGAL.representatives !== false && <p>Vertreten durch: <Fill value={LEGAL.representatives} hint="Vertretungsberechtigte (nur bei juristischen Personen, sonst false)" /></p>}
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon: <a href={SITE.phoneHref}>{SITE.phone}</a>
          <br />
          E-Mail: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      </LegalSection>

      {LEGAL.register !== false && (
        <LegalSection title="Registereintrag">
          <p><Fill value={LEGAL.register} hint="Registergericht und Registernummer (falls eingetragen, sonst false)" /></p>
        </LegalSection>
      )}

      {LEGAL.vatId !== false && (
        <LegalSection title="Umsatzsteuer-Identifikationsnummer">
          <p><Fill value={LEGAL.vatId} hint="USt-IdNr. bzw. W-IdNr. (falls vorhanden, sonst false)" /></p>
        </LegalSection>
      )}

      {LEGAL.supervisoryAuthority !== false && (
        <LegalSection title="Zuständige Aufsichtsbehörde">
          <p><Fill value={LEGAL.supervisoryAuthority} hint="nur bei zulassungspflichtiger Tätigkeit, sonst false" /></p>
        </LegalSection>
      )}

      <LegalSection title="Verbraucherstreitbeilegung">
        {LEGAL.consumerArbitration === false ? (
          <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        ) : (
          <p>
            Wir nehmen an Streitbeilegungsverfahren vor folgender Verbraucherschlichtungsstelle teil:{" "}
            <Fill value={LEGAL.consumerArbitration} hint="false (keine Teilnahme) oder Name, Anschrift und Webseite der Schlichtungsstelle" />
          </p>
        )}
      </LegalSection>

      <LegalSection title="Marken">
        <p>Lieferando und Wolt sowie deren Logos sind Marken der jeweiligen Inhaber. Wir verwenden sie nur, um auf unsere Speisekarte bei diesen Lieferdiensten zu verweisen.</p>
      </LegalSection>
    </LegalPage>
  );
}
