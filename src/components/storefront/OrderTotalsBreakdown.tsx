import { BUSINESS } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

export function OrderTotalsBreakdown({
  subtotal,
  shipping,
  total,
  className,
  compact,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact ? "space-y-0.5 text-xs" : "space-y-1 text-sm", className)}>
      <div className="flex justify-between gap-2 text-ink-muted">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between gap-2 text-ink-muted">
        <span>Shipping</span>
        <span>
          {shipping === 0 ? (
            <span className="font-semibold text-green">FREE</span>
          ) : (
            formatPrice(shipping)
          )}
        </span>
      </div>
      {shipping > 0 && !compact && (
        <p className="text-xs text-ink-muted">
          Add {formatPrice(BUSINESS.freeDeliveryMin - subtotal)} more for free delivery
        </p>
      )}
      <div
        className={cn(
          "flex justify-between gap-2 border-t border-line pt-2 font-bold text-primary",
          compact && "text-sm",
        )}
      >
        <span>Grand Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
