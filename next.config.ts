import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-map-gl", "maplibre-gl"],
  allowedDevOrigins: [process.env.NEXT_PUBLIC_LOCAL_DEV_IP as string],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.NEXT_PUBLIC_API_HOST}/:path*` }];
  },
};

export default nextConfig;
