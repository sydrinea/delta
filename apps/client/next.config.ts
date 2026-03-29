import { withSerwist } from "@serwist/turbopack";
import { readFileSync } from "fs";
import type { NextConfig } from "next";
import { resolve } from "path";

const INCLUDE_TYPES = [
  "../../packages/build/dist/index.d.mts",
  "../../packages/transform/dist/index.d.mts",
];

const nextConfig: NextConfig = {
  env: {
    DELTA_TYPES: `declare module "delta:lib" {
      ${INCLUDE_TYPES.map((path) =>
        readFileSync(resolve(__dirname, path), "utf-8"),
      ).join("\n")}
    }`,
  },
  transpilePackages: ["@delta/build", "@delta/examples"],
};

export default withSerwist(nextConfig);
