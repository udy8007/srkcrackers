import { BUSINESS } from "@/lib/constants";
import { cn, formatPrice, meetsMinOrder, minOrderShortfall } from "@/lib/utils";

export function OrderTotalsBreakdown({
  subtotal,
  shipping,
  total,
  className,
  compact,
  deliveryCity,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  className?: string;
  compact?: boolean;
  /** Customer delivery city — shown on shipping line when provided. */
  deliveryCity?: string;
}) {
  const belowMin = !meetsMinOrder(subtotal);
  const city = deliveryCity?.trim();
  const shippingLabel = city ? `Shipping (${city})` : "Shipping";

  return (
    <div className={cn(compact ? "space-y-0.5 text-xs" : "space-y-1 text-sm", className)}>
      <div className="flex justify-between gap-2 text-ink-muted">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      {!belowMin && (
        <div className="flex justify-between gap-2 text-ink-muted">
          <span>{shippingLabel}</span>
          <span>{formatPrice(shipping)}</span>
        </div>
      )}
      {belowMin && (
        <p className={cn("text-amber-700", compact ? "text-[0.65rem]" : "text-xs")}>
          Minimum order {formatPrice(BUSINESS.minOrderAmount)} · Add {formatPrice(minOrderShortfall(subtotal))} more
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
