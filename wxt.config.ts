import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  alias: {
    '@': path.resolve(__dirname, './'),
  },
  // Typing workaround: cast plugins as unknown to PluginOption[] to satisfy TS
  vite: () => ({
    plugins: [tailwindcss()] as unknown as any[],
  }),
  manifest: {
    permissions: ['sidePanel', 'storage', 'contextMenus', 'cookies'],
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
