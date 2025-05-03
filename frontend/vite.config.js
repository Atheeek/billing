import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    allowedHosts: [
      '4ee8-2409-40f2-1041-3c7c-997f-47ed-bc02-c327.ngrok-free.app'
    ]
  },
  build: {
    outDir: 'dist',
  },
  base: './',
})
