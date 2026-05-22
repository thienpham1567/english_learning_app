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
        destination: "/toeic/skills",
        permanent: true,
      },
      {
        source: "/toeic-skills/:path*",
        destination: "/toeic/skills/:path*",
        permanent: true,
      },
      {
        source: "/grammar-quiz",
        destination: "/toeic/skills?tab=part5",
        permanent: true,
      },
      {
        source: "/writing-practice/score",
        destination: "/toeic/writing/score",
        permanent: true,
      },
      {
        source: "/writing-practice",
        destination: "/toeic/skills?tab=writing",
        permanent: true,
      },
      {
        source: "/listening",
        destination: "/toeic/skills?tab=listening",
        permanent: true,
      },
      {
        source: "/speaking-practice",
        destination: "/toeic/skills?tab=speaking",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
