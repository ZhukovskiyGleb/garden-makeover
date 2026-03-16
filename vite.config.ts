import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  server: {
    allowedHosts: ['susan-hyperexcitable-werner.ngrok-free.dev'],
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
