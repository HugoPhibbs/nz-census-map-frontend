import type { NextConfig } from "next";

let apiHost = process.env.NEXT_PUBLIC_API_HOST;
if (!apiHost) {
  console.warn("NEXT_PUBLIC_API_HOST is not set. Defaulting to http://localhost:5000");
  apiHost = "http://localhost:5000"; // Default to localhost if not set
}

const nextConfig: NextConfig = {
  transpilePackages: ["react-map-gl", "maplibre-gl"],
  allowedDevOrigins: [process.env.NEXT_PUBLIC_LOCAL_DEV_IP as string],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiHost}/:path*` }];
  },
};

export default nextConfig;
