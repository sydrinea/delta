import DocsLayout from "@/components/DocsLayout";
import { type Heading, NAV } from "../nav";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import Slugger from "github-slugger";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractHeadings(markdown: string): Heading[] {
  const slugger = new Slugger();
  return markdown.split("\n").flatMap((line) => {
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (!m) return [];
    const text = m[2].trim();
    // Use github-slugger to match what rehype-slug generates
    return [{ level: m[1].length, text, id: slugger.slug(text) }];
  });
}

async function parseMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: "catppuccin-mocha",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

export async function generateStaticParams() {
  return NAV.flatMap((g) => g.pages).map((p) => ({
    slug: p.id === "quick-start" ? [] : [p.id],
  }));
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const pageId = slug?.[0] ?? "quick-start";

  const filePath = path.join(process.cwd(), "public/docs", `${pageId}.md`);
  let markdown = "";
  try {
    markdown = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    notFound();
  }

  const html = await parseMarkdown(markdown);
  const headings = extractHeadings(markdown);

  return <DocsLayout activePage={pageId} html={html} headings={headings} />;
}
