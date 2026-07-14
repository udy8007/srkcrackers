import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Order, OrderItem, OrderStatusHistory } from "@/lib/db/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, formatPrice, getStoredShipping } from "@/lib/utils";
import { OrderActions } from "./OrderActions";
import { StatusUpdater } from "./StatusUpdater";
import { PaymentScreenshotEditor } from "./PaymentScreenshotEditor";
import { autoDeliverDueOrders } from "@/lib/auto-deliver";
import { notifyAutoDelivered } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type OrderDetail = Order & {
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deliveredIds = await autoDeliverDueOrders();
  notifyAutoDelivered(deliveredIds);
  const order = (await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  })) as OrderDetail | null;

  if (!order) notFound();

  const shipping = getStoredShipping(order.subtotal, order.total);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            ← Back to orders
          </Link>
          <h1 className="mt-1 break-all font-mono text-xl font-bold text-ink sm:text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status === "PAYMENT_PENDING" && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <strong>Incomplete checkout.</strong> Customer entered details and reached payment but did not
          finish. Call or WhatsApp them to complete the order.
        </div>
      )}

      <OrderActions
        orderId={order.id}
        orderNumber={order.orderNumber}
        status={order.status}
        createdAt={order.createdAt.toISOString()}
        customerName={order.customerName}
        phone={order.phone}
        altPhone={order.altPhone}
        email={order.email}
        address={order.address}
        city={order.city}
        state={order.state}
        pincode={order.pincode}
        paymentMethod={order.paymentMethod}
        upiId={order.upiId}
        total={order.total}
        subtotal={order.subtotal}
        shipping={shipping}
        items={order.items.map((i) => ({
          name: i.name,
          pack: i.pack,
          price: i.price,
          qty: i.qty,
          amount: i.amount,
        }))}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Items — stacked on mobile so nothing is clipped; table from sm up */}
          <Card title="Items">
            <ul className="space-y-3 sm:hidden">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-line bg-brandbg/60 px-3 py-2.5"
                >
                  <div className="font-medium text-ink">{item.name}</div>
                  <div className="text-xs text-ink-muted">{item.pack}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                    <span className="text-ink-muted">
                      {formatPrice(item.price)} × {item.qty}
                    </span>
                    <span className="font-semibold text-ink">{formatPrice(item.amount)}</span>
                  </div>
                </li>
              ))}
              <li className="space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Shipping</span>
                  <span>{shipping > 0 ? formatPrice(shipping) : "FREE"}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold text-primary">
                  <span>Grand Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </li>
            </ul>

            <div className="hidden max-w-full overflow-x-auto overscroll-x-contain sm:block">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-2 font-semibold">Product</th>
                    <th className="py-2 text-center font-semibold">Price</th>
                    <th className="py-2 text-center font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <td className="py-2.5">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-ink-muted">{item.pack}</div>
                      </td>
                      <td className="py-2.5 text-center">{formatPrice(item.price)}</td>
                      <td className="py-2.5 text-center">{item.qty}</td>
                      <td className="py-2.5 text-right font-semibold">{formatPrice(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-sm text-ink-muted">
                    <td colSpan={3} className="py-2 text-right">
                      Subtotal
                    </td>
                    <td className="py-2 text-right">{formatPrice(order.subtotal)}</td>
                  </tr>
                  <tr className="text-sm text-ink-muted">
                    <td colSpan={3} className="py-1 text-right">
                      Shipping
                    </td>
                    <td className="py-1 text-right">
                      {shipping > 0 ? formatPrice(shipping) : "FREE"}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-3 text-right font-semibold">
                      Grand Total
                    </td>
                    <td className="py-3 text-right text-lg font-bold text-primary">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Payment */}
          <Card title="Payment">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 text-sm">
                <Row label="Method" value={order.paymentMethod} />
                <Row label="UPI ID" value={order.upiId ?? "—"} />
                <Row label="Subtotal" value={formatPrice(order.subtotal)} />
                <Row
                  label="Shipping"
                  value={shipping > 0 ? formatPrice(shipping) : "FREE"}
                />
                <Row label="Amount" value={formatPrice(order.total)} />
              </div>
              <div>
                <PaymentScreenshotEditor
                  orderId={order.id}
                  status={order.status}
                  currentScreenshot={order.paymentScreenshot}
                />
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Status History">
            <ul className="space-y-3">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm font-medium">{entry.label}</div>
                    <div className="text-xs text-ink-muted">{formatDateTime(entry.createdAt)}</div>
                    {entry.note && <div className="text-xs text-ink">{entry.note}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Update Status">
            <StatusUpdater
              orderId={order.id}
              currentStatus={order.status}
              expectedDeliveryAt={order.expectedDeliveryAt}
            />
          </Card>

          <Card title="Customer">
            <div className="space-y-1 text-sm">
              <Row label="Name" value={order.customerName} />
              <Row label="Phone" value={order.phone} />
              {order.altPhone && <Row label="Alt Phone" value={order.altPhone} />}
              {order.email && <Row label="Email" value={order.email} />}
              <Row label="Address" value={order.address} />
              <Row label="City" value={order.city} />
              <Row label="State" value={order.state} />
              <Row label="Pincode" value={order.pincode} />
              {order.notes && <Row label="Notes" value={order.notes} />}
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={`tel:${order.phone}`}
                className="btn-outline flex-1 py-2 text-xs"
              >
                📞 Call
              </a>
              <a
                href={`https://wa.me/91${order.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-yellow flex-1 py-2 text-xs"
              >
                💬 WhatsApp
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-ink-muted">{label}</span>
      <span className="min-w-0 break-words font-medium text-ink">{value}</span>
    </div>
  );
}
