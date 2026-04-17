import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
