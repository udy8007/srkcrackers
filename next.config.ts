import type { NextConfig } from "next";

const STATIC_ASSET_CACHE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  output: "standalone",
  // Cap compile/static-generation workers so CloudLinux 2 GB PMEM can finish `next build`.
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
    staticGenerationMaxConcurrency: 1,
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "api.qrserver.com" }],
  },
  serverExternalPackages: [
    "@prisma/client",
    "mysql2",
    "bcryptjs",
    "firebase-admin",
  ],
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
