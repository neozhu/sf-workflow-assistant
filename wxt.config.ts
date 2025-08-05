import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  alias: {
    '@': path.resolve(__dirname, './'),
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['sidePanel', 'storage'],
    host_permissions: [
      'https://*.salesforce.com/*',
      'https://*.force.com/*',
      'https://*.my.salesforce.com/*',
      'https://*.lightning.force.com/*',
      'https://workflow.voith.com/*'
    ],
    side_panel: {
      default_path: 'sidepanel.html'
    },
    action: {
      default_title: 'Open Sidepanel'
    }
  },
});
