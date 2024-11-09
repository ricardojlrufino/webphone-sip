import { defineConfig } from 'vite'
import inject from "@rollup/plugin-inject";

  export default defineConfig({
    build: {
      sourcemap: true,
    },
    
    server:{
      port: 4001,
      hmr: false
    },
    plugins: [
       inject({   // => that should be first under plugins array
         $: 'jquery',
         jQuery: 'jquery',
       })
    ],
    optimizeDeps: {
      include: ['jquery'],
    },
  })
