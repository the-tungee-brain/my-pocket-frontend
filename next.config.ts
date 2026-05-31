import type { NextConfig } from "next";

const { ingest, assets } = (() => {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  const isEu = host.includes("eu.");
  return {
    ingest: isEu ? "https://eu.i.posthog.com" : "https://us.i.posthog.com",
    assets: isEu
      ? "https://eu-assets.i.posthog.com"
      : "https://us-assets.i.posthog.com",
  };
})();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${assets}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${assets}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${ingest}/:path*`,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
