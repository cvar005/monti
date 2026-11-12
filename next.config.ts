import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads the signed-in user's data, so pages render per request.
  // Lets a phone on the same Wi-Fi open the dev server (e.g. http://192.168.1.5:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
