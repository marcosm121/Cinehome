import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "tmdb-images",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      {
        urlPattern: /^\/api\/movies\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "movie-api",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 6 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
  output: "standalone",
};

export default withPWA(nextConfig);
