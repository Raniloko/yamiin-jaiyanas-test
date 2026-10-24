// E-Mail-Vorlagen im Look der Website (dunkler Kopf, Creme, Kupfer-Akzent, Serifen-Titel).
// Tabellen-Layout mit Inline-Styles, damit Gmail, Apple Mail und Outlook gleich aussehen.
// Alle Texte von Gästen werden escaped; nur der Server baut diese Mails.
import { SITE } from "@/lib/site-info";

import type { EmailMessage } from "@/lib/email.server";
import type { Order } from "@/lib/order-store";

const C = { dark: "#1f2022", cream: "#f8f6f0", line: "#e2d8ca", soft: "#f1e8dc", muted: "#6f675f", accent: "#c46b38", peach: "#f5c3a6" };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const euro = (value: number) => `${value.toFixed(2).replace(".", ",")}&nbsp;€`;
const berlin = (time: number, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", ...options }).format(time);

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px"><tr>
<td style="border-radius:999px;background:${C.dark}"><a href="${esc(href)}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:15px;font-weight:700;color:${C.cream};text-decoration:none;border-radius:999px">${label}&nbsp;&nbsp;→</a></td>
</tr></table>`;
}

function fallbackLink(href: string) {
  return `<p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted}">Falls der Knopf nicht funktioniert, kopiere diesen Link in deinen Browser:<br><a href="${esc(href)}" style="color:${C.accent};word-break:break-all">${esc(href)}</a></p>`;
}

/** Grundgerüst: Kopf mit Logo, weiße Karte, Fußzeile mit Laden-Infos. */
function layout({ preheader, eyebrow, title, accent, body, footerNote }: { preheader: string; eyebrow: string; title: string; accent?: string; body: string; footerNote: string }) {
  const hours = SITE.hours.map((entry) => `${entry.days}: ${entry.time}`).join(" · ");
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream}"><tr><td align="center" style="padding:24px 12px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="background:${C.dark};border-radius:24px 24px 0 0;padding:26px 32px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:14px"><img src="${SITE.url}/favicon.png" width="44" height="44" alt="" style="display:block;border-radius:999px;border:0"></td>
    <td><div style="font-family:${SANS};font-size:15px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${C.cream}">Yamiin &amp; Jaiyana&rsquo;s</div>
    <div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${C.peach};margin-top:3px">Healthy Fastfood · Hanau</div></td>
  </tr></table>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${C.line};border-top:0;border-radius:0 0 24px 24px;padding:36px 32px 34px">
  <p style="margin:0 0 12px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${C.accent}">${eyebrow}</p>
  <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:36px;line-height:40px;font-weight:400;color:${C.dark}">${title}${accent ? ` <em style="color:${C.accent}">${accent}</em>` : ""}</h1>
  ${body}
</td></tr>
<tr><td style="padding:26px 24px 0;text-align:center;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted}">
  <strong style="color:${C.dark}">${esc(SITE.name)} Healthy Fastfood</strong><br>
  ${esc(SITE.street)}, ${esc(SITE.zipCity)} · <a href="${SITE.phoneHref}" style="color:${C.muted}">${esc(SITE.phone)}</a><br>
  ${esc(hours)}<br>
  <a href="${SITE.url}" style="color:${C.accent};text-decoration:none">${SITE.url.replace("https://", "")}</a>
  <p style="margin:14px 0 0;font-size:11px;line-height:17px;color:#9a9088">${footerNote}</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

const para = (html: string) => `<p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:25px;color:#3b3835">${html}</p>`;

function infoCell(label: string, value: string, hint?: string) {
  return `<td valign="top" style="padding:14px 16px;background:${C.soft};border-radius:16px">
<div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.muted}">${label}</div>
<div style="font-family:${SANS};font-size:15px;font-weight:700;color:${C.dark};margin-top:5px">${value}</div>
${hint ? `<div style="font-family:${SANS};font-size:12px;color:${C.muted};margin-top:2px">${hint}</div>` : ""}</td>`;
}

const PAYMENT: Record<Order["payment"], string> = { onsite: "Vor Ort", online: "Karte &amp; Wallet", paypal: "PayPal" };

/** Bestellbestätigung an den Gast – mit allen Positionen und Link zum Live-Status. */
export function orderConfirmationEmail(order: Order, statusUrl: string): EmailMessage {
  const delivery = order.fulfillment === "delivery";
  const firstName = order.contact.name.trim().split(/\s+/)[0] ?? "";
  const asap = order.pickupLabel === "Schnellstmöglich";
  const clock = `${berlin(order.pickupAt, { hour: "2-digit", minute: "2-digit" })} Uhr`;
  const when = asap ? `ca. ${clock}` : esc(order.pickupLabel);
  const fee = order.deliveryFee ?? 0;
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const paidOnline = order.payment !== "onsite";

  const rows = order.items
    .map(
      (item) => `<tr>
<td valign="top" style="padding:14px 0;border-bottom:1px solid ${C.soft};font-family:${SANS};font-size:15px;font-weight:700;color:${C.accent};width:34px">${item.qty}×</td>
<td valign="top" style="padding:14px 10px 14px 0;border-bottom:1px solid ${C.soft};font-family:${SANS}">
  <div style="font-size:15px;font-weight:700;color:${C.dark}">${esc(item.name)}</div>
  ${item.detail ? `<div style="font-size:13px;line-height:19px;color:${C.muted};margin-top:2px">${esc(item.detail)}</div>` : ""}
  ${item.note ? `<div style="font-size:13px;line-height:19px;color:${C.accent};margin-top:2px">Notiz: ${esc(item.note)}</div>` : ""}
</td>
<td valign="top" align="right" style="padding:14px 0;border-bottom:1px solid ${C.soft};font-family:${SANS};font-size:15px;font-weight:700;color:${C.dark};white-space:nowrap">${euro(item.price * item.qty)}</td>
</tr>`,
    )
    .join("");

  const sumRow = (label: string, value: string, strong = false) => `<tr>
<td colspan="2" style="padding:${strong ? "14px" : "8px"} 0 0;font-family:${SANS};font-size:${strong ? "17px" : "14px"};font-weight:${strong ? 800 : 400};color:${strong ? C.dark : C.muted}">${label}</td>
<td align="right" style="padding:${strong ? "14px" : "8px"} 0 0;font-family:${strong ? SERIF : SANS};font-size:${strong ? "24px" : "14px"};color:${strong ? C.dark : C.muted};white-space:nowrap">${value}</td></tr>`;

  const where = delivery && order.address
    ? `<strong style="color:${C.dark}">Lieferung an</strong><br>${esc(order.address.street)}<br>${esc(order.address.zip)} ${esc(order.address.city)}`
    : `<strong style="color:${C.dark}">Abholen bei uns</strong><br>${esc(SITE.street)}<br>${esc(SITE.zipCity)} · <a href="${SITE.mapsUrl}" style="color:${C.accent}">Route öffnen</a>`;

  const body = `
${para(`${firstName ? `Hallo ${esc(firstName)}, d` : "D"}eine Bestellung ist bei uns eingegangen${paidOnline ? " und bezahlt" : ""}. Wir legen ${delivery ? "frisch los und bringen sie dir" : "frisch los – sie wartet dann an der Theke auf dich"}.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px;border-collapse:separate;border-spacing:0 8px"><tr>
${infoCell(delivery ? "Lieferung" : "Abholung", when, asap ? "Schnellstmöglich" : undefined)}
<td style="width:8px"></td>
${infoCell("Zahlung", PAYMENT[order.payment], paidOnline ? "Bezahlt" : "Bezahlen bei Abholung")}
</tr></table>
${button(statusUrl, "Live-Status ansehen")}
<p style="margin:0 0 26px;font-family:${SANS};font-size:13px;color:${C.muted}">Dort siehst du, wann deine Bestellung in Zubereitung und ${delivery ? "unterwegs" : "abholbereit"} ist.</p>

<p style="margin:0;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${C.muted}">Deine Bestellung · #${esc(order.id)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px">
${rows}
${delivery || fee > 0 ? sumRow("Zwischensumme", euro(subtotal)) : ""}
${fee > 0 ? sumRow("Liefergebühr", euro(fee)) : ""}
${sumRow("Gesamt", euro(order.total), true)}
<tr><td colspan="3" align="right" style="padding-top:2px;font-family:${SANS};font-size:12px;color:${C.muted}">inkl. MwSt.</td></tr>
</table>
${order.note ? `<div style="margin-top:22px;padding:14px 16px;border-left:3px solid ${C.accent};background:${C.cream};font-family:${SANS};font-size:14px;line-height:21px;color:#3b3835"><strong>Deine Notiz:</strong> ${esc(order.note)}</div>` : ""}
<div style="margin-top:26px;padding:18px 20px;border:1px solid ${C.line};border-radius:16px;font-family:${SANS};font-size:14px;line-height:22px;color:${C.muted}">${where}</div>
<p style="margin:22px 0 0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.muted}">Fragen oder Änderungen? Ruf uns an: <a href="${SITE.phoneHref}" style="color:${C.accent};font-weight:700">${esc(SITE.phone)}</a></p>`;

  const text = [
    `${firstName ? `Hallo ${firstName}, d` : "D"}anke für deine Bestellung #${order.id} bei ${SITE.name}!`,
    "",
    `${delivery ? "Lieferung" : "Abholung"}: ${asap ? `schnellstmöglich, ca. ${clock}` : order.pickupLabel}`,
    `Zahlung: ${PAYMENT[order.payment].replace("&amp;", "&")}${paidOnline ? " (bezahlt)" : " (bei Abholung)"}`,
    "",
    ...order.items.map((item) => `${item.qty}× ${item.name}${item.detail ? ` (${item.detail})` : ""} – ${(item.price * item.qty).toFixed(2).replace(".", ",")} €`),
    ...(fee > 0 ? [`Liefergebühr – ${fee.toFixed(2).replace(".", ",")} €`] : []),
    `Gesamt: ${order.total.toFixed(2).replace(".", ",")} € (inkl. MwSt.)`,
    ...(order.note ? ["", `Deine Notiz: ${order.note}`] : []),
    "",
    `Live-Status: ${statusUrl}`,
    "",
    delivery && order.address ? `Lieferung an: ${order.address.street}, ${order.address.zip} ${order.address.city}` : `Abholen bei: ${SITE.street}, ${SITE.zipCity}`,
    `Fragen? ${SITE.phone}`,
  ].join("\n");

  return {
    to: order.contact.email,
    subject: `Bestellung #${order.id} bestätigt – ${delivery ? "Lieferung" : "Abholung"} ${asap ? `ca. ${clock}` : order.pickupLabel}`,
    html: layout({
      preheader: `${delivery ? "Lieferung" : "Abholung"} ${asap ? `ca. ${clock}` : order.pickupLabel} · ${order.items.length} ${order.items.length === 1 ? "Position" : "Positionen"} · ${order.total.toFixed(2).replace(".", ",")} €`,
      eyebrow: `Bestellung #${esc(order.id)}`,
      title: "Danke für deine",
      accent: "Bestellung.",
      body,
      footerNote: "Du bekommst diese E-Mail, weil du auf unserer Website bestellt hast. Wir verwenden deine Adresse nur für diese Bestellung.",
    }),
    text,
  };
}

const TEAM_NOTE = "Diese E-Mail betrifft den internen Bereich (Dashboard &amp; Küche). Wenn du damit nichts zu tun hast, kannst du sie einfach ignorieren.";

/** Einladung ins Team: Link legt das Konto an und führt zum Passwort-Festlegen. */
export function teamInviteEmail(to: string, link: string, stats: boolean): EmailMessage {
  const perks = ["Bestellungen live sehen und bearbeiten", "Küchen-Ansicht als App aufs Handy oder Tablet", "Gerichte als ausverkauft markieren, Online-Bestellungen pausieren", ...(stats ? ["Umsatz, Statistiken und Kunden"] : [])];
  const body = `
${para(`Du wurdest ins Team von ${esc(SITE.name)} eingeladen. Über den Knopf legst du dein Passwort fest – danach bist du direkt im Dashboard.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;background:${C.soft};border-radius:16px"><tr><td style="padding:16px 18px">
<div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.muted};margin-bottom:8px">Dein Zugang</div>
${perks.map((perk) => `<div style="font-family:${SANS};font-size:14px;line-height:24px;color:${C.dark}"><span style="color:${C.accent};font-weight:700">✓</span>&nbsp; ${perk}</div>`).join("")}
</td></tr></table>
${button(link, "Einladung annehmen")}
<p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted}">Angemeldet wirst du mit <strong style="color:${C.dark}">${esc(to)}</strong>. Der Link ist aus Sicherheitsgründen nur begrenzt gültig – ist er abgelaufen, schickt dir der Inhaber einfach eine neue Einladung.</p>
${fallbackLink(link)}`;
  return {
    to,
    subject: `Einladung ins Team von ${SITE.name}`,
    html: layout({ preheader: "Lege dein Passwort fest und du bist direkt im Dashboard.", eyebrow: "Einladung", title: "Willkommen", accent: "im Team.", body, footerNote: TEAM_NOTE }),
    text: `Du wurdest ins Team von ${SITE.name} eingeladen.\n\nZugang: ${perks.join(", ")}.\n\nEinladung annehmen und Passwort festlegen:\n${link}\n\nAnmeldung mit: ${to}. Der Link ist nur begrenzt gültig.`,
  };
}

/** "Passwort vergessen" im internen Bereich. */
export function passwordResetEmail(to: string, link: string): EmailMessage {
  const body = `
${para("Für dein Konto im Dashboard wurde ein neues Passwort angefordert. Über den Knopf legst du es fest – das alte gilt dann nicht mehr.")}
${button(link, "Neues Passwort festlegen")}
<p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted}">Warst du das nicht? Dann ignoriere diese E-Mail – dein bisheriges Passwort bleibt gültig.</p>
${fallbackLink(link)}`;
  return {
    to,
    subject: "Neues Passwort festlegen",
    html: layout({ preheader: "Lege ein neues Passwort für Dashboard und Küche fest.", eyebrow: "Konto &amp; Sicherheit", title: "Neues", accent: "Passwort.", body, footerNote: TEAM_NOTE }),
    text: `Für dein Konto (${to}) wurde ein neues Passwort angefordert.\n\nNeues Passwort festlegen:\n${link}\n\nWarst du das nicht? Dann ignoriere diese E-Mail.`,
  };
}

/** E-Mail-Wechsel: je ein Link an die neue und an die bisherige Adresse. */
export function emailChangeEmail(to: string, link: string, change: { from: string; to: string }, target: "new" | "current"): EmailMessage {
  const isNew = target === "new";
  const body = `
${para(isNew
    ? `Diese Adresse soll künftig für dein Konto im Dashboard gelten (bisher <strong>${esc(change.from)}</strong>). Bitte bestätige sie über den Knopf.`
    : `Für dein Konto im Dashboard wurde ein Wechsel auf <strong>${esc(change.to)}</strong> angefordert. Bitte bestätige ihn auch von dieser Adresse aus.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;background:${C.soft};border-radius:16px"><tr><td style="padding:16px 18px;font-family:${SANS};font-size:14px;line-height:22px;color:${C.dark}">
<span style="color:${C.muted}">Bisher:</span> ${esc(change.from)}<br><span style="color:${C.muted}">Neu:</span> <strong>${esc(change.to)}</strong>
</td></tr></table>
${button(link, isNew ? "Neue E-Mail bestätigen" : "Wechsel bestätigen")}
<p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted}">${isNew ? "Erst nach der Bestätigung gilt die neue Adresse – dein Zugang zieht automatisch mit." : "Warst du das nicht? Dann bestätige nichts und ändere sicherheitshalber dein Passwort."}</p>
${fallbackLink(link)}`;
  return {
    to,
    subject: isNew ? "Neue E-Mail-Adresse bestätigen" : "E-Mail-Wechsel bestätigen",
    html: layout({ preheader: `Wechsel von ${change.from} auf ${change.to} bestätigen.`, eyebrow: "Konto &amp; Sicherheit", title: isNew ? "Neue E-Mail" : "E-Mail-Wechsel", accent: "bestätigen.", body, footerNote: TEAM_NOTE }),
    text: `E-Mail-Wechsel für dein Konto: ${change.from} → ${change.to}.\n\nBestätigen:\n${link}\n\n${isNew ? "Erst danach gilt die neue Adresse." : "Warst du das nicht? Bestätige nichts und ändere dein Passwort."}`,
  };
}
