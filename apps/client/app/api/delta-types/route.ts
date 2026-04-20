import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextResponse } from 'next/server'

const INCLUDE_TYPES = [
  '../../packages/build/dist/index.d.mts',
  '../../packages/transform/dist/index.d.mts',
]

export function GET() {
  const types = INCLUDE_TYPES
    // eslint-disable-next-line node/prefer-global/process
    .map(p => readFileSync(resolve(process.cwd(), p), 'utf-8'))
    .join('\n')
  return new NextResponse(`declare module "delta:lib" {\n${types}\n}`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
