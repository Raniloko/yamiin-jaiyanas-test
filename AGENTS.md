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
- Sold-out items/options (`public.menu_availability`) and the online-order pause (`public.shop_status`) are enforced by the `orders_check_available` trigger (`supabase/sql/0003_availability.sql`); `src/lib/availability.ts` only mirrors them in the UI — keep keys as `item:<menu name>` / `option:<option value>`.
- Page imagery comes from the shop's own product photos in `src/assets/brand/` (cut-outs from the shop's digital menu, plus one real shop photo); `hero-bowl.jpg` is reserved for the homepage hero — never use third-party/customer photos.
- "Meine Bestellungen" works without accounts: the device keeps its per-order guest tokens; `useMyOrders()` / `ActiveOrderPill` read live status only via `getGuestOrder` and merely cache it with `orderStore.remember()`.
- Admins change their own email/password in "Konto & Sicherheit" (`src/components/admin/account-sheet.tsx`, current password re-checked); the `on_auth_email_change_transfer_admin` trigger (`supabase/sql/0004_admin_email_change.sql`) moves the `admin_emails` entry (with role and stats right) to the new address once Supabase confirms the change.
- Team & Rechte (`src/components/admin/team-sheet.tsx`, owner only): `admin_emails.role` (`owner`/`staff`) and `can_view_stats` are changed only via `public.owner_set_access()`, and accounts are created only by invitation (`inviteTeamMember` in `src/utils/team.functions.ts`); the `before_auth_user_insert_require_invite` trigger (`supabase/sql/0006_team_roles.sql`) blocks self sign-up. Statistics (`admin_menu_analytics`, `menu_events`, order history older than 7 days) require `public.can_view_stats()` — never re-add a sign-up form or gate statistics only in the UI.
- Emails go through Resend via the Lovable connector gateway (`src/lib/email.server.ts`, secret `RESEND_API_KEY` + `LOVABLE_API_KEY`, sender domain `yamiin-jaiyanas.de`); designs live in `src/lib/email-templates.ts`. Order confirmations are sent once via `deliverOrderConfirmation()` (onsite right after ordering, online/PayPal only once the webhook marks them paid; `orders.confirmation_sent_at` dedupes). Team mails (invite, password reset, email change) use `auth.admin.generateLink()` server-side and are sent by us, rate-limited via `public.auth_mail_log` — never fall back to Supabase's default auth mails or call Resend from the browser.
