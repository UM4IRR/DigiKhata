import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Force Turbopack to only look within the project directory
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

