import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/shared",
    "@repo/contracts",
    "@repo/database",
    "@repo/auth",
    "@repo/modules",
  ],
};

export default nextConfig;
