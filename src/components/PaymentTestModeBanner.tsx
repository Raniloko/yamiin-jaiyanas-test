const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-brick/30 bg-brick/10 px-4 py-2 text-center text-sm text-brick">
        Die Online-Zahlung ist noch nicht live geschaltet. Schließe das Go-Live im Zahlungs-Bereich ab.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-clay/30 bg-card px-4 py-2 text-center text-sm text-peach-foreground">
        Zahlungen laufen aktuell im <strong>Test-Modus</strong> – es wird kein echtes Geld abgebucht.
      </div>
    );
  }
  return null;
}
