import { defineConfig } from 'vite'
import inject from "@rollup/plugin-inject";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    sourcemap: true,
  },

  server: {
    port: 4001,
    hmr: true
  },
  plugins: [
    VitePWA({ registerType: 'autoUpdate', manifest: false }),
    inject({   // => that should be first under plugins array
      $: 'jquery',
      jQuery: 'jquery',
    })
  ],
  optimizeDeps: {
    include: ['jquery', 'sip.js'],
  },
})
