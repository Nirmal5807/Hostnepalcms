import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ApiClientReact',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', '@tanstack/react-query'],
      output: {
        globals: {
          react: 'React',
          '@tanstack/react-query': 'ReactQuery',
        },
      },
    },
  },
});
