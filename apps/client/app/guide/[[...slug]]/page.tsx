import type { Heading } from '../nav'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import Slugger from 'github-slugger'
import { notFound } from 'next/navigation'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import DocsLayout from '@/components/DocsLayout'
import { NAV } from '../nav'

const GITHUB_REPO = 'https://github.com/sydrinea/delta'
const HEADING_LINE_REGEX = /^(#{1,3})\s+(.+)/

function extractHeadings(markdown: string): Heading[] {
  const slugger = new Slugger()
  return markdown.split('\n').flatMap((line) => {
    const m = line.match(HEADING_LINE_REGEX)
    if (!m)
      return []
    const text = m[2].trim()
    return [{ level: m[1].length, text, id: slugger.slug(text) }]
  })
}

async function parseMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(md)
  return String(file)
}

export async function generateStaticParams() {
  return NAV.flatMap(g => g.pages).map(p => ({
    slug: p.id === 'quick-start' ? [] : [p.id],
  }))
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const pageId = slug?.[0] ?? 'quick-start'
  const docsFilePath = `apps/client/public/docs/${pageId}.md`
  const editUrl = `${GITHUB_REPO}/edit/main/${docsFilePath}`

  const filePath = path.join(process.cwd(), 'public/docs', `${pageId}.md`)
  let markdown = ''
  try {
    markdown = await fs.readFile(filePath, 'utf-8')
  }
  catch {
    notFound()
  }

  const html = await parseMarkdown(markdown)
  const headings = extractHeadings(markdown)

  const orderedPages = NAV.flatMap(group => group.pages)
  const currentIndex = orderedPages.findIndex(page => page.id === pageId)
  const previousPage = currentIndex > 0 ? orderedPages[currentIndex - 1] : null
  const nextPage
    = currentIndex >= 0 && currentIndex < orderedPages.length - 1
      ? orderedPages[currentIndex + 1]
      : null

  const issueTitle = `Docs: ${orderedPages[currentIndex]?.label ?? pageId}`
  const issueBody = [
    '## Docs issue',
    '',
    `Page route: /guide/${pageId === 'quick-start' ? '' : pageId}`,
    `Source file: ${docsFilePath}`,
    `Edit URL: ${editUrl}`,
    '',
    'Describe the problem or suggestion below:',
  ].join('\n')

  const issueUrl = `${GITHUB_REPO}/issues/new?${new URLSearchParams({
    title: issueTitle,
    body: issueBody,
  }).toString()}`

  return (
    <DocsLayout
      activePage={pageId}
      html={html}
      headings={headings}
      editUrl={editUrl}
      issueUrl={issueUrl}
      previousPage={
        previousPage
          ? {
              label: previousPage.label,
              href: `/guide/${previousPage.id === 'quick-start' ? '' : previousPage.id}`,
            }
          : null
      }
      nextPage={
        nextPage
          ? {
              label: nextPage.label,
              href: `/guide/${nextPage.id === 'quick-start' ? '' : nextPage.id}`,
            }
          : null
      }
    />
  )
}
