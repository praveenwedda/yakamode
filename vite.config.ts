import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ───────────────────────────────────────────────────────────────────────────
// GitHub Pages deploy base.
// This MUST match your GitHub repository name exactly, wrapped in slashes.
// The site will be served from https://<your-user>.github.io/<REPO_NAME>/
//
//   👉 To change the repo name, edit the single line below.
//
const REPO_NAME = 'yakamode';
// ───────────────────────────────────────────────────────────────────────────

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Keep the bundle lean; manualChunks splits the heavy libs so the initial
    // load (shell + login) stays small. Gameplay/board/charts lazy-load.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
