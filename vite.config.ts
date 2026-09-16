import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Базовый путь:
// - для GitHub Pages — '/nri-character-sheet/'
// - для Tauri и локальной разработки — './'
const base = process.env.VITE_BASE ?? './';

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});