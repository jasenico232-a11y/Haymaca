import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Security headers that are static (do not need the per-request nonce) live in
  // middleware alongside the CSP so there is a single source of truth. Keeping
  // next.config lean avoids two places setting overlapping headers.
  experimental: {
    // Trim what ships to the client for the packages we import in Server Components.
    optimizePackageImports: [],
  },
};

export default nextConfig;
