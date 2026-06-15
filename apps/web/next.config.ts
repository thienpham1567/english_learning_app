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
      {
        source: "/writing-practice/score",
        destination: "/toeic/writing/score",
        permanent: true,
      },
      {
        source: "/writing-practice",
        destination: "/toeic/writing",
        permanent: true,
      },
      {
        source: "/listening",
        destination: "/toeic/listening",
        permanent: true,
      },
      {
        source: "/speaking-practice",
        destination: "/toeic/speaking",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
