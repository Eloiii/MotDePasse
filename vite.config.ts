import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    // The game server (server/index.ts) runs on port 3001 in development.
    proxy: {
      '/ws': { target: 'ws://localhost:3001', ws: true },
    },
  },
})
