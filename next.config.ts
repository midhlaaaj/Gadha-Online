import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next's SSRF guard misidentifies the Supabase host's IPv6 NAT64 resolution
    // as a private IP and blocks the optimizer proxy fetch, breaking every remote
    // image. Serve remote images unoptimized (direct browser fetch) to avoid it.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "akkpycohouyhbzactupb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
