import { defineConfig } from 'vite';
import { resolve } from 'path';
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tpcl: resolve(__dirname, 'TPCL/index.html'),
      },
    },
  },
    plugins: [
    Sitemap({ 
      hostname: 'https://bitbeans.me', // Replace with your actual domain
    }),
  ],
});