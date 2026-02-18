import React, { useState, useRef, useCallback } from 'react';
import { WorkflowNode as WorkflowNodeType } from '@/types/workflow';
import { WorkflowNode } from './WorkflowNode';
import { ConnectionRenderer } from './ConnectionRenderer';
import { useConnectionStore } from '@/stores/connectionStore';
import { cn } from '@/lib/utils';

interface WorkflowCanvasProps {
  nodes: WorkflowNodeType[];
  onNodesChange: (nodes: WorkflowNodeType[]) => void;
  className?: string;
}

export function WorkflowCanvas({ 
  nodes, 
  onNodesChange, 
  className 
}: WorkflowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectionPoints, setConnectionPoints] = useState<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const { 
    connections, 
    isConnecting, 
    connectingFrom, 
    updateConnectingPosition 
  } = useConnectionStore();

  // Manejar cambio de posición de nodos
  const handleNodePositionChange = useCallback((nodeId: string, position: { x: number; y: number }) => {
    const updatedNodes = nodes.map(node => 
      node.id === nodeId ? { ...node, position } : node
    );
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  // Manejar actualización de posiciones de puntos de conexión
  const handleConnectionPointUpdate = useCallback((nodeId: string, pointId: string, position: { x: number; y: number }) => {
    setConnectionPoints(prev => ({
      ...prev,
      [`${nodeId}_${pointId}`]: position,
    }));
  }, []);

  // Manejar movimiento del mouse para conexiones temporales
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isConnecting && connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        updateConnectingPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  }, [isConnecting, connectingFrom, updateConnectingPosition]);

  // Manejar mouse up global para cancelar conexiones
  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (isConnecting) {
      // Si no se hizo click en un punto de entrada, cancelar la conexión
      const target = e.target as HTMLElement;
      if (!target.closest('[title*="Input connection point"]')) {
        useConnectionStore.getState().cancelConnecting();
      }
    }
  }, [isConnecting]);

  // Cancelar conexión al hacer click en el canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNodeId(null);
      if (isConnecting) {
        useConnectionStore.getState().cancelConnecting();
      }
    }
  }, [isConnecting]);

  // Crear conexión temporal para mostrar durante el arrastre
  const temporaryConnection = isConnecting && connectingFrom ? {
    id: 'temp_connection',
    from: {
      nodeId: connectingFrom.nodeId,
      pointId: connectingFrom.pointId,
    },
    to: {
      nodeId: 'temp',
      pointId: 'temp',
    },
    isTemporary: true,
  } : null;

  const allConnections = temporaryConnection 
    ? [...connections, temporaryConnection]
    : connections;

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative w-full h-full bg-gray-900 overflow-hidden",
        "select-none",
        isConnecting && "cursor-crosshair",
        className
      )}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Grid de fondo */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(107, 114, 128, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(107, 114, 128, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Renderizar conexiones */}
      <ConnectionRenderer
        connections={allConnections}
        nodePositions={Object.fromEntries(nodes.map(node => [node.id, node.position]))}
        connectionPoints={connectionPoints}
      />

      {/* Renderizar nodos */}
      {nodes.map((node) => (
        <WorkflowNode
          key={node.id}
          node={node}
          onPositionChange={handleNodePositionChange}
          onConnectionPointUpdate={handleConnectionPointUpdate}
          isSelected={selectedNodeId === node.id}
          onSelect={setSelectedNodeId}
        />
      ))}

      {/* Información de estado (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
          <div>Nodos: {nodes.length}</div>
          <div>Conexiones: {connections.length}</div>
          <div>Conectando: {isConnecting ? 'Sí' : 'No'}</div>
          {selectedNodeId && <div>Seleccionado: {selectedNodeId}</div>}
        </div>
      )}
    </div>
  );
}


