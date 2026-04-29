import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mktg/core", "@mktg/domain-google-ads", "@mktg/adapter-beacon"],
  // Two levels up from apps/mcp-office — the monorepo root.
  // nft needs this to trace @mktg/* workspace symlinks into the standalone bundle.
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
};

export default nextConfig;
