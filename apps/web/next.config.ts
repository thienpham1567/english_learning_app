import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/shared",
    "@repo/contracts",
    "@repo/database",
    "@repo/auth",
    "@repo/modules",
  ],
  async redirects() {
    return [
      {
        source: "/toeic-practice",
        destination: "/toeic/practice",
        permanent: true,
      },
      {
        source: "/toeic-practice/:path*",
        destination: "/toeic/practice/:path*",
        permanent: true,
      },
      {
        source: "/toeic-skills",
        destination: "/toeic/skills",
        permanent: true,
      },
      {
        source: "/toeic-skills/:path*",
        destination: "/toeic/skills/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
