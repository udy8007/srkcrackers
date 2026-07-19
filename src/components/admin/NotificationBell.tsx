"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  orderNumber: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clearing, setClearing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=15");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = async (ids: string[]) => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    void load();
  };

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    void load();
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications? This cannot be undone.")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/admin/notifications", { method: "DELETE" });
      if (!res.ok) return;
      setItems([]);
      setUnreadCount(0);
    } finally {
      setClearing(false);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return "📦";
      case "PENDING_REMINDER":
        return "⏰";
      case "DB_BACKUP":
        return "💾";
      case "STATUS_CHANGE":
        return "🔄";
      case "REPORT_READY":
        return "📉";
      default:
        return "🔔";
    }
  };

  const itemHref = (item: NotificationItem) => {
    if (item.orderId) return `/admin/orders/${item.orderId}`;
    if (item.type === "REPORT_READY") return "/admin/reports";
    if (item.type === "DB_BACKUP") return "/admin/settings";
    return null;
  };

  const itemLinkLabel = (item: NotificationItem) => {
    if (item.orderId) return "View order";
    if (item.type === "REPORT_READY") return "Open reports";
    if (item.type === "DB_BACKUP") return "Open settings";
    return "Open";
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg transition hover:bg-white/25"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow px-1 text-[0.6rem] font-bold text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-display text-sm font-bold text-ink">Notifications</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  disabled={clearing}
                  className="text-xs font-semibold text-red hover:underline disabled:opacity-50"
                >
                  {clearing ? "Clearing…" : "Clear all"}
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">No notifications yet</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "border-b border-line px-4 py-3 transition hover:bg-brandbg",
                    !item.read && "bg-amber-50/50",
                  )}
                >
                  <div className="flex gap-2">
                    <span className="text-lg">{typeIcon(item.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">{item.message}</p>
                      <p className="mt-1 text-[0.65rem] text-ink-muted">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {itemHref(item) && (
                          <Link
                            href={itemHref(item)!}
                            onClick={() => {
                              if (!item.read) void markRead([item.id]);
                              setOpen(false);
                            }}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {itemLinkLabel(item)}
                          </Link>
                        )}
                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => void markRead([item.id])}
                            className="text-xs text-ink-muted hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
