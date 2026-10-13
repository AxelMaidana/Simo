// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://simoargentina.com',
  integrations: [sitemap()],
  // Permite ver el servidor de desarrollo a través de un túnel de Cloudflare.
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
