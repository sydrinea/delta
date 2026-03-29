import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@delta/build", "@delta/examples"],
};

export default withSerwist(nextConfig);
