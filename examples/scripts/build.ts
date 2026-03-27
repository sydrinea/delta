import { mkdir, readdir, rm, writeFile, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && !["generated", "scripts", "node_modules"].includes(entry.name)) {
      files.push(...await walk(join(dir, entry.name)));
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

  // Collect delta import nodes with their source positions and specifiers
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
          // preserve aliasing: `import { foo as bar }`
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

  // Deduplicate specifiers across all delta imports
  const seen = new Set<string>();
  const allSpecifiers = deltaNodes
    .flatMap((n) => n.specifiers)
    .filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });

  const consolidated = `import { ${allSpecifiers.join(", ")} } from "delta:lib";`;

  // Sort descending by position so replacements don't shift offsets
  const sorted = [...deltaNodes].sort((a, b) => b.start - a.start);

  let result = source;

  // Replace the last delta import with the consolidated one,
  // blank out the rest — preserving all line counts
  const firstNode = deltaNodes.reduce((a, b) => (a.start < b.start ? a : b));

  for (const node of sorted) {
    const before = result.slice(0, node.start);
    const after = result.slice(node.end);
    const replacement = node.start === firstNode.start
      ? consolidated
      : "";

    result = before + replacement + after;
  }

  result = result.replace(/\n\n\n+/g, "\n\n");
  result = `//@ts-nocheck\n${result}`

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

  const imports: string[] = [];
  const entries: { type: string; key: string; path: string; objName: string }[] = [];

  let objCounter = 0;
  for (const metaFile of metaFiles) {
    const relativeMetaPath = relative(rootDir, metaFile);
    const type = relativeMetaPath.split(sep)[0];
    const baseName = basename(metaFile, ".meta.ts");
    const key = toCamelCase(baseName);
    const publicPath = `/examples/${type}/${baseName}.ts`;

    const meta = (await import("file://" + metaFile)).default;
    const objName = `meta${objCounter++}`;

    imports.push(`import ${objName} from "../${type}/${baseName}.meta";`);
    entries.push({ type: meta.type ?? type, key, path: publicPath, objName });
  }

  const generatedDir = join(rootDir, "generated");
  await mkdir(generatedDir, { recursive: true });

  let out = `// GENERATED FILE - DO NOT EDIT\n`;
  out += `import type { Example } from "@delta/build";\n\n`;
  out += imports.join("\n") + "\n\n";
  out += `export const examples = {\n  nfa: {} as Record<string, Example>,\n  tm: {} as Record<string, Example>\n};\n\n`;

  for (const entry of entries) {
    out += `examples.${entry.type}["${entry.key}"] = {\n`;
    out += `  ...${entry.objName},\n`;
    out += `  key: "${entry.key}",\n`;
    out += `  path: "${entry.path}"\n`;
    out += `};\n`;
  }

  await writeFile(join(generatedDir, "index.ts"), out);
  console.log(`Generated ${join(generatedDir, "index.ts")}`);

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