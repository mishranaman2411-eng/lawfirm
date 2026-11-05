import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
    host: true,
    watch: {
      ignored: ['**/dist/**', '**/test_*.png']
    }
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
