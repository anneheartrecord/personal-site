// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkGfm],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
