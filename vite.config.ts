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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - librerías principales
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // React Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            
            // UI Libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority')) {
              return 'ui-vendor';
            }
            
            // Charts and visualization
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('d3')) {
              return 'charts-vendor';
            }
            
            // State management and queries
            if (id.includes('@tanstack') || id.includes('zustand') || id.includes('redux')) {
              return 'state-vendor';
            }
            
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // OpenAI and AI libraries
            if (id.includes('openai') || id.includes('ai')) {
              return 'ai-vendor';
            }
            
            // Utility libraries
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            
            // Other large dependencies
            if (id.includes('swiper') || id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            
            // Everything else goes to vendor
            return 'vendor';
          }
          
          // Application chunks - dividir por páginas/features
          if (id.includes('/src/pages/')) {
            // Studio IA pages
            if (id.includes('StudioIA') || id.includes('ProductImageGenerator') || id.includes('Copywriting') || id.includes('LogoGenerator')) {
              return 'studio-ia';
            }
            
            // Dashboard pages
            if (id.includes('Dashboard') || id.includes('Orders') || id.includes('Tracking')) {
              return 'dashboard';
            }
            
            // Shopify pages
            if (id.includes('Shopify') || id.includes('CRMPage')) {
              return 'shopify';
            }
            
            // Other pages
            return 'pages';
          }
          
          // Components chunks
          if (id.includes('/src/components/')) {
            // UI components
            if (id.includes('/ui/')) {
              return 'ui-components';
            }
            
            // Dashboard components
            if (id.includes('/dashboard/')) {
              return 'dashboard-components';
            }
            
            // Other components
            return 'components';
          }
          
          // Libraries and utilities
          if (id.includes('/src/lib/') || id.includes('/src/utils/')) {
            return 'lib';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: false, // Deshabilitado temporalmente para evitar error de terser
  }
}));
