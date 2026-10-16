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
  hours: [
    { days: "Montag – Freitag", time: "10:00 – 20:00" },
    { days: "Samstag", time: "12:00 – 20:00" },
    { days: "Sonntag", time: "Ruhetag" },
  ],
  lieferando: "https://www.lieferando.de/speisekarte/yamiin-jaiyanas-healthy-fastfood",
  wolt: "https://wolt.com/de/deu/hanau/restaurant/yamiin-jaiyanas-healthy-fastfood",
} as const;
