import { describe, expect, test } from "bun:test";

import { checkOrder, checkoutLines, shopTime } from "./order-rules";

// Mittwoch, 11.11.2026, 12:00 Uhr in Hanau (Winterzeit, UTC+1). Geöffnet Mo–Fr 10–20, Sa 12–18, So zu.
const NOW = Date.UTC(2026, 10, 11, 11, 0);
const berlin = (day, hour, minute = 0) => Date.UTC(2026, 10, day, hour - 1, minute);

const draft = (changes = {}) => ({
  items: [
    { ref: { kind: "bowl", name: "Y's Bowl", size: "small", base: "Bulgur" }, qty: 2 },
    { ref: { kind: "product", name: "Iced Lotus", option: "Oat Milk" }, qty: 1, note: "wenig Eis" },
  ],
  fulfillment: "pickup",
  pickup: "asap",
  payment: "onsite",
  contact: { name: "Mia Muster", phone: "0176 1234567", email: "Mia@Example.com" },
  note: "",
  ...changes,
});

const ok = (input, now = NOW) => {
  const result = checkOrder(input, now);
  if ("error" in result) throw new Error(`Unerwartet abgelehnt: ${result.error}`);
  return result.order;
};
const rejected = (input, now = NOW) => {
  const result = checkOrder(input, now);
  return "error" in result ? result.error : null;
};

describe("Bestellung prüfen", () => {
  test("Preise und Summe kommen aus der Speisekarte, nicht aus dem Browser", () => {
    const tampered = draft();
    tampered.items[0].price = 0.01;
    tampered.items[0].name = "Gratis-Bowl";
    tampered.total = 0.01;
    const order = ok(tampered);
    expect(order.items.map((item) => [item.name, item.detail, item.price, item.qty])).toEqual([
      ["Y's Bowl", "Klein · Bulgur", 10.9, 2],
      ["Iced Lotus", "Oat Milk · wenig Eis", 7.5, 1],
    ]);
    expect(order.total).toBeCloseTo(29.3);
    expect(order.deliveryFee).toBe(0);
    expect(order.contact.email).toBe("mia@example.com");
  });

  test("zusätzliche Felder in einer Position werden nicht gespeichert", () => {
    const order = ok(draft({ items: [{ ref: { kind: "product", name: "Chicken Wrap", junk: "x".repeat(5000) }, qty: 1 }] }));
    expect(order.items[0]?.ref).toEqual({ kind: "product", name: "Chicken Wrap" });
  });

  test("unbekannte Gerichte, Varianten und Mengen werden abgelehnt", () => {
    expect(rejected(draft({ items: [{ ref: { kind: "product", name: "Gratis-Menü" }, qty: 1 }] }))).toContain("gibt es so nicht");
    expect(rejected(draft({ items: [{ ref: { kind: "bowl", name: "Y's Bowl", size: "small", base: "Pommes" }, qty: 1 }] }))).toContain("gibt es so nicht");
    expect(rejected(draft({ items: [{ ref: { kind: "product", name: "Chicken Wrap" }, qty: 0 }] }))).not.toBeNull();
    expect(rejected(draft({ items: [{ ref: { kind: "product", name: "Chicken Wrap" }, qty: 21 }] }))).not.toBeNull();
    expect(rejected(draft({ items: [{ ref: { kind: "product", name: "Chicken Wrap" }, qty: 1.5 }] }))).not.toBeNull();
    expect(rejected(draft({ items: [] }))).toContain("leer");
    expect(rejected(null)).not.toBeNull();
  });

  test("eigene Bowl: Aufpreise rechnet der Server, Protein ist Pflicht", () => {
    const custom = (picks) => draft({ items: [{ ref: { kind: "custom", name: "Eigene Bowl", size: "small", base: "Bulgur", picks }, qty: 1 }] });
    expect(rejected(custom({}))).toContain("gibt es so nicht");
    expect(rejected(custom({ protein: ["Einhorn"] }))).toContain("gibt es so nicht");
  });

  test("Kontakt muss vollständig sein", () => {
    expect(rejected(draft({ contact: { name: "M", phone: "0176 1234567", email: "mia@example.com" } }))).toContain("Namen");
    expect(rejected(draft({ contact: { name: "Mia", phone: "abc", email: "mia@example.com" } }))).toContain("Telefonnummer");
    expect(rejected(draft({ contact: { name: "Mia", phone: "0176 1234567", email: "keine-mail" } }))).toContain("E-Mail");
    expect(rejected(draft({ note: "x".repeat(501) }))).toContain("Hinweis");
  });

  test("Zeilenumbrüche im Namen werden entfernt", () => {
    expect(ok(draft({ contact: { name: "Mia\r\nMuster", phone: "0176 1234567", email: "mia@example.com" } })).contact.name).toBe("Mia Muster");
  });
});

describe("Abholzeit", () => {
  test("Schnellstmöglich: Zeit setzt der Server, nur während der Öffnungszeiten", () => {
    const order = ok(draft());
    expect(order.pickupAt).toBe(NOW + 25 * 60000);
    expect(order.pickupLabel).toBe("Schnellstmöglich");
    // Sonntag geschlossen, Mittwoch 19:50 Uhr wird nicht mehr vor Ladenschluss fertig, 09:00 Uhr noch zu.
    expect(rejected(draft(), berlin(15, 12))).toContain("geschlossen");
    expect(rejected(draft(), berlin(11, 19, 50))).toContain("geschlossen");
    expect(rejected(draft(), berlin(11, 9))).toContain("geschlossen");
  });

  test("Wunschzeit im Raster und innerhalb der Öffnungszeiten", () => {
    expect(ok(draft({ pickup: berlin(11, 13) })).pickupLabel).toBe("Heute 13:00 Uhr");
    expect(ok(draft({ pickup: berlin(12, 10) })).pickupLabel).toBe("Morgen 10:00 Uhr");
    expect(ok(draft({ pickup: berlin(14, 12, 15) })).pickupLabel).toBe("Samstag 12:15 Uhr");
    expect(ok(draft({ pickup: berlin(11, 19, 45) })).pickupAt).toBe(berlin(11, 19, 45));
  });

  test("abgelehnt: vergangen, zu knapp, außerhalb der Öffnungszeiten, neben dem Raster, zu weit voraus", () => {
    expect(rejected(draft({ pickup: berlin(11, 11) }))).toContain("nicht mehr möglich");
    expect(rejected(draft({ pickup: berlin(11, 12, 15) }))).toContain("nicht mehr möglich");
    expect(rejected(draft({ pickup: berlin(11, 20) }))).toContain("Öffnungszeiten");
    expect(rejected(draft({ pickup: berlin(12, 9, 45) }))).toContain("Öffnungszeiten");
    expect(rejected(draft({ pickup: berlin(15, 13) }))).toContain("Öffnungszeiten");
    expect(rejected(draft({ pickup: berlin(11, 13, 7) }))).toContain("Öffnungszeiten");
    expect(rejected(draft({ pickup: berlin(25, 13) }))).toContain("Voraus");
    expect(rejected(draft({ pickup: "morgen" }))).not.toBeNull();
  });

  test("Sommerzeit: Hanauer Ortszeit, nicht UTC", () => {
    // Mittwoch, 15.07.2026, 12:00 Uhr in Hanau = 10:00 UTC.
    const summer = Date.UTC(2026, 6, 15, 10, 0);
    expect(shopTime(summer)).toMatchObject({ weekday: 3, minutes: 12 * 60 });
    expect(ok(draft({ pickup: Date.UTC(2026, 6, 15, 17, 45) }), summer).pickupLabel).toBe("Heute 19:45 Uhr");
    expect(rejected(draft({ pickup: Date.UTC(2026, 6, 15, 18, 0) }), summer)).toContain("Öffnungszeiten");
  });
});

describe("Lieferung", () => {
  const address = { street: "Nürnberger Str. 14", zip: "63450", city: "Hanau" };

  test("Gebühr und Summe legt der Server fest", () => {
    const order = ok(draft({ fulfillment: "delivery", address }));
    expect(order.deliveryFee).toBe(2.5);
    expect(order.total).toBeCloseTo(31.8);
    expect(order.address).toEqual(address);
    expect(order.pickupAt).toBe(NOW + 45 * 60000);
  });

  test("nur im Liefergebiet und ab Mindestbestellwert", () => {
    expect(rejected(draft({ fulfillment: "delivery", address: { ...address, zip: "60311" } }))).toContain("liefern nur");
    expect(rejected(draft({ fulfillment: "delivery", address: { ...address, street: "A" } }))).toContain("Straße");
    expect(rejected(draft({ fulfillment: "delivery" }))).toContain("Straße");
    expect(rejected(draft({ fulfillment: "delivery", address, items: [{ ref: { kind: "product", name: "Chicken Wrap" }, qty: 1 }] }))).toContain("Mindestbestellwert");
  });

  test("Abholung speichert keine Adresse", () => {
    expect(ok(draft({ address })).address).toBeNull();
  });
});

describe("Zahlung aus der gespeicherten Bestellung", () => {
  test("Positionen und Summe stimmen mit der Bestellung überein", () => {
    const order = ok(draft({ fulfillment: "delivery", address: { street: "Nürnberger Str. 14", zip: "63450", city: "Hanau" } }));
    const result = checkoutLines(order);
    if ("error" in result) throw new Error(result.error);
    expect(result.totalCents).toBe(3180);
    expect(result.lines).toEqual([
      { name: "Y's Bowl (Klein · Bulgur)", unitAmount: 1090, qty: 2 },
      { name: "Iced Lotus (Oat Milk)", unitAmount: 750, qty: 1 },
      { name: "Lieferung", unitAmount: 250, qty: 1 },
    ]);
  });

  test("weicht der gespeicherte Betrag von der Speisekarte ab, wird nicht kassiert", () => {
    const order = ok(draft());
    expect("error" in checkoutLines({ ...order, total: 1 })).toBe(true);
    expect("error" in checkoutLines({ ...order, items: [] })).toBe(true);
    expect("error" in checkoutLines({ ...order, items: [{ name: "Y's Bowl", price: 0.01, qty: 1 }] })).toBe(true);
    // Betrag als Text, wie ihn die Datenbank (numeric) liefern kann.
    expect("error" in checkoutLines({ ...order, total: "29.30" })).toBe(false);
  });
});
