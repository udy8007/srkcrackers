"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useCatalog } from "./catalog-context";
import { useUI } from "@/store/ui";
import { useCart } from "@/store/cart";
import { formatPrice, discountPercent } from "@/lib/utils";

const ZOOM = 2.15;

function MagicProductZoom({ src, alt }: { src: string; alt: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const updateFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPos({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative h-full min-h-[280px] w-full cursor-zoom-in overflow-hidden rounded-[1.35rem] sm:min-h-0"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={(e) => updateFromPoint(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        setActive(true);
        const t = e.touches[0];
        if (t) updateFromPoint(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        const t = e.touches[0];
        if (t) updateFromPoint(t.clientX, t.clientY);
      }}
      onTouchEnd={() => setActive(false)}
    >
      {/* Stage glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255,195,0,0.28), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(214,40,40,0.12), transparent 60%)",
        }}
      />

      {/* Spark dots */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[12%] top-[18%] h-1.5 w-1.5 rounded-full bg-yellow animate-[twinkle_2.4s_ease-in-out_infinite]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-[16%] top-[28%] h-1 w-1 rounded-full bg-orange animate-[twinkle_1.8s_ease-in-out_infinite_0.4s]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[22%] left-[22%] h-1 w-1 rounded-full bg-primary-bright animate-[twinkle_2.1s_ease-in-out_infinite_0.8s]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[30%] right-[18%] h-1.5 w-1.5 rounded-full bg-gold animate-[twinkle_2.6s_ease-in-out_infinite_1.1s]"
      />

      <div
        className="absolute inset-0 flex items-center justify-center p-6 transition-transform duration-200 ease-out will-change-transform sm:p-10"
        style={{
          transform: active ? `scale(${ZOOM})` : "scale(1)",
          transformOrigin: `${pos.x}% ${pos.y}%`,
        }}
      >
        <SafeImage
          src={src}
          alt={alt}
          width={720}
          height={720}
          className="h-full max-h-[420px] w-full object-contain drop-shadow-[0_18px_35px_rgba(157,2,8,0.18)] sm:max-h-none"
          priority
        />
      </div>

      {/* Glass rim */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[1.35rem] border transition duration-300 ${
          active
            ? "border-yellow/80 shadow-[inset_0_0_60px_rgba(255,195,0,0.18)]"
            : "border-white/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
        }`}
      />

      {/* Focus bloom under cursor */}
      <div
        aria-hidden
        className={`pointer-events-none absolute z-[2] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full transition duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,195,0,0.18) 35%, transparent 70%)",
          mixBlendMode: "soft-light",
        }}
      />

      <p
        className={`pointer-events-none absolute bottom-4 left-1/2 z-[3] -translate-x-1/2 rounded-full border border-white/30 bg-ink/55 px-3.5 py-1.5 text-[0.65rem] font-semibold tracking-wide text-white shadow-lg backdrop-blur-md transition duration-300 ${
          active ? "translate-y-2 opacity-0" : "opacity-100"
        }`}
      >
        Move to explore · magic zoom
      </p>
    </div>
  );
}

export function ProductModal() {
  const { getProduct, categories } = useCatalog();
  const productModalId = useUI((s) => s.productModalId);
  const closeProduct = useUI((s) => s.closeProduct);
  const changeQty = useCart((s) => s.changeQty);
  const qty = useCart((s) => (productModalId ? s.items[productModalId] ?? 0 : 0));

  const product = productModalId ? getProduct(productModalId) : undefined;

  useEffect(() => {
    if (!product) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProduct();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [product, closeProduct]);

  if (!product) return null;

  const categoryLabel = categories.find((c) => c.key === product.categoryKey)?.label ?? "";
  const off = discountPercent(product.mrp, product.price);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-stretch justify-center bg-[#1a0f0f]/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onClick={closeProduct}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="animate-pop relative flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-[#fff8f2] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:h-[min(90dvh,820px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient festival wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 15% 0%, rgba(255,195,0,0.22), transparent 55%), radial-gradient(ellipse 45% 35% at 100% 10%, rgba(214,40,40,0.14), transparent 50%), linear-gradient(180deg, #fff3e6 0%, #fff8f2 42%, #ffffff 100%)",
          }}
        />

        {/* Top bar */}
        <div className="relative z-20 flex items-center gap-3 border-b border-line/80 bg-white/55 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {categoryLabel}
            </p>
            <h4 className="truncate font-display text-base font-bold text-ink sm:text-lg">
              {product.name}
            </h4>
            {product.nameTa ? (
              <p className="truncate text-sm text-ink/75" lang="ta">
                {product.nameTa}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeProduct}
            aria-label="Close product details"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg text-ink shadow-sm transition hover:scale-105 hover:border-primary hover:bg-primary hover:text-white active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Body: stacked mobile / split desktop */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Image stage */}
          <div className="relative flex shrink-0 items-stretch justify-center px-4 pb-2 pt-4 sm:px-6 lg:w-[54%] lg:px-7 lg:pb-7 lg:pt-6">
            <div className="relative w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white via-[#fffaf4] to-[#ffe8cc] p-[1px] shadow-[0_20px_50px_-24px_rgba(157,2,8,0.35)] lg:h-full">
              <div className="h-full rounded-[calc(1.5rem-1px)] bg-gradient-to-b from-[#fffdf9] to-[#fff1de]">
                <MagicProductZoom src={product.imageUrl} alt={product.name} />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="relative flex min-h-0 flex-1 flex-col lg:w-[46%]">
            <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-28 pt-3 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
              <div>
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-primary">
                  {categoryLabel}
                </span>
                <h3 className="mt-3 font-display text-[1.65rem] font-bold leading-tight text-ink sm:text-3xl">
                  {product.name}
                </h3>
                {product.nameTa ? (
                  <p className="mt-1 text-lg leading-snug text-ink/80" lang="ta">
                    {product.nameTa}
                  </p>
                ) : null}
                <p className="mt-1.5 text-sm text-ink-muted">{product.pack}</p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                    Offer price
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-2.5">
                    <span className="font-display text-3xl font-bold text-green sm:text-4xl">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-base text-ink-muted line-through">
                      {formatPrice(product.mrp)}
                    </span>
                  </div>
                </div>
                <span className="mb-1 rounded-full bg-gradient-to-r from-red to-primary-dark px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {off}% OFF
                </span>
              </div>

              <div className="rounded-2xl border border-line/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Product description
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{product.description}</p>
              </div>

              {/* Desktop qty */}
              <div className="hidden items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm lg:flex">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">Quantity</span>
                  <div className="inline-flex items-center overflow-hidden rounded-xl border border-line">
                    <button
                      type="button"
                      onClick={() => changeQty(product.id, -1)}
                      className="flex h-11 w-11 items-center justify-center bg-brandbg text-lg font-bold text-primary transition hover:bg-line"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-base font-bold">{qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(product.id, 1)}
                      className="flex h-11 w-11 items-center justify-center bg-primary text-lg font-bold text-white transition hover:bg-primary-dark"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                    Line amount
                  </div>
                  <strong className="font-display text-xl text-primary">
                    {formatPrice(qty * product.price)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Mobile sticky cart bar */}
            <div className="absolute inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-12px_30px_-18px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => changeQty(product.id, -1)}
                    className="flex h-11 w-11 items-center justify-center bg-brandbg text-lg font-bold text-primary"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(product.id, 1)}
                    className="flex h-11 w-11 items-center justify-center bg-primary text-lg font-bold text-white"
                  >
                    +
                  </button>
                </div>
                <div className="min-w-0 text-right">
                  <div className="text-[0.65rem] text-ink-muted">Line amount</div>
                  <strong className="block truncate text-lg text-primary">
                    {formatPrice(qty * product.price)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
