"use client";

import { useCallback, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

interface ProductImageUploadProps {
  imageUrl: string;
  alt?: string;
  uploading?: boolean;
  /** sm = list thumbnail, lg = add/edit form */
  size?: "sm" | "lg";
  onFile: (file: File) => void;
  /** Optional manual URL override below the drop zone (lg only) */
  showUrlField?: boolean;
  onUrlChange?: (url: string) => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ProductImageUpload({
  imageUrl,
  alt = "Product",
  uploading = false,
  size = "lg",
  onFile,
  showUrlField = false,
  onUrlChange,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback(
    (files: FileList | null) => {
      setError(null);
      const file = files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10 MB.");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!uploading) pickFile(e.dataTransfer.files);
  };

  const openBrowse = () => {
    if (!uploading) inputRef.current?.click();
  };

  if (size === "sm") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openBrowse}
        onKeyDown={(e) => e.key === "Enter" && openBrowse()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative shrink-0 cursor-pointer rounded-lg outline-none ring-primary focus-visible:ring-2",
          dragOver && "ring-2 ring-primary",
        )}
        title="Drag & drop or click to change image"
      >
        <SafeImage
          src={imageUrl}
          alt={alt}
          width={56}
          height={56}
          className="h-14 w-14 rounded-lg object-cover"
        />
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/55 text-center text-[10px] font-bold leading-tight text-white transition",
            dragOver || uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {uploading ? (
            <span className="animate-pulse">Uploading…</span>
          ) : dragOver ? (
            <span>Drop here</span>
          ) : (
            <>
              <span>Change</span>
              <span className="mt-0.5 font-normal opacity-80">or drop</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed transition",
          dragOver ? "border-primary bg-primary/5" : "border-line bg-brandbg/50",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <div className="flex flex-col items-center gap-3 p-4 sm:flex-row sm:p-5">
          <div className="relative shrink-0 overflow-hidden rounded-lg border border-line bg-white">
            <SafeImage
              src={imageUrl}
              alt={alt}
              width={160}
              height={160}
              className="h-32 w-32 object-contain p-2 sm:h-36 sm:w-36"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <span className="text-sm font-semibold text-primary animate-pulse">Uploading…</span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
            <p className="text-sm font-semibold text-ink">
              {dragOver ? "Drop image to upload" : "Product photo"}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Drag & drop an image here, or browse from your computer
            </p>
            <p className="mt-0.5 text-[0.65rem] text-ink-muted">JPG, PNG, WebP · max 10 MB</p>
            <button
              type="button"
              onClick={openBrowse}
              disabled={uploading}
              className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-50"
            >
              Browse files
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red/10 px-3 py-2 text-xs font-medium text-red">{error}</p>
      )}

      {showUrlField && onUrlChange && (
        <label className="block text-xs">
          <span className="mb-1 block font-semibold text-ink-muted">Or paste image URL</span>
          <input
            className="input py-1.5 font-mono text-xs"
            value={imageUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="/products/photos/... or https://..."
          />
        </label>
      )}
    </div>
  );
}
