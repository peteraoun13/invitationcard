import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm|mp3|ogg)$/i,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
