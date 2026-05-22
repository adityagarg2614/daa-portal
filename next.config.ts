import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfigDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  turbopack: {
    root: nextConfigDir,
  },
};

export default nextConfig;
