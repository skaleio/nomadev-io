import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { LandingPricingPlans } from '@/components/landing/LandingPricingPlans';

const wordmarkClass =
  "text-2xl sm:text-3xl font-black text-emerald-500 hover:text-emerald-600 transition-all duration-200 tracking-wider uppercase";

const wordmarkStyle: CSSProperties = {
  fontFamily: "'Orbitron', 'Arial Black', sans-serif",
  fontWeight: 900,
  letterSpacing: '0.2em',
  textShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
  display: 'inline-block',
  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b backdrop-blur-md sticky top-0 z-50 shadow-lg border-gray-800 bg-black/90">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className={wordmarkClass} style={wordmarkStyle} title="Inicio">
            NOMADEV.IO
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Inicio
            </Link>
            <span className="text-emerald-400" aria-current="page">
              Precios
            </span>
          </nav>
        </div>
      </header>

      <main>
        <LandingPricingPlans />
      </main>

      <footer className="border-t border-gray-800 py-10">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
