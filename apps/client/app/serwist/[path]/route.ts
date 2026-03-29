import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import { recipes } from "@delta/examples/recipes";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ??
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/", revision },
      { url: "/nfa", revision },
      { url: "/tm", revision },
      { url: "/~offline", revision },
      ...Object.entries(recipes).flatMap(([_, scopedRecipes]) =>
        Object.entries(scopedRecipes).map(([_, recipe]) => ({
          url: recipe.path,
          revision,
        })),
      ),
    ],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
