import { SITE } from "@/lib/site-info";

const STEP = 15;
/** Vorlaufzeit bis zur frühesten Wunschzeit. */
const LEAD = 30;
/** Letzte Wunschzeit liegt so viele Minuten vor Ladenschluss. */
const LAST_BEFORE_CLOSE = 15;
const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export type SlotDay = { label: string; slots: Date[] };

/** Zubereitungszeit für "Schnellstmöglich" – Kasse und Startseite nutzen dieselben Werte. */
export const PREP_MINUTES = { pickup: 25, delivery: 45 } as const;

const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();
const atMinutes = (day: Date, minutes: number) => {
  const date = new Date(day);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

/** Ob jetzt geöffnet ist und eine Bestellung noch vor Ladenschluss fertig wird. */
export function isOpenForAsap(now: Date, prepMinutes: number) {
  const hours = SITE.openingHours[now.getDay()];
  if (!hours) return false;
  const minutes = minutesOf(now);
  return minutes >= hours[0] && minutes + prepMinutes <= hours[1];
}

/** Wunschzeiten innerhalb der Öffnungszeiten: heute, sonst der nächste Öffnungstag. */
export function nextSlotDay(now: Date): SlotDay | null {
  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const hours = SITE.openingHours[day.getDay()];
    if (!hours) continue;
    const earliest = offset === 0 ? Math.max(hours[0], Math.ceil((minutesOf(now) + LEAD) / STEP) * STEP) : hours[0];
    const latest = hours[1] - LAST_BEFORE_CLOSE;
    const slots: Date[] = [];
    for (let minutes = earliest; minutes <= latest; minutes += STEP) slots.push(atMinutes(day, minutes));
    if (slots.length === 0) continue;
    const label = offset === 0 ? "Heute" : offset === 1 ? "Morgen" : WEEKDAYS[day.getDay()]!;
    return { label, slots };
  }
  return null;
}

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Für die Startseite: "Jetzt geöffnet · bis 20:00 Uhr" bzw. wann wir wieder öffnen. */
export function openStatus(now: Date): { open: boolean; text: string } {
  const minutes = minutesOf(now);
  const today = SITE.openingHours[now.getDay()];
  if (today && minutes >= today[0] && minutes < today[1]) return { open: true, text: `Jetzt geöffnet · bis ${clock(today[1])} Uhr` };
  if (today && minutes < today[0]) return { open: false, text: `Öffnet heute um ${clock(today[0])} Uhr` };
  for (let offset = 1; offset <= 7; offset++) {
    const day = (now.getDay() + offset) % 7;
    const hours = SITE.openingHours[day];
    if (hours) return { open: false, text: `Öffnet ${offset === 1 ? "morgen" : WEEKDAYS[day]} um ${clock(hours[0])} Uhr` };
  }
  return { open: false, text: "Gerade geschlossen" };
}
