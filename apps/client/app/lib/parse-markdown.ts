import type * as React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeReact from 'rehype-react'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { Code, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components'

interface MarkdownOptions {
  code: React.ElementType
}

export default async function parseMarkdown(md: string, options?: MarkdownOptions): Promise<React.ReactNode> {
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
    .use(rehypeReact, {
      Fragment,
      jsx,
      jsxs,
      components: {
        pre: options?.code ?? Code,
        table: Table,
        thead: TableHeader,
        tbody: TableBody,
        tr: TableRow,
        th: TableHead,
        td: TableCell,
      },
    })
    .process(md)
  return file.result as React.ReactNode
}
