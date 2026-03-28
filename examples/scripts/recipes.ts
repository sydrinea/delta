import { mkdir, readdir, rm, writeFile, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

const RECIPE_TYPES = `
type TestCase = { id: string; input: string; expected: boolean };
type Recipe = { label: string; path: string; tests: TestCase[] };
type Recipes = { nfa: Record<string, Recipe>; tm: Record<string, Recipe> };
`.trim();

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      !["generated", "scripts", "node_modules"].includes(entry.name)
    ) {
      files.push(...(await walk(join(dir, entry.name))));
    } else if (entry.isFile()) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
}

async function transformImports(filePath: string): Promise<string> {
  const source = await readFile(filePath, "utf-8");

  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  const deltaNodes: { start: number; end: number; specifiers: string[] }[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const src = path.node.source.value;
      const isDelta =
        src === "delta:lib" ||
        src.startsWith("delta:") ||
        src.startsWith("@delta/");

      if (!isDelta) return;

      const specifiers = path.node.specifiers
        .filter((s): s is t.ImportSpecifier => t.isImportSpecifier(s))
        .map((s) => {
          const imported = t.isIdentifier(s.imported)
            ? s.imported.name
            : s.imported.value;
          const local = s.local.name;
          return imported === local ? imported : `${imported} as ${local}`;
        });

      deltaNodes.push({
        start: path.node.start!,
        end: path.node.end!,
        specifiers,
      });
    },
  });

  if (deltaNodes.length === 0) return source;

  const seen = new Set<string>();
  const allSpecifiers = deltaNodes
    .flatMap((n) => n.specifiers)
    .filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });

  const consolidated = `import { ${allSpecifiers.join(", ")} } from "delta:lib";`;
  const sorted = [...deltaNodes].sort((a, b) => b.start - a.start);
  const firstNode = deltaNodes.reduce((a, b) => (a.start < b.start ? a : b));

  let result = source;
  for (const node of sorted) {
    const before = result.slice(0, node.start);
    const after = result.slice(node.end);
    const replacement = node.start === firstNode.start ? consolidated : "";
    result = before + replacement + after;
  }

  result = result.replace(/\n\n\n+/g, "\n\n");
  result = `//@ts-nocheck\n${result}`;

  return result;
}

async function main() {
  const rootDir = process.cwd();
  const allFiles = await walk(rootDir);

  const metaFiles = allFiles.filter((f) => f.endsWith(".meta.ts"));
  const tsFiles = allFiles.filter(
    (f) =>
      f.endsWith(".ts") &&
      !f.endsWith(".meta.ts") &&
      !f.includes("/scripts/") &&
      !f.includes("/generated/"),
  );

  const entries: {
    type: string;
    key: string;
    path: string;
    label: string;
    tests: unknown[];
  }[] = [];

  for (const metaFile of metaFiles) {
    const relativeMetaPath = relative(rootDir, metaFile);
    const type = relativeMetaPath.split(sep)[0];
    const baseName = basename(metaFile, ".meta.ts");
    const key = toCamelCase(baseName);
    const publicPath = `/examples/${type}/${baseName}.ts`;
    const meta = (await import("file://" + metaFile)).default;

    entries.push({
      type: meta.type ?? type,
      key,
      path: publicPath,
      label: meta.label,
      tests: meta.tests ?? [],
    });
  }

  const generatedDir = join(rootDir, "generated");
  await mkdir(generatedDir, { recursive: true });

  let out = `// GENERATED FILE - DO NOT EDIT\n\n`;
  out += `${RECIPE_TYPES}\n\n`;
  out += `export const recipes: Recipes = {\n  nfa: {},\n  tm: {}\n};\n\n`;

  for (const { type, key, path, label, tests } of entries) {
    out += `recipes.${type}["${key}"] = {\n`;
    out += `  label: ${JSON.stringify(label)},\n`;
    out += `  path: ${JSON.stringify(path)},\n`;
    out += `  tests: ${JSON.stringify(tests)}\n`;
    out += `};\n`;
  }

  await writeFile(join(generatedDir, "recipes.ts"), out);
  console.log(`Generated ${join(generatedDir, "recipes.ts")}`);

  const publicExamplesDir = resolve(rootDir, "../apps/client/public/examples");
  await rm(publicExamplesDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(publicExamplesDir, { recursive: true });

  for (const tsFile of tsFiles) {
    const relativePath = relative(rootDir, tsFile);
    const dest = join(publicExamplesDir, relativePath);
    await mkdir(dirname(dest), { recursive: true });

    const transformed = await transformImports(tsFile);
    await writeFile(dest, transformed, "utf-8");
    console.log(`Copied ${relativePath} → public/examples/`);
  }
}

main().catch(console.error);
