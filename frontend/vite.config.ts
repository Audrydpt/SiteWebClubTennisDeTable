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
    test: {
      environment: 'jsdom',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.old/**',
        '**/src/components/ui/**',
      ],
      globals: true,
      setupFiles: './vitest-setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['json-summary', 'text-summary', 'html'],
        reportsDirectory: './coverage',
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.old/**'],
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
      hmr: false,
    },
    worker: {
      format: 'es',
    },
  };
});
