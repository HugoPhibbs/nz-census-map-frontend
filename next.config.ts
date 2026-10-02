import type { NextConfig } from "next";

const apiHost = process.env.NEXT_PUBLIC_API_HOST;
if (!apiHost) {
  throw new Error("NEXT_PUBLIC_API_HOST environment variable is not set");
}

const nextConfig: NextConfig = {
  transpilePackages: ["react-map-gl", "maplibre-gl"],
  allowedDevOrigins: [process.env.NEXT_PUBLIC_LOCAL_DEV_IP as string],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiHost}/:path*` }];
  },
};

export default nextConfig;
