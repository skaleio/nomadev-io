import React, { useState } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowNode as WorkflowNodeType } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { useConnectionStore } from '@/stores/connectionStore';

export function WorkflowExample() {
  const [nodes, setNodes] = useState<WorkflowNodeType[]>([
    {
      id: 'node-1',
      type: 'Start',
      position: { x: 100, y: 150 },
      data: { triggerType: 'webhook' },
      inputs: [],
      outputs: [],
    },
    {
      id: 'node-2',
      type: 'Transform',
      position: { x: 400, y: 150 },
      data: { processType: 'transform' },
      inputs: [],
      outputs: [],
    },
    {
      id: 'node-3',
      type: 'API Call',
      position: { x: 700, y: 100 },
      data: { emailType: 'notification' },
      inputs: [],
      outputs: [],
    },
    {
      id: 'node-4',
      type: 'Database',
      position: { x: 700, y: 250 },
      data: { condition: 'if-then' },
      inputs: [],
      outputs: [],
    },
  ]);

  const { connections, clearAllConnections } = useConnectionStore();

  const addNode = () => {
    const newNode: WorkflowNodeType = {
      id: `node-${Date.now()}`,
      type: 'New Node',
      position: { 
        x: Math.random() * 500 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {},
      inputs: [],
      outputs: [],
    };
    setNodes(prev => [...prev, newNode]);
  };

  const resetCanvas = () => {
    setNodes([
      {
        id: 'node-1',
        type: 'Trigger',
        position: { x: 100, y: 100 },
        data: { triggerType: 'webhook' },
        inputs: [],
        outputs: [],
      },
      {
        id: 'node-2',
        type: 'Process Data',
        position: { x: 400, y: 100 },
        data: { processType: 'transform' },
        inputs: [],
        outputs: [],
      },
    ]);
    clearAllConnections();
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Workflow Builder</h1>
          <div className="text-sm text-gray-400">
            {nodes.length} nodos • {connections.length} conexiones
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={addNode}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            + Agregar Nodo
          </Button>
          <Button 
            onClick={resetCanvas}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <WorkflowCanvas
          nodes={nodes}
          onNodesChange={setNodes}
          className="w-full h-full"
        />
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="text-sm text-gray-300 space-y-1">
          <div><strong className="text-white">Instrucciones:</strong></div>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Arrastra los nodos para moverlos por el canvas</li>
            <li>Click en el punto <span className="text-emerald-400">verde (salida)</span> de un nodo y arrastra hasta el punto <span className="text-blue-400">azul (entrada)</span> de otro nodo</li>
            <li>Pasa el mouse sobre una conexión para ver el botón de eliminar</li>
            <li>Click en el botón rojo para eliminar una conexión</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


