import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The backend API does not send CORS headers, so the browser
  // blocks direct cross-origin calls (POST works in Postman but
  // not on the web). During development the dev server proxies
  // same-origin /api/* requests to the API host instead.
  const proxy = {
    '/api': {
      target: env.VITE_PROXY_TARGET || 'http://187.127.176.132',
      changeOrigin: true,
    },
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: { proxy },
    preview: { proxy },
  }
})
