import type { NextConfig } from 'next'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { withSerwist } from '@serwist/turbopack'

const INCLUDE_TYPES = [
  '../../packages/build/dist/index.d.mts',
  '../../packages/transform/dist/index.d.mts',
]

const nextConfig: NextConfig = {
  env: {
    DELTA_TYPES: `declare module "delta:lib" {
      ${INCLUDE_TYPES.map(path =>
        readFileSync(resolve(__dirname, path), 'utf-8'),
      ).join('\n')}
    }`,
  },
  transpilePackages: ['@delta/build', '@delta/examples'],
}

export default withSerwist(nextConfig)
