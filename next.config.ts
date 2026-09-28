import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The share card reads its fonts from disk at request time.
  outputFileTracingIncludes: {
    "/card": ["./src/assets/fonts/*.woff"],
  },
};

export default nextConfig;
