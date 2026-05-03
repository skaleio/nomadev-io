import React from 'react';

interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingLogo({ size = 'md', className = '' }: LoadingLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  const barHeight = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      {/* Logo NOMADEV.IO */}
      <div className="relative">
        <span 
          className={`${sizeClasses[size]} font-black text-emerald-600 tracking-wider uppercase animate-pulse`}
          style={{
            fontFamily: "'Orbitron', 'Arial Black', sans-serif",
            fontWeight: 900,
            letterSpacing: '0.15em',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            transform: 'skew(-3deg)',
            display: 'inline-block',
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))'
          }}
        >
              NOMADEV.IO
        </span>
        
        {/* Efecto de brillo animado */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{
            transform: 'skew(-3deg)',
            animation: 'shimmer 2s infinite'
          }}
        />
      </div>

      {/* Barra de progreso animada */}
      <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`${barHeight[size]} bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-progress-bar`}
          style={{
            background: 'linear-gradient(90deg, #10b981, #059669, #10b981)',
            backgroundSize: '200% 100%'
          }}
        />
      </div>

      {/* Texto de carga */}
      <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
        Cargando...
      </p>
    </div>
  );
}

// Componente de pantalla de carga completa
export function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingLogo size="lg" />
        <p className="text-lg text-muted-foreground mt-8 animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
