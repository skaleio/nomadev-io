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
          "text-emerald-500",
          className
        )}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
        // Sin transiciones para máximo rendimiento
      />
      
      {children}
    </CursorProvider>
  );
}
