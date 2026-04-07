import type { MetadataRoute } from 'next'
import { flavors } from '@catppuccin/palette'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Delta — theory of computation tools',
    short_name: 'Delta',
    description:
      'Create, test, and visualize DFAs and NFAs, with more to come!',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: flavors.latte.colors.base.hex,
    theme_color: flavors.latte.colors.lavender.hex,
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
