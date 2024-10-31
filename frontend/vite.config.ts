import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import { checker } from 'vite-plugin-checker';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.BASE_URL || '/',
    plugins: [
      react(),
      splitVendorChunkPlugin(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
          useFlatConfig: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': env,
    },
  };
});
