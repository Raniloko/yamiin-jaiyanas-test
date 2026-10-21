<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep restaurant menu content centralized in `src/lib/menu-data.ts` so filters, cards, and details never drift.
- Keep menu category IDs compatible with homepage hash links and use the shared cart store for menu selections so navigation never loses the order.
- Orders are stored in the `public.orders` table (Lovable Cloud) with realtime updates; `src/lib/order-store.ts` keeps localStorage only as instant cache/fallback — never reintroduce localStorage as the source of truth for order status.
- Online payments use Stripe Embedded Checkout with dynamic `price_data` line items built from the cart (menu prices already include VAT) — never create static Stripe products per menu item; the kitchen only shows online/PayPal orders after the webhook at `src/routes/api/public/payments/webhook.ts` marks them `paid`.
- Admin access (`/admin` dashboard, `/kitchen`) requires Supabase Auth plus a confirmed email listed in `public.admin_emails`; the database function `public.is_admin()` is the single source of truth and also guards RLS — never gate admin data only in the UI.
- Guests read their own order only through the server function `getGuestOrder` (`src/utils/orders.functions.ts`) with the per-order `access_token` stored on their device; never give `anon` select/update on `public.orders`.
- Menu interactions are logged anonymously to `public.menu_events` via `src/lib/analytics.ts` (no names, contacts, IPs or cookies); the dashboard reads them only through `public.admin_menu_analytics()`. SQL changes live in `supabase/sql/`.
- `/admin` and `/kitchen` are installable home-screen apps (iOS/Android) via `appHead()` in `src/lib/app-install.ts` and `public/app/*.webmanifest`; there is deliberately no service worker, so new deployments are never served stale.
