import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "api.qrserver.com" }],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "firebase-admin"],
};

export default nextConfig;
