import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "5b6a21a51100.ngrok-free.app", // New ngrok URL
      "0e607630625c.ngrok-free.app", // Old ngrok URL
      "nonreprehensibly-crumbiest-cary.ngrok-free.dev", // Current ngrok URL
      ".ngrok-free.app",
      ".ngrok-free.dev",
      ".ngrok.io"
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Sin manualChunks: la división manual causaba createContext undefined en producción
    // (Vercel) por orden de chunks o múltiples instancias de React.
    rollupOptions: {},
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
  }
}));
