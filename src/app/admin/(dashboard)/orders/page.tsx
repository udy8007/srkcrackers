import { Suspense } from "react";
import { OrdersManager } from "./OrdersManager";

export const metadata = {
  title: "Orders — SRK Crackers Admin",
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading orders...</p>}>
      <OrdersManager />
    </Suspense>
  );
}
