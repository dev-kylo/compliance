import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@compliance/shared-types",
    "@compliance/rules-engine",
    "@compliance/database",
  ],
};

export default nextConfig;
