"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/admin/NotificationBell";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📦", badgeKey: "pending" as const },
  { href: "/admin/products", label: "Products", icon: "🎆" },
  { href: "/admin/categories", label: "Categories", icon: "🏷️" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminShell({
  name,
  email,
  children,
}: {
  name: string;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders?.pending != null) setPendingOrders(data.orders.pending);
      })
      .catch(() => {});
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-brandbg text-ink">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-primary px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 lg:hidden"
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-lg">
              🎆
            </span>
            <span className="font-display text-lg font-bold">SRK Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold leading-tight">{name}</div>
            <div className="text-[0.7rem] text-white/70">{email}</div>
          </div>
          <Link
            href="/admin/settings"
            className="hidden rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/25 sm:inline-block"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/25"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-20 mt-14 w-56 transform border-r border-line bg-white p-4 transition-transform lg:static lg:mt-0 lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive(item.href)
                    ? "bg-primary text-white"
                    : "text-ink hover:bg-brandbg",
                )}
              >
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badgeKey === "pending" && pendingOrders > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                      isActive(item.href) ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {pendingOrders}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            target="_blank"
            className="mt-6 block rounded-lg border border-line px-3 py-2.5 text-center text-xs font-medium text-ink-muted transition hover:border-primary hover:text-primary"
          >
            View Storefront ↗
          </Link>
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-10 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
