import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This fixes the 'process is not defined' error from react-draggable
    'process.env': {}
  }
})
