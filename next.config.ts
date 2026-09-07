import type { NextConfig } from "next";

const STATIC_ASSET_CACHE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "api.qrserver.com" }],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "firebase-admin"],
  async headers() {
    return [
      {
        source: "/products/:path*",
        headers: [{ key: "Cache-Control", value: STATIC_ASSET_CACHE }],
      },
      {
        source: "/shop/:path*",
        headers: [{ key: "Cache-Control", value: STATIC_ASSET_CACHE }],
      },
      {
        source: "/lottie/:path*",
        headers: [{ key: "Cache-Control", value: STATIC_ASSET_CACHE }],
      },
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: STATIC_ASSET_CACHE }],
      },
    ];
  },
};

export default nextConfig;
