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
