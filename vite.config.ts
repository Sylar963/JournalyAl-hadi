import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const packageVersion = process.env.npm_package_version ?? '0.0.0';
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12);
  const buildVersion = commitSha ?? `${packageVersion}-${new Date().toISOString()}`;

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'app-version-manifest',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({ version: buildVersion }, null, 2),
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('react-chartjs-2') || id.includes('chart.js')) {
              return 'charts';
            }

            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }

            if (id.includes('framer-motion')) {
              return 'motion';
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
    define: {
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'process.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN),
      __APP_VERSION__: JSON.stringify(buildVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
