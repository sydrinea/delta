import type { NextConfig } from 'next'
import { withSerwist } from '@serwist/turbopack'

const nextConfig: NextConfig = {
  transpilePackages: ['@delta/build', '@delta/examples'],
}

export default withSerwist(nextConfig)
