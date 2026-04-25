import type { MetadataRoute } from 'next/server';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CosmoGov — Cosmic Governance Platform',
    short_name: 'CosmoGov',
    description: 'Interstellar civic OS for participatory democracy, governance, and community engagement',
    start_url: '/',
    display: 'standalone',
    background_color: '#04050b',
    theme_color: '#2D6BFF',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['government', 'social', 'productivity'],
    screenshots: [],
  };
}
