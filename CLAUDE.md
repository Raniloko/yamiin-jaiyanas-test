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
- No gradient washes as decoration, no fade-and-slide-up on every section. One deliberate motion moment per page at most; motion that answers a tap (add to cart, open sheet) is welcome. Respect `prefers-reduced-motion`. Exception (owner's decision): the light running around the main buttons (`.glow-cta`) is a brand signature and stays always on, on every device.
- Food is the hero: lead with the photo or the dish, not with a big number and a label.

## Copy

German, plain, sentence case. Buttons say what happens ("In den Warenkorb", "Jetzt bezahlen"), and the toast uses the same word. Errors say what went wrong and how to fix it.

## Check your work

After any UI change, open the page with the Playwright MCP (or the `webapp-testing` skill) at 390px and 1280px width, take screenshots and compare them with the existing pages before calling it done. Keyboard focus must stay visible.

## Shipping (approved by the owner, no extra confirmation needed)

When a change is finished and checked:

1. Push it to a feature branch and open a pull request against `main` (never push to `main` directly).
2. Wait for the PR's checks. Merge with a merge commit only when they are green, `tsc --noEmit` passes and `vite build` succeeds; if anything is red, fix it or report it instead of merging.
3. After the merge, wait until the Lovable project "Yamiin & Jaiyana's Healthy Bites" (`a267365a-66f8-4a54-bc15-d63972c4c8de`) has synced the merge commit, then publish it with the Lovable connector (`deploy_project`) and open the live site to confirm the change is there.
4. Tell the owner the PR link and that it is live.

Do not auto-publish when the change needs something outside the code: new or changed SQL in `supabase/sql/`, new secrets or environment variables, or Stripe/Resend settings. Open the PR, say what has to be set up first, and wait.
