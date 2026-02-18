import React, { useState, useRef, useEffect } from 'react';
import { WorkflowNode as WorkflowNodeType } from '@/types/workflow';
import { ConnectionPoint } from './ConnectionPoint';
import { cn } from '@/lib/utils';

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionPointUpdate: (nodeId: string, pointId: string, position: { x: number; y: number }) => void;
  isSelected?: boolean;
  onSelect?: (nodeId: string) => void;
  className?: string;
}

export function WorkflowNode({
  node,
  onPositionChange,
  onConnectionPointUpdate,
  isSelected = false,
  onSelect,
  className
}: WorkflowNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  // Dimensiones del nodo
  const nodeWidth = 200;
  const nodeHeight = 80;

  // Generar puntos de conexión por defecto si no existen
  // Los puntos de entrada están en el lado izquierdo (x = 0)
  // Los puntos de salida están en el lado derecho (x = nodeWidth)
  const defaultInputs = node.inputs.length > 0 ? node.inputs : [
    {
      id: `${node.id}_input_0`,
      type: 'input' as const,
      position: { x: 0, y: nodeHeight / 2 }, // Centro vertical del lado izquierdo
      connected: false,
    }
  ];

  const defaultOutputs = node.outputs.length > 0 ? node.outputs : [
    {
      id: `${node.id}_output_0`,
      type: 'output' as const,
      position: { x: nodeWidth, y: nodeHeight / 2 }, // Centro vertical del lado derecho
      connected: false,
    }
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === nodeRef.current || (e.target as HTMLElement).closest('.node-content')) {
      e.preventDefault();
      setIsDragging(true);
      
      const rect = nodeRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      
      onSelect?.(node.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      onPositionChange(node.id, newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Agregar event listeners globales para el arrastre
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        };
        onPositionChange(node.id, newPosition);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragOffset, node.id, onPositionChange]);

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute bg-gray-800 border-2 rounded-lg shadow-lg cursor-move select-none",
        "hover:shadow-xl transition-all duration-200",
        isSelected ? "border-emerald-500 shadow-emerald-500/20" : "border-gray-600",
        isDragging && "scale-105 shadow-2xl",
        className
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: nodeWidth,
        minHeight: nodeHeight,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Contenido del nodo */}
      <div className="node-content p-4">
        <div className="text-sm font-medium text-white mb-2">
          {node.type}
        </div>
        <div className="text-xs text-gray-400">
          {node.id}
        </div>
      </div>

      {/* Puntos de conexión de entrada */}
      {defaultInputs.map((input) => (
        <ConnectionPoint
          key={input.id}
          point={input}
          nodeId={node.id}
          nodePosition={node.position}
          onPositionUpdate={(pointId, position) => 
            onConnectionPointUpdate(node.id, pointId, position)
          }
        />
      ))}

      {/* Puntos de conexión de salida */}
      {defaultOutputs.map((output) => (
        <ConnectionPoint
          key={output.id}
          point={output}
          nodeId={node.id}
          nodePosition={node.position}
          onPositionUpdate={(pointId, position) => 
            onConnectionPointUpdate(node.id, pointId, position)
          }
        />
      ))}
    </div>
  );
}


