import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // wersja wdrożenia wpisana w kod strony: ekran TV porównuje ją z /api/wersja i po wdrożeniu sam się przeładowuje
  env: {
    NEXT_PUBLIC_WERSJA: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },
  experimental: {
    serverActions: {
      // grafiki do 5 MB + zapas na resztę formularza
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
