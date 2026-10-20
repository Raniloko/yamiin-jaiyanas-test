import { createFileRoute } from "@tanstack/react-router";

import { AdminGate } from "@/components/admin/admin-gate";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";

export const Route = createFileRoute("/kitchen")({
  head: () => ({ meta: [{ title: "Küche – Yamiin & Jaiyana's" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <AdminGate title="Küche">{() => <KitchenBoard />}</AdminGate>,
});
