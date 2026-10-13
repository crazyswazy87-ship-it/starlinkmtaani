import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
   // The frontend calls relative /api/... URLs; forward them to the Express backend in dev.
   server: { proxy: { '/api': 'http://localhost:4000' } },
})
