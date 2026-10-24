// Stammdaten des Ladens – zentral gepflegt für Footer, Kontaktseite & Co.
export const SITE = {
  name: "Yamiin & Jaiyana's",
  street: "Willy-Brandt-Straße 23",
  zipCity: "63450 Hanau",
  phone: "06181 4187419",
  phoneHref: "tel:+4961814187419",
  email: "info@jaiyanas.de",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Willy-Brandt-Stra%C3%9Fe+23+63450+Hanau",
  // Öffnungszeiten je Wochentag (0 = Sonntag) in Minuten ab Mitternacht – Grundlage für die Abholzeiten an der Kasse.
  openingHours: {
    0: null,
    1: [600, 1200],
    2: [600, 1200],
    3: [600, 1200],
    4: [600, 1200],
    5: [600, 1200],
    6: [720, 1080],
  } as Record<number, readonly [number, number] | null>,
  // Anzeige – bei Änderungen openingHours oben mitpflegen.
  hours: [
    { days: "Montag – Freitag", time: "10:00 – 20:00" },
    { days: "Samstag", time: "12:00 – 18:00" },
    { days: "Sonntag", time: "Ruhetag" },
  ],
  lieferando: "https://www.lieferando.de/speisekarte/yamiin-jaiyanas-healthy-fastfood",
  wolt: "https://wolt.com/de/deu/hanau/restaurant/yamiin-jaiyanas-healthy-fastfood",
} as const;
