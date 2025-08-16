import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Ensure environment variables are available at build time
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  },
};

export default nextConfig;
