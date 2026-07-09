import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AdminPagination({ page, totalPages, onPageChange, className }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-line px-4 py-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-xs text-ink-muted">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
