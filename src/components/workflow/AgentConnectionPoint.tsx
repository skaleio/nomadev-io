import React, { useState, useRef, useEffect } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { cn } from '@/lib/utils';

interface AgentConnectionPointProps {
  point: {
    id: string;
    type: 'input' | 'output';
    position: { x: number; y: number };
    connected: boolean;
  };
  nodeId: string;
  nodePosition: { x: number; y: number };
  onPositionUpdate: (pointId: string, position: { x: number; y: number }) => void;
}

export function AgentConnectionPoint({
  point,
  nodeId,
  nodePosition,
  onPositionUpdate
}: AgentConnectionPointProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pointRef = useRef<HTMLDivElement>(null);

  const {
    isConnecting,
    connectingFrom,
    startConnecting,
    finishConnecting
  } = useConnectionStore();

  // Calcular posición absoluta del punto (centro del círculo)
  const absolutePosition = {
    x: nodePosition.x + point.position.x,
    y: nodePosition.y + point.position.y,
  };

  // Actualizar posición cuando cambia la posición del nodo o del punto
  useEffect(() => {
    onPositionUpdate(point.id, absolutePosition);
  }, [nodePosition.x, nodePosition.y, point.position.x, point.position.y, point.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Solo los puntos de salida (output) pueden iniciar conexiones
    if (point.type === 'output' && !isConnecting) {
      startConnecting(nodeId, point.id, absolutePosition);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Solo los puntos de entrada (input) pueden recibir conexiones
    if (isConnecting && connectingFrom && point.type === 'input') {
      finishConnecting(nodeId, point.id);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isConnectingToThis = isConnecting && connectingFrom?.nodeId !== nodeId && point.type === 'input';
  const isConnectingFromThis = isConnecting && connectingFrom?.nodeId === nodeId && point.type === 'output';

  return (
    <div
      ref={pointRef}
      className={cn(
        "absolute w-4 h-4 rounded-full border-2 transition-all duration-200 z-10",
        "flex items-center justify-center",
        // Estilos base según el tipo
        point.type === 'input'
          ? "bg-blue-500 border-blue-300"
          : "bg-emerald-500 border-emerald-300",
        // Cursor según el tipo y estado
        point.type === 'output' ? "cursor-pointer" : "cursor-crosshair",
        // Hover effects
        isHovered && "scale-150 shadow-lg",
        point.type === 'input' && isHovered && !isConnecting && "bg-blue-400",
        point.type === 'output' && isHovered && "bg-emerald-400",
        // Estados de conexión
        isConnectingToThis && "scale-150 ring-4 ring-yellow-400 ring-opacity-60 animate-pulse",
        isConnectingFromThis && "scale-150 ring-4 ring-emerald-400 ring-opacity-60"
      )}
      style={{
        left: point.position.x - 8, // Centrar el círculo (4px = mitad de 8px)
        top: point.position.y - 8,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${point.type === 'input' ? 'Input' : 'Output'} connection point`}
    />
  );
}


