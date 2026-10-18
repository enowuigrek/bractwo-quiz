import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // grafiki do 5 MB + zapas na resztę formularza
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
