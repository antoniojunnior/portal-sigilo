import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app", permanent: true },
      { source: "/dashboard/:path*", destination: "/app/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
