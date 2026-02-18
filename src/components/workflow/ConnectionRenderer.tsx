import React, { useMemo } from 'react';
import { WorkflowConnection, BezierCurve } from '@/types/workflow';
import { useConnectionStore } from '@/stores/connectionStore';
import { cn } from '@/lib/utils';

interface ConnectionRendererProps {
  connections: WorkflowConnection[];
  nodePositions: Record<string, { x: number; y: number }>;
  connectionPoints: Record<string, { x: number; y: number }>;
  className?: string;
}

interface ConnectionPath {
  id: string;
  pathData: string;
  curve: BezierCurve;
  isTemporary?: boolean;
  midPoint: { x: number; y: number };
}

export function ConnectionRenderer({
  connections,
  nodePositions,
  connectionPoints,
  className
}: ConnectionRendererProps) {
  const { hoveredConnection, setHoveredConnection, removeConnection, connectingFrom } = useConnectionStore();

  // Calcular curvas Bezier para cada conexión
  const connectionPaths = useMemo(() => {
    return connections.map(connection => {
      const fromKey = `${connection.from.nodeId}_${connection.from.pointId}`;
      const toKey = `${connection.to.nodeId}_${connection.to.pointId}`;

      let fromPoint = connectionPoints[fromKey];
      let toPoint = connectionPoints[toKey];

      // Para conexiones temporales, usar la posición del cursor
      if (connection.isTemporary && connectingFrom) {
        fromPoint = connectionPoints[fromKey];
        toPoint = connectingFrom.position;
      }

      if (!fromPoint || !toPoint) return null;

      // Calcular curva Bezier suave tipo n8n
      const distance = Math.abs(toPoint.x - fromPoint.x);
      const controlOffset = Math.max(Math.min(distance * 0.5, 150), 100);

      const curve: BezierCurve = {
        start: fromPoint,
        control1: {
          x: fromPoint.x + controlOffset,
          y: fromPoint.y,
        },
        control2: {
          x: toPoint.x - controlOffset,
          y: toPoint.y,
        },
        end: toPoint,
      };

      // Generar path SVG
      const pathData = `M ${curve.start.x},${curve.start.y} C ${curve.control1.x},${curve.control1.y} ${curve.control2.x},${curve.control2.y} ${curve.end.x},${curve.end.y}`;

      // Calcular punto medio de la curva para el botón de eliminar
      // Usando la fórmula de Bezier en t=0.5
      const t = 0.5;
      const midPoint = {
        x: Math.pow(1 - t, 3) * curve.start.x +
           3 * Math.pow(1 - t, 2) * t * curve.control1.x +
           3 * (1 - t) * Math.pow(t, 2) * curve.control2.x +
           Math.pow(t, 3) * curve.end.x,
        y: Math.pow(1 - t, 3) * curve.start.y +
           3 * Math.pow(1 - t, 2) * t * curve.control1.y +
           3 * (1 - t) * Math.pow(t, 2) * curve.control2.y +
           Math.pow(t, 3) * curve.end.y,
      };

      return {
        id: connection.id,
        pathData,
        curve,
        isTemporary: connection.isTemporary,
        midPoint,
      } as ConnectionPath;
    }).filter(Boolean) as ConnectionPath[];
  }, [connections, connectionPoints, connectingFrom]);

  const handleConnectionClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeConnection(connectionId);
  };

  const handleDeleteButtonClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeConnection(connectionId);
  };

  return (
    <svg
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ zIndex: 1 }}
    >
      <defs>
        {/* Gradiente para conexiones hover */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Filtro de sombra para conexiones hover */}
        <filter id="connectionShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="0" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Renderizar todas las conexiones */}
      {connectionPaths.map(({ id, pathData, isTemporary, midPoint }) => {
        const isHovered = hoveredConnection === id;

        return (
          <g key={id}>
            {/* Línea invisible más gruesa para facilitar el hover */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              strokeLinecap="round"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => !isTemporary && setHoveredConnection(id)}
              onMouseLeave={() => setHoveredConnection(null)}
              onClick={(e) => !isTemporary && handleConnectionClick(id, e)}
            />

            {/* Línea de conexión visible */}
            <path
              d={pathData}
              fill="none"
              stroke={isTemporary ? "#9CA3AF" : (isHovered ? "#10b981" : "#6B7280")}
              strokeWidth={isHovered ? 3 : 2}
              strokeLinecap="round"
              strokeDasharray={isTemporary ? "8 4" : "none"}
              className={cn(
                "transition-all duration-200 pointer-events-none",
                isHovered && "drop-shadow-lg"
              )}
              style={{
                filter: isHovered ? "url(#connectionShadow)" : "none"
              }}
            />

            {/* Botón de eliminar (solo visible en hover) */}
            {isHovered && !isTemporary && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => handleDeleteButtonClick(id, e)}
              >
                {/* Círculo de fondo */}
                <circle
                  cx={midPoint.x}
                  cy={midPoint.y}
                  r="12"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200 hover:scale-110"
                />
                {/* Icono X */}
                <line
                  x1={midPoint.x - 4}
                  y1={midPoint.y - 4}
                  x2={midPoint.x + 4}
                  y2={midPoint.y + 4}
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1={midPoint.x + 4}
                  y1={midPoint.y - 4}
                  x2={midPoint.x - 4}
                  y2={midPoint.y + 4}
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}


