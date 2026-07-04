import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

const STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-slate-100 text-slate-700",
  PAYMENT_UPLOADED: "bg-blue-100 text-blue-700",
  VERIFYING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  DISPATCHED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
