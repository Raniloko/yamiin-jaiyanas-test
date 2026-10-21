import { createFileRoute } from "@tanstack/react-router";

import { AdminGate } from "@/components/admin/admin-gate";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";
import { appHead } from "@/lib/app-install";

export const Route = createFileRoute("/kitchen")({
  head: () => {
    const app = appHead("kitchen");
    return { meta: [{ title: "Küche – Yamiin & Jaiyana's" }, { name: "robots", content: "noindex, nofollow" }, ...app.meta], links: app.links };
  },
  component: () => <AdminGate title="Küche">{() => <KitchenBoard />}</AdminGate>,
});
