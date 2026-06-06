import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-to-img", "unpdf"],
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/dashboard/:path*", destination: "/", permanent: false },
      { source: "/pricing", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
