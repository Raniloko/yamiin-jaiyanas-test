# Webseite für Yamiin & Jaiyana's Healthy Fastfood (Hanau)

## Was ich recherchiert habe

- Adresse: Willy-Brandt-Straße 23, 63450 Hanau, Telefon 06181 4187419, E-Mail info@jaiyanas.de
- Öffnungszeiten: Mo–Fr 10:00–20:00, Sa 12:00–20:00, So Ruhetag
- Konzept: "Healthy Fast Food" – Bowls (Basis Reis, Quinoa oder Bulgur), Egg Drop Sandwiches, Açaí, Matcha, Desserts; auch vegan. Eröffnet im November 2023 von Samira Hussein.
- Google-Bewertung: 4,5 Sterne bei rund 91 Bewertungen
- Bestellung über Lieferando und Wolt, Abholung und Lieferung möglich

Speisekarte (Bowls, Preise laut Lieferando/Wolt):
Y's Bowl 14,90 € · J's Bowl 15,40 € · Bulgur Blizz Bowl 14,90 € · Midori Ebi Bowl 14,50 € · Falafel Exotica Bowl 13,90 € · Mykonos 15,90 € · Aloha Bowl 15,00 € · dazu Getränke (Fritz-Limo, Elephant Bay) ab 3,17 €

## Zu den Bildern

Fotos aus der Google-Suche gehören meist den Fotografen bzw. Google und dürfen nicht einfach auf eine eigene Webseite kopiert werden. Ich erstelle deshalb hochwertige, stimmige Food-Bilder (Bowls, Sandwiches, Açaí, Matcha, Ladenatmosphäre) für die Seite. Sobald du eigene Fotos hast, tausche ich sie gerne 1:1 aus.

## Die Seite (eine Seite, mobil-optimiert)

1. Kopfbereich mit Name, Navigation und Button "Jetzt bestellen"
2. Hero: großes Bowl-Bild, Slogan "Healthy Fast Food aus Hanau", Buttons zu Speisekarte und Bestellung, Hinweis 4,5 Sterne bei Google
3. Über uns: Geschichte von Samira Hussein und dem Konzept, frische Zutaten, vegane Optionen
4. Speisekarte: alle Bowls mit Beschreibung und Preis, dazu Bereich für Sandwiches/Açaí/Matcha und Getränke
5. "So baust du deine Bowl": Basis wählen, Topping wählen, Protein wählen, Sauce wählen
6. Bewertungen: zwei bis drei echte Gästestimmen von Google
7. Besuch & Kontakt: Adresse, Öffnungszeiten-Tabelle, Telefon, E-Mail, Karte, Anfahrtslink
8. Fußbereich mit Bestell-Links (Lieferando, Wolt) und Impressumsangaben

## Look

Frisch und natürlich: warmes Cremeweiß, tiefes Avocado-Grün, Akzent in Mango-Orange, große Rundungen, kräftige moderne Schrift, viele Food-Fotos. Kein Standard-Template-Look.

## Technisches

- Startseite `src/routes/index.tsx` ersetzt den Platzhalter; Abschnitte als Komponenten unter `src/components/`
- Designtokens (Farben, Schrift) in `src/styles.css`, keine fest kodierten Farben in Komponenten
- Bilder als generierte Assets unter `src/assets/`
- Eigene Seiten-Metadaten (Titel, Beschreibung) im `head()` der Startseite
- Kein Backend nötig; Bestellungen laufen über die bestehenden Links zu Lieferando und Wolt
