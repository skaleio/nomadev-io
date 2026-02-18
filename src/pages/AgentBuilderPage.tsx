import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionRenderer } from '@/components/workflow/ConnectionRenderer';
import { AgentConnectionPoint } from '@/components/workflow/AgentConnectionPoint';
import { useConnectionStore } from '@/stores/connectionStore';
import { 
  Bot, 
  ArrowLeft,
  Settings, 
  Plus,
  CheckCircle,
  AlertCircle,
  Monitor,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  Clock,
  Mail,
  FileText,
  MessageSquare,
  Database,
  BarChart3,
  ShoppingCart,
  Users,
  Brain,
  PenTool,
  Heart,
  GitBranch,
  MoreHorizontal,
  RotateCcw,
  Play,
  Power,
  Trash2
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai' | 'integration' | 'output';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  position: { x: number; y: number };
  data: any;
  status: 'idle' | 'running' | 'success' | 'error';
  connections: string[]; // IDs de nodos conectados
  connectionNeurons: { [connectedNodeId: string]: { x: number; y: number } }; // Posiciones de neuronas por conexión
  // Nuevos campos para el sistema de conexiones avanzado
  inputs: Array<{
    id: string;
    type: 'input';
    position: { x: number; y: number };
    connected: boolean;
  }>;
  outputs: Array<{
    id: string;
    type: 'output';
    position: { x: number; y: number };
    connected: boolean;
  }>;
}

const nodeTypes = [
  {
    category: 'Triggers',
    nodes: [
      { type: 'trigger', name: 'Webhook', icon: Globe, description: 'Activa el flujo cuando recibe una petición HTTP', color: 'bg-green-500' },
      { type: 'trigger', name: 'Schedule', icon: Clock, description: 'Ejecuta el flujo en intervalos regulares', color: 'bg-blue-500' },
      { type: 'trigger', name: 'Email', icon: Mail, description: 'Se activa cuando llega un nuevo email', color: 'bg-purple-500' },
      { type: 'trigger', name: 'Form Submit', icon: FileText, description: 'Se activa cuando se envía un formulario', color: 'bg-orange-500' }
    ]
  },
  {
    category: 'Actions',
    nodes: [
      { type: 'action', name: 'Send Email', icon: Mail, description: 'Envía un email', color: 'bg-blue-500' },
      { type: 'action', name: 'Send SMS', icon: MessageSquare, description: 'Envía un mensaje SMS', color: 'bg-green-500' },
      { type: 'action', name: 'Create Task', icon: CheckCircle, description: 'Crea una nueva tarea', color: 'bg-purple-500' },
      { type: 'action', name: 'Update Database', icon: Database, description: 'Actualiza la base de datos', color: 'bg-orange-500' }
    ]
  },
  {
    category: 'AI',
    nodes: [
      { type: 'ai', name: 'Text Analysis', icon: Brain, description: 'Analiza texto con IA', color: 'bg-indigo-500' },
      { type: 'ai', name: 'Generate Content', icon: PenTool, description: 'Genera contenido con IA', color: 'bg-pink-500' },
      { type: 'ai', name: 'Sentiment Analysis', icon: Heart, description: 'Analiza sentimientos', color: 'bg-red-500' },
      { type: 'ai', name: 'Image Recognition', icon: Eye, description: 'Reconoce objetos en imágenes', color: 'bg-cyan-500' }
    ]
  },
  {
    category: 'Integrations',
    nodes: [
      { type: 'integration', name: 'Shopify', icon: ShoppingCart, description: 'Conecta con Shopify', color: 'bg-green-500' },
      { type: 'integration', name: 'WhatsApp', icon: MessageSquare, description: 'Conecta con WhatsApp Business', color: 'bg-green-600' },
      { type: 'integration', name: 'CRM', icon: Users, description: 'Conecta con CRM', color: 'bg-blue-500' },
      { type: 'integration', name: 'Analytics', icon: BarChart3, description: 'Conecta con Google Analytics', color: 'bg-orange-500' }
    ]
  },
  {
    category: 'Logic',
    nodes: [
      { type: 'condition', name: 'If/Else', icon: GitBranch, description: 'Condición lógica', color: 'bg-yellow-500' },
      { type: 'condition', name: 'Switch', icon: MoreHorizontal, description: 'Múltiples condiciones', color: 'bg-purple-500' },
      { type: 'condition', name: 'Loop', icon: RotateCcw, description: 'Repetir acciones', color: 'bg-blue-500' }
    ]
  }
];

export default function AgentBuilderPage() {
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showConnectionMenu, setShowConnectionMenu] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<any>(null);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState({ x: 0, y: 0 });
  const [connectingFromOld, setConnectingFromOld] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ from: string; to: string } | null>(null);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [connectionDragStart, setConnectionDragStart] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [connectionDragEnd, setConnectionDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [draggedNeuron, setDraggedNeuron] = useState<{ fromNodeId: string; toNodeId: string } | null>(null);
  const [isDraggingNeuron, setIsDraggingNeuron] = useState(false);
  const [connectionPoints, setConnectionPoints] = useState<Record<string, { x: number; y: number }>>({});
  const [isDraggingTrigger, setIsDraggingTrigger] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Hook del store de conexiones
  const { 
    connections, 
    isConnecting, 
    connectingFrom, 
    updateConnectingPosition 
  } = useConnectionStore();

  // Manejar actualización de posiciones de puntos de conexión
  const handleConnectionPointUpdate = (nodeId: string, pointId: string, position: { x: number; y: number }) => {
    setConnectionPoints(prev => ({
      ...prev,
      [`${nodeId}_${pointId}`]: position,
    }));
  };

  // Manejar movimiento del mouse para conexiones temporales
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isConnecting && connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        updateConnectingPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  // Manejar mouse up global para cancelar conexiones
  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isConnecting) {
      // Si no se hizo click en un punto de entrada, cancelar la conexión
      const target = e.target as HTMLElement;
      if (!target.closest('[title*="Input connection point"]')) {
        useConnectionStore.getState().cancelConnecting();
      }
    }
  };

  const addNodeToCanvas = (nodeType: any, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: nodeType.type,
      name: nodeType.name,
      description: nodeType.description,
      icon: nodeType.icon,
      position,
      data: {},
      status: 'idle',
      connections: [],
      connectionNeurons: {},
      // Puntos de conexión para el sistema avanzado
      inputs: nodeType.type !== 'trigger' ? [{
        id: `${Date.now()}_input_0`,
        type: 'input',
        position: { x: 0, y: 40 }, // Centro vertical del lado izquierdo
        connected: false,
      }] : [],
      outputs: [{
        id: `${Date.now()}_output_0`,
        type: 'output',
        position: { x: 144, y: 40 }, // Centro vertical del lado derecho (144px = 144px de ancho del nodo)
        connected: false,
      }]
    };
    
    setWorkflowNodes(prev => {
      const updatedNodes = [...prev, newNode];
      
      // LÓGICA DE CONEXIÓN AUTOMÁTICA SIMPLIFICADA
      if (prev.length > 0 && nodeType.type !== 'trigger') {
        // SIEMPRE conectar al último nodo (flujo secuencial)
        const lastNode = prev[prev.length - 1];
        
        // Actualizar el último nodo para que tenga conexión al nuevo nodo
        const updatedLastNode = {
          ...lastNode,
          connections: [...lastNode.connections, newNode.id],
          connectionNeurons: {
            ...lastNode.connectionNeurons,
            [newNode.id]: {
              x: (lastNode.position.x + newNode.position.x) / 2,
              y: (lastNode.position.y + newNode.position.y) / 2
            }
          }
        };
        
        // Reemplazar el último nodo con su versión actualizada
        updatedNodes[updatedNodes.length - 1] = updatedLastNode;
      }
      
      return updatedNodes;
    });
  };

  // Función para conectar nodos manualmente
  const connectNodes = (fromNodeId: string, toNodeId: string) => {
    setWorkflowNodes(prev => 
      prev.map(node => {
        if (node.id === fromNodeId) {
          const fromNode = node;
          const toNode = prev.find(n => n.id === toNodeId);
          if (toNode) {
            return {
              ...node,
              connections: [...node.connections, toNodeId],
              connectionNeurons: {
                ...node.connectionNeurons,
                [toNodeId]: {
                  x: (fromNode.position.x + toNode.position.x) / 2,
                  y: (fromNode.position.y + toNode.position.y) / 2
                }
              }
            };
          }
        }
        return node;
      })
    );
    
    // TAMBIÉN crear conexión en el store nuevo
    const fromNode = workflowNodes.find(n => n.id === fromNodeId);
    const toNode = workflowNodes.find(n => n.id === toNodeId);
    
    if (fromNode && toNode) {
      useConnectionStore.getState().addConnection({
        from: {
          nodeId: fromNodeId,
          pointId: fromNode.outputs[0].id,
        },
        to: {
          nodeId: toNodeId,
          pointId: toNode.inputs[0].id,
        },
      });
    }
    
    setConnectingFromOld(null);
    setConnectionPreview(null);
  };

  // Función para manejar el inicio de conexión manual
  const startConnection = (nodeId: string) => {
    setConnectingFromOld(nodeId);
    setShowConnectionMenu(null);
  };

  // Función para completar conexión manual
  const completeConnection = (targetNodeId: string) => {
    if (connectingFromOld && connectingFromOld !== targetNodeId) {
      connectNodes(connectingFromOld, targetNodeId);
    }
  };

  // Función para iniciar drag-to-connect desde el handle de conexión
  const handleConnectionDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const node = workflowNodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Usar la posición del handle de salida (lado derecho del nodo)
    const startX = node.position.x + 72; // Centro del nodo + mitad del ancho
    const startY = node.position.y;
    
    setConnectionDragStart({ nodeId, x: startX, y: startY });
    setConnectionDragEnd({ x: startX, y: startY });
    setIsDraggingConnection(true);
  };

  // Función para manejar el movimiento durante el drag-to-connect
  const handleConnectionDragMove = (e: React.MouseEvent) => {
    if (!isDraggingConnection || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    
    setConnectionDragEnd({ x: canvasX, y: canvasY });
  };

  // Función para completar el drag-to-connect
  const handleConnectionDragEnd = (e: React.MouseEvent) => {
    if (!isDraggingConnection || !connectionDragStart) return;
    
    // Buscar si el mouse está sobre el handle de entrada de algún nodo
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    
    // Verificar si está sobre el handle de entrada de algún nodo (lado izquierdo)
    const targetNode = workflowNodes.find(node => {
      const handleX = node.position.x - 72; // Handle de entrada (lado izquierdo)
      const handleY = node.position.y;
      const distance = Math.sqrt(
        Math.pow(canvasX - handleX, 2) + Math.pow(canvasY - handleY, 2)
      );
      return distance <= 20; // Radio de detección más pequeño para mayor precisión
    });
    
    if (targetNode && targetNode.id !== connectionDragStart.nodeId) {
      // Verificar que no existe ya esta conexión
      const sourceNode = workflowNodes.find(n => n.id === connectionDragStart.nodeId);
      if (sourceNode && !sourceNode.connections.includes(targetNode.id)) {
        connectNodes(connectionDragStart.nodeId, targetNode.id);
      }
    }
    
    // Limpiar el estado
    setIsDraggingConnection(false);
    setConnectionDragStart(null);
    setConnectionDragEnd(null);
  };

  // Función para manejar el arrastre de neuronas
  const handleNeuronMouseDown = (e: React.MouseEvent, fromNodeId: string, toNodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggedNeuron({ fromNodeId, toNodeId });
    setIsDraggingNeuron(true);
  };

  // Función para actualizar la posición de una neurona
  const updateNeuronPosition = (fromNodeId: string, toNodeId: string, newPosition: { x: number; y: number }) => {
    setWorkflowNodes(prev => 
      prev.map(node => 
        node.id === fromNodeId 
          ? {
              ...node,
              connectionNeurons: {
                ...node.connectionNeurons,
                [toNodeId]: newPosition
              }
            }
          : node
      )
    );
  };

  // Función para manejar el movimiento de neuronas
  const handleNeuronMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNeuron || !draggedNeuron || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    
    updateNeuronPosition(draggedNeuron.fromNodeId, draggedNeuron.toNodeId, { x: canvasX, y: canvasY });
  };

  // Función para completar el arrastre de neuronas
  const handleNeuronMouseUp = () => {
    setIsDraggingNeuron(false);
    setDraggedNeuron(null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Node action functions
  const handleNodeAction = (nodeId: string, action: string) => {
    switch (action) {
      case 'play':
        console.log('Playing node:', nodeId);
        break;
      case 'power':
        console.log('Toggling power for node:', nodeId);
        break;
      case 'delete':
        setWorkflowNodes(prev => prev.filter(node => node.id !== nodeId));
        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
        }
        break;
      case 'more':
        console.log('More options for node:', nodeId);
        break;
    }
  };

  const handleConnectionClick = (nodeId: string) => {
    if (connectingFromOld) {
      // Si ya estamos conectando desde otro nodo, completar la conexión
      completeConnection(nodeId);
    } else {
      // Si no estamos conectando, mostrar el menú de conexión
      setShowConnectionMenu(nodeId);
    }
  };

  // Drag and Drop from Node Palette
  const handlePaletteNodeMouseDown = (e: React.MouseEvent, nodeType: any) => {
    e.preventDefault();
    setDraggedNodeType(nodeType);
    setIsDraggingFromPalette(true);
    
    // Si es un trigger y no hay nodos, activar estado para ocultar mensaje
    if (nodeType.type === 'trigger' && workflowNodes.length === 0) {
      setIsDraggingTrigger(true);
    }
    
    // Set initial drag preview position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragPreviewPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handlePaletteMouseMove = (e: React.MouseEvent) => {
    if (isDraggingFromPalette && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragPreviewPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handlePaletteMouseUp = (e: React.MouseEvent) => {
    if (isDraggingFromPalette && draggedNodeType) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const position = {
          x: (e.clientX - rect.left) / zoom,
          y: (e.clientY - rect.top) / zoom
        };
        
        addNodeToCanvas(draggedNodeType, position);
      }
    }
    
    setIsDraggingFromPalette(false);
    setDraggedNodeType(null);
    setIsDraggingTrigger(false);
  };

  // Close connection menu when clicking outside
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowConnectionMenu(null);
      setSelectedNode(null);
      // Cancelar conexión manual si está activa
      if (connectingFromOld) {
        setConnectingFromOld(null);
        setConnectionPreview(null);
      }
      // Cancelar drag-to-connect si está activo
      if (isDraggingConnection) {
        setIsDraggingConnection(false);
        setConnectionDragStart(null);
        setConnectionDragEnd(null);
      }
      // Cancelar drag de neurona si está activo
      if (isDraggingNeuron) {
        setIsDraggingNeuron(false);
        setDraggedNeuron(null);
      }
    }
  };

  // Drag and Drop functions
  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    
    setDragOffset({
      x: canvasX - node.position.x,
      y: canvasY - node.position.y
    });
    
    setIsDragging(true);
    setDraggedNode(node);
    setSelectedNode(node);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedNode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    
    const newPosition = {
      x: canvasX - dragOffset.x,
      y: canvasY - dragOffset.y
    };
    
    setWorkflowNodes(prev => 
      prev.map(node => 
        node.id === draggedNode.id 
          ? { ...node, position: newPosition }
          : node
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  // Add event listeners for mouse events
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedNode || !canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / zoom;
      const canvasY = (e.clientY - rect.top) / zoom;
      
      const newPosition = {
        x: canvasX - dragOffset.x,
        y: canvasY - dragOffset.y
      };
      
      setWorkflowNodes(prev => 
        prev.map(node => 
          node.id === draggedNode.id 
            ? { ...node, position: newPosition }
            : node
        )
      );
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggedNode, dragOffset, zoom]);

  // Función para renderizar las conexiones estilo n8n con neuronas
  const renderConnections = () => {
    const connections = [];
    
    // Renderizar conexiones existentes
    workflowNodes.forEach(node => {
      node.connections.forEach(connectedNodeId => {
        const connectedNode = workflowNodes.find(n => n.id === connectedNodeId);
        if (connectedNode) {
          // Puntos de conexión estilo n8n
          const startX = node.position.x + 72; // Punto de salida (lado derecho del nodo)
          const startY = node.position.y;
          const endX = connectedNode.position.x - 72; // Punto de entrada (lado izquierdo del nodo)
          const endY = connectedNode.position.y;
          
          // Obtener posición de la neurona
          const neuron = node.connectionNeurons[connectedNodeId];
          const neuronX = neuron ? neuron.x : startX + (endX - startX) / 2;
          const neuronY = neuron ? neuron.y : startY + (endY - startY) / 2;
          
          // Crear línea con neurona en el medio
          const pathData = `M ${startX} ${startY} L ${neuronX} ${startY} L ${neuronX} ${neuronY} L ${endX} ${neuronY} L ${endX} ${endY}`;
          
          connections.push(
            <g key={`${node.id}-${connectedNodeId}`}>
              {/* Línea de conexión principal */}
              <path
                d={pathData}
                stroke="#3B82F6"
                strokeWidth="3"
                fill="none"
                className="animated-connection"
              />
              {/* Handle de salida */}
              <circle
                cx={startX}
                cy={startY}
                r="4"
                fill="#3B82F6"
                stroke="#ffffff"
                strokeWidth="1"
              />
              {/* Handle de entrada */}
              <circle
                cx={endX}
                cy={endY}
                r="4"
                fill="#3B82F6"
                stroke="#ffffff"
                strokeWidth="1"
              />
              {/* Neurona (punto de control) */}
              <circle
                cx={neuronX}
                cy={neuronY}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-grab hover:fill-green-400 transition-colors"
                onMouseDown={(e) => handleNeuronMouseDown(e, node.id, connectedNodeId)}
                style={{ pointerEvents: 'all' }}
              />
              {/* Punto central de la neurona */}
              <circle
                cx={neuronX}
                cy={neuronY}
                r="2"
                fill="#ffffff"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        }
      });
    });
    
    // Renderizar preview de conexión mientras se arrastra
    if (isDraggingConnection && connectionDragStart && connectionDragEnd) {
      const startX = connectionDragStart.x;
      const startY = connectionDragStart.y;
      const endX = connectionDragEnd.x;
      const endY = connectionDragEnd.y;
      
      // Crear línea con ángulos rectos para el preview
      const midX = startX + (endX - startX) / 2;
      const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
      
      connections.push(
        <g key="connection-preview">
          {/* Línea de preview */}
          <path
            d={pathData}
            stroke="#06b6d4"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5 5"
            opacity="0.7"
          />
          {/* Handle de salida */}
          <circle
            cx={startX}
            cy={startY}
            r="4"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
          {/* Handle de destino */}
          <circle
            cx={endX}
            cy={endY}
            r="4"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
        </g>
      );
    }
    
    return connections;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
        
        @keyframes flowAnimation {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -20;
          }
        }
        
        .animated-connection {
          stroke: #3B82F6;
          stroke-width: 3;
          fill: none;
          stroke-dasharray: 8 8;
          animation: flowAnimation 1.5s linear infinite;
        }
        
        .connection-handle {
          fill: #3B82F6;
          stroke: #ffffff;
          stroke-width: 1;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">Agent Creator</span>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Workflow Status Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isWorkflowActive ? 'text-green-400' : 'text-gray-400'}`}>
              {isWorkflowActive ? 'Activo' : 'Inactivo'}
            </span>
            <button
              onClick={() => setIsWorkflowActive(!isWorkflowActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isWorkflowActive ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isWorkflowActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="w-full h-full relative bg-gray-800"
          style={{
            backgroundImage: `
              radial-gradient(circle, #374151 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            transform: `scale(${zoom})`,
            transformOrigin: '0 0'
          }}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handlePaletteMouseMove(e);
            handleConnectionDragMove(e);
            handleNeuronMouseMove(e);
            handleCanvasMouseMove(e);
          }}
          onMouseUp={(e) => {
            handleMouseUp();
            handlePaletteMouseUp(e);
            handleConnectionDragEnd(e);
            handleNeuronMouseUp();
            handleCanvasMouseUp(e);
          }}
          onClick={handleCanvasClick}
        >
          {/* Sistema de conexiones estilo n8n */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {/* Mostrar conexiones automáticas entre nodos */}
            {workflowNodes.map((node, nodeIndex) => {
              // Si no es el primer nodo, conectar al anterior
              if (nodeIndex > 0) {
                const prevNode = workflowNodes[nodeIndex - 1];
                
                const fromX = prevNode.position.x + 144;
                const fromY = prevNode.position.y + 40;
                const toX = node.position.x;
                const toY = node.position.y + 40;

                // Crear curva Bezier suave como en n8n
                const distance = Math.abs(toX - fromX);
                const controlOffset = Math.min(distance * 0.5, 100);
                
                // Curva suave que baja ligeramente en el medio
                const midY = (fromY + toY) / 2 + 20; // Curva hacia abajo

                const pathData = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY} ${toX - controlOffset} ${toY} ${toX} ${toY}`;

                return (
                  <g key={`connection-${prevNode.id}-${node.id}`}>
                    {/* Línea principal - estilo n8n */}
                    <path
                      d={pathData}
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    
                    {/* Punto de salida - círculo gris */}
                    <circle
                      cx={fromX}
                      cy={fromY}
                      r="4"
                      fill="#9CA3AF"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    
                    {/* Punto de entrada - cuadrado gris */}
                    <rect
                      x={toX - 4}
                      y={toY - 4}
                      width="8"
                      height="8"
                      fill="#9CA3AF"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    
                    {/* Texto en el medio de la línea */}
                    <text
                      x={(fromX + toX) / 2}
                      y={midY - 10}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      className="pointer-events-none"
                    >
                      -POST-
                    </text>
                  </g>
                );
              }
              return null;
            })}
          </svg>


          {/* Start Node */}
          {workflowNodes.length === 0 && !isDraggingTrigger && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setShowNodePalette(true)}
                  className="w-24 h-24 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 cursor-pointer group"
                >
                  <Bot className="w-12 h-12 text-gray-400 group-hover:text-cyan-300 transition-colors duration-300" />
                </button>
                <div className="text-center">
                  <p className="text-white font-medium">Inicio</p>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Nodes */}
          {workflowNodes.map((node) => {
            const IconComponent = node.icon;
            return (
              <div
                key={node.id}
                className={`absolute cursor-move select-none ${isDragging && draggedNode?.id === node.id ? 'z-50' : 'z-20'}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Hover Options */}
                {hoveredNode === node.id && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeAction(node.id, 'play');
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeAction(node.id, 'power');
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-yellow-400 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeAction(node.id, 'delete');
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeAction(node.id, 'more');
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Node */}
                <div className={`
                  w-36 h-24 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-3
                  ${selectedNode?.id === node.id ? 'border-cyan-400 shadow-lg shadow-cyan-400/20' : 'border-gray-500'}
                  hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-300/10 transition-all duration-200
                  ${isDragging && draggedNode?.id === node.id ? 'scale-105 shadow-2xl shadow-cyan-400/30' : ''}
                `}>
                  <div className="relative">
                    <IconComponent className="w-7 h-7 text-cyan-300 mb-2" />
                    {selectedNode?.id === node.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs text-white text-center font-medium tracking-wide">{node.name}</span>
                </div>

                {/* Connection Handles - Sistema Avanzado */}
                {/* Puntos de conexión de entrada */}
                {node.inputs.map((input) => (
                  <AgentConnectionPoint
                    key={input.id}
                    point={input}
                    nodeId={node.id}
                    nodePosition={node.position}
                    onPositionUpdate={(pointId, position) => 
                      handleConnectionPointUpdate(node.id, pointId, position)
                    }
                  />
                ))}

                {/* Puntos de conexión de salida */}
                {node.outputs.map((output) => (
                  <AgentConnectionPoint
                    key={output.id}
                    point={output}
                    nodeId={node.id}
                    nodePosition={node.position}
                    onPositionUpdate={(pointId, position) => 
                      handleConnectionPointUpdate(node.id, pointId, position)
                    }
                  />
                ))}

                {/* Connection Menu */}
                {showConnectionMenu === node.id && (
                  <div className="absolute top-1/2 -right-32 transform -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-lg z-30">
                    <div className="text-xs text-gray-300 mb-2">Add connection:</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setShowConnectionMenu(null);
                          setShowNodePalette(true);
                        }}
                        className="w-full text-left px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded"
                      >
                        Add new node
                      </button>
                      <button
                        onClick={() => {
                          setShowConnectionMenu(null);
                          startConnection(node.id);
                        }}
                        className="w-full text-left px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded"
                      >
                        Connect to existing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Drag Preview */}
          {isDraggingFromPalette && draggedNodeType && (
            <div
              className="absolute pointer-events-none z-50"
              style={{
                left: dragPreviewPosition.x,
                top: dragPreviewPosition.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-36 h-24 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-400 rounded-lg flex flex-col items-center justify-center p-3 shadow-lg shadow-cyan-400/20 opacity-80">
                <div className="relative">
                  <draggedNodeType.icon className="w-7 h-7 text-cyan-300 mb-2" />
                </div>
                <span className="text-xs text-white text-center font-medium tracking-wide">{draggedNodeType.name}</span>
              </div>
            </div>
          )}

          {/* Connection Mode Indicator */}
          {connectingFromOld && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
              <div className="bg-cyan-600 border border-cyan-400 rounded-lg p-3 shadow-lg">
                <p className="text-white text-sm font-medium">
                  Modo conexión: Haz clic en otro nodo para conectar
                </p>
                <button
                  onClick={() => {
                    setConnectingFromOld(null);
                    setConnectionPreview(null);
                  }}
                  className="text-cyan-200 hover:text-white text-xs underline mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Drag-to-Connect Indicator */}
          {isDraggingConnection && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
              <div className="bg-blue-600 border border-blue-400 rounded-lg p-3 shadow-lg">
                <p className="text-white text-sm font-medium">
                  Arrastra hacia otro nodo para conectar
                </p>
                <button
                  onClick={() => {
                    setIsDraggingConnection(false);
                    setConnectionDragStart(null);
                    setConnectionDragEnd(null);
                  }}
                  className="text-blue-200 hover:text-white text-xs underline mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Empty State Message */}
          {workflowNodes.length === 0 && !isDraggingTrigger && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 translate-y-32">
              <div className="bg-gray-700 border border-dashed border-gray-500 rounded-lg p-6 text-center max-w-md">
                <p className="text-white font-medium mb-2">Comienza tu workflow</p>
                <p className="text-gray-400 text-sm">
                  Arrastra un <span className="text-cyan-400 font-medium">trigger</span> desde la paleta para comenzar a construir tu agente.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Los triggers definen cuándo se ejecuta tu agente
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Node Palette - Simplified Design */}
        {showNodePalette && (
          <div className="absolute top-4 right-4 w-96 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-white font-bold text-lg">Node Palette</h3>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {nodeTypes.map((category, categoryIndex) => {
                // Filtrar nodos según el estado del workflow
                const filteredNodes = category.nodes.filter(node => {
                  // Si no hay nodos, solo mostrar triggers
                  if (workflowNodes.length === 0) {
                    return node.type === 'trigger';
                  }
                  // Si ya hay nodos, no mostrar triggers
                  return node.type !== 'trigger';
                });

                // Si no hay nodos para mostrar en esta categoría, no renderizar la categoría
                if (filteredNodes.length === 0) {
                  return null;
                }

                return (
                  <div key={category.category} className="mb-6">
                    <div className="mb-3">
                      <h4 className="text-cyan-300 text-sm font-bold uppercase">
                        {category.category}
                      </h4>
                      {workflowNodes.length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Selecciona un trigger para comenzar
                        </p>
                      )}
                      {workflowNodes.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Agrega acciones al workflow
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {filteredNodes.map((node, nodeIndex) => {
                        const IconComponent = node.icon;
                        return (
                          <div
                            key={node.name}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-700 border border-gray-600 hover:border-cyan-400 cursor-grab active:cursor-grabbing transition-colors select-none"
                            onMouseDown={(e) => handlePaletteNodeMouseDown(e, node)}
                          >
                            {/* Icon */}
                            <div className={`w-10 h-10 ${node.color} rounded-lg flex items-center justify-center`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">
                                {node.name}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {node.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-600">
              <div className="text-xs text-gray-400 text-center">
                {workflowNodes.length === 0 
                  ? "Arrastra un trigger para comenzar el workflow"
                  : "Arrastra acciones para continuar el flujo"
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-300 px-2">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNodePalette(!showNodePalette)}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}