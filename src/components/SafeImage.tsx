"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/products/photos/2-kuruvi.jpg";

type SafeImageProps = ImageProps & {
  fallbackSrc?: string;
};

/** next/image wrapper that swaps to a fallback when the source fails to load. */
export function SafeImage({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: SafeImageProps) {
  const [current, setCurrent] = useState(src);
  useEffect(() => setCurrent(src), [src]);
  const isDataUrl = typeof current === "string" && current.startsWith("data:");

  if (isDataUrl) {
    const { width, height, className, style } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={current as string}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        onError={() => {
          if (current !== fallbackSrc) setCurrent(fallbackSrc);
        }}
      />
    );
  }

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      onError={() => {
        if (current !== fallbackSrc) setCurrent(fallbackSrc);
      }}
    />
  );
}
