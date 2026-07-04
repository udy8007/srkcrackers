"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const DEFAULT_FALLBACK = "/products/default.svg";

type SafeImageProps = ImageProps & {
  fallbackSrc?: string;
};

/** next/image wrapper that swaps to a fallback when the source fails to load. */
export function SafeImage({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: SafeImageProps) {
  const [current, setCurrent] = useState(src);
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
