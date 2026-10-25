@AGENTS.md

# Design rules (Yamiin Jaiyanas)

Project skills live in `.claude/skills/`: `frontend-design` (Anthropic), `shadcn` (shadcn/ui), `webapp-testing` (Anthropic). Use them for every UI change.

## The brand is fixed, not a default

- The warm palette is the shop's own identity, taken from its printed menu. Keep it. Colors only come from the oklch tokens in `src/styles.css`; never hardcode hex values or Tailwind palette colors like `bg-orange-500`.
- Fonts: **DM Serif Display** for display headlines only, **Manrope** for everything else. No third font, no Inter/Roboto/system defaults.
- `/admin` and `/kitchen` use the neutral `.admin-theme`; the public site stays warm. Never mix the two.
- Imagery: only the shop's own photos in `src/assets/brand/` (see AGENTS.md). No stock photos, no emoji as icons, no generic illustration.

## Avoid the generated-page tells

- No identical rounded cards in a grid with the same soft shadow. Vary hierarchy: one radius scale (`--radius`), used deliberately.
- No ALL-CAPS tracked eyebrow above every heading, no `A · B · C` meta strings, no `→` appended to buttons, no `01 / 02 / 03` markers unless the content really is a sequence.
- No highlighting a single word in a headline with color or italics.
- No gradient washes as decoration, no fade-and-slide-up on every section. One deliberate motion moment per page at most; motion that answers a tap (add to cart, open sheet) is welcome. Respect `prefers-reduced-motion`.
- Food is the hero: lead with the photo or the dish, not with a big number and a label.

## Copy

German, plain, sentence case. Buttons say what happens ("In den Warenkorb", "Jetzt bezahlen"), and the toast uses the same word. Errors say what went wrong and how to fix it.

## Check your work

After any UI change, open the page with the Playwright MCP (or the `webapp-testing` skill) at 390px and 1280px width, take screenshots and compare them with the existing pages before calling it done. Keyboard focus must stay visible.
