import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Cursor personalizado de alto rendimiento (sin React state ni re-renders por movimiento).
 * El SVG vive en un portal sobre document.body para no quedar recortado por `transform`/stacking contexts.
 */

interface CustomCursorProps {
  children: React.ReactNode;
  className?: string;
}

const STYLE_ID = '__nomadev_cursor_none_style__';

/** Solo pantallas táctiles sin puntero fino (tablet / teléfono real). */
function skipCustomCursor(): boolean {
  if (typeof window === 'undefined' || typeof matchMedia === 'undefined') return false;
  try {
    const noHover = matchMedia('(hover: none)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const fine = matchMedia('(pointer: fine)').matches;
    return noHover && coarse && !fine;
  } catch {
    return false;
  }
}

const CURSOR_GREEN = '#34d399';

export function CustomCursor({ children, className }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (skipCustomCursor()) return;

    /** El ref dentro del Portal a veces resuelve un tick después del primer commit. */
    const tryAttach = (): (() => void) | undefined => {
      const node = cursorRef.current;
      if (!node) return undefined;

      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
          html, html * {
            cursor: none !important;
          }
          .nomadev-cursor-host {
            position: fixed;
            top: 0;
            left: 0;
            width: 24px;
            height: 24px;
            pointer-events: none;
            z-index: 2147483647;
            opacity: 0;
            contain: strict;
            will-change: transform, opacity;
            transform: translate3d(-9999px, -9999px, 0);
            transition: opacity 140ms ease;
          }
          .nomadev-cursor-host svg {
            display: block;
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 0 8px rgba(52,211,153,0.55)) drop-shadow(0 1px 2px rgba(0,0,0,0.9));
          }
        `;
        document.head.appendChild(style);
      }

      let rafId: number | null = null;
      let pendingX = 0;
      let pendingY = 0;
      let visible = false;

      const flush = () => {
        rafId = null;
        node.style.transform = `translate3d(${pendingX - 12}px, ${pendingY - 12}px, 0)`;
        if (!visible) {
          visible = true;
          node.style.opacity = '1';
        }
      };

      const onMove = (e: MouseEvent | PointerEvent) => {
        if ('pointerType' in e && e.pointerType === 'touch') return;
        pendingX = e.clientX;
        pendingY = e.clientY;
        if (rafId === null) {
          rafId = window.requestAnimationFrame(flush);
        }
      };

      const hide = () => {
        if (visible) {
          visible = false;
          node.style.opacity = '0';
        }
      };

      const onMouseLeaveDoc = () => hide();

      const onVisibility = () => {
        if (document.visibilityState === 'hidden') hide();
      };

      window.addEventListener('pointermove', onMove as EventListener, { passive: true });
      window.addEventListener('mousemove', onMove as EventListener, { passive: true });
      document.documentElement.addEventListener('mouseleave', onMouseLeaveDoc);
      window.addEventListener('blur', hide);
      document.addEventListener('visibilitychange', onVisibility);

      return () => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        window.removeEventListener('pointermove', onMove as EventListener);
        window.removeEventListener('mousemove', onMove as EventListener);
        document.documentElement.removeEventListener('mouseleave', onMouseLeaveDoc);
        window.removeEventListener('blur', hide);
        document.removeEventListener('visibilitychange', onVisibility);
        document.getElementById(STYLE_ID)?.remove();
      };
    };

    let cleanup = tryAttach();
    let retryFrame: number | null = null;
    if (!cleanup) {
      retryFrame = requestAnimationFrame(() => {
        retryFrame = null;
        cleanup = tryAttach();
      });
    }

    return () => {
      if (retryFrame !== null) cancelAnimationFrame(retryFrame);
      cleanup?.();
    };
  }, []);

  const overlay =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={cursorRef}
            className={cn('nomadev-cursor-host', className)}
            aria-hidden
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
              <path
                fill={CURSOR_GREEN}
                d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
              />
            </svg>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {children}
      {overlay}
    </>
  );
}
