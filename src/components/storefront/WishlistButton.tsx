"use client";

import { useMounted } from "@/lib/hooks";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/store/toast";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function WishlistButton({
  productId,
  productName,
  className = "",
  size = "md",
  showLabel = false,
}: WishlistButtonProps) {
  const mounted = useMounted();
  const ids = useWishlist((state) => state.ids);
  const toggle = useWishlist((state) => state.toggle);
  const showToast = useToast((state) => state.show);
  const active = mounted && ids.includes(productId);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const added = toggle(productId);
    showToast(
      added ? `Added ${productName} to wishlist ❤️` : `Removed ${productName} from wishlist`,
    );
  };

  const dim = showLabel
    ? "h-10 px-3"
    : size === "sm"
      ? "h-9 w-9"
      : "h-10 w-10";
  const icon = size === "sm" ? "text-base" : "text-lg";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      aria-pressed={active}
      className={`wishlist-heart inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border bg-white/95 shadow-md backdrop-blur-sm transition hover:scale-105 active:scale-95 ${dim} ${
        active
          ? "wishlist-heart--active border-primary/25 text-primary"
          : "border-white/70 text-ink-muted hover:border-primary/20 hover:text-primary"
      } ${className}`}
    >
      <span className={`${icon} leading-none ${active ? "animate-pop" : ""}`} aria-hidden>
        {active ? "❤️" : "🤍"}
      </span>
      {showLabel && (
        <span className="pr-1 text-xs font-bold">{active ? "Saved" : "Wishlist"}</span>
      )}
    </button>
  );
}
