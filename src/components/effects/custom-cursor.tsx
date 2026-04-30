import React from 'react';
import { CursorProvider, Cursor } from '@/components/animate-ui/components/animate/cursor';
import { cn } from '@/lib/utils';

interface CustomCursorProps {
  children: React.ReactNode;
  followText?: string;
  className?: string;
}

export function CustomCursor({ children, followText, className }: CustomCursorProps) {
  return (
    <CursorProvider global>
      {/* Cursor optimizado sin lag - configuración mínima */}
      <Cursor 
        className={cn(
          "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.95)]",
          className
        )}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.9))',
        }}
        // Sin transiciones para máximo rendimiento
      />
      
      {children}
    </CursorProvider>
  );
}
