import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cosmogov — Better decisions, made together',
    short_name: 'CosmoGov',
    description: 'A shared space for civic participation, community decisions, and visible progress',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8f3',
    theme_color: '#27634b',
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
