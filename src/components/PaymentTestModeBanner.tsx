const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-[#b4432f]/30 bg-[#b4432f]/10 px-4 py-2 text-center text-sm text-[#b4432f]">
        Die Online-Zahlung ist noch nicht live geschaltet. Schließe das Go-Live im Zahlungs-Bereich ab.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-[#c46b38]/30 bg-[#fff7f1] px-4 py-2 text-center text-sm text-[#8a4a22]">
        Zahlungen laufen aktuell im <strong>Test-Modus</strong> – es wird kein echtes Geld abgebucht.
      </div>
    );
  }
  return null;
}
