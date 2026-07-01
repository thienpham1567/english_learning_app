import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/shared",
    "@repo/contracts",
    "@repo/database",
    "@repo/auth",
    "@repo/modules",
  ],
  images: {
    remotePatterns: [
      // Pexels — Part 1 photos + Writing/Speaking pictures
      { protocol: "https", hostname: "images.pexels.com" },
      // ETS scrape — Part 6/7 image passages
      { protocol: "https", hostname: "apiquanlytest.tienganhthayquy.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/toeic-skills",
        destination: "/toeic",
        permanent: true,
      },
      {
        source: "/toeic-skills/:path*",
        destination: "/toeic",
        permanent: true,
      },
      {
        source: "/grammar-quiz",
        destination: "/toeic/grammar",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
