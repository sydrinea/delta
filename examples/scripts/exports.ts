import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

function toCamelCase(str: string): string {
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

async function main() {
  const rootDir = process.cwd();
  const dirs = ["nfa", "tm"];
  const lines: string[] = [
    "// GENERATED FILE - DO NOT EDIT",
    "",
    'export * from "../src/schemas";',
    "",
  ];

  for (const dir of dirs) {
    const entries = await readdir(join(rootDir, "src", dir));
    const stems = new Set(
      entries
        .filter((f) => f.endsWith(".ts") && !f.includes("/"))
        .map((f) => basename(f, ".ts")),
    );

    const machines = [...stems].filter((s) => !s.endsWith(".meta")).sort();

    if (machines.length) lines.push(`// ${dir.toUpperCase()}`);

    for (const stem of machines) {
      const key = toCamelCase(stem);
      lines.push(`export { default as ${key} } from "../src/${dir}/${stem}";`);
      if (stems.has(`${stem}.meta`)) {
        lines.push(
          `export { default as ${key}Meta } from "../src/${dir}/${stem}.meta";`,
        );
      }
    }

    lines.push("");
  }

  await mkdir(join(rootDir, "generated"), { recursive: true });
  const outPath = join(rootDir, "generated", "index.ts");
  await writeFile(outPath, lines.join("\n"));
  console.log(`Generated ${outPath}`);
}

main().catch(console.error);
