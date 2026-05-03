export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  inputs: ConnectionPoint[];
  outputs: ConnectionPoint[];
}

export interface ConnectionPoint {
  id: string;
  type: 'input' | 'output';
  position: { x: number; y: number };
  connected: boolean;
}

export interface WorkflowConnection {
  id: string;
  from: {
    nodeId: string;
    pointId: string;
  };
  to: {
    nodeId: string;
    pointId: string;
  };
  isTemporary?: boolean; // Para conexiones durante el arrastre
}

export interface ConnectionState {
  connections: WorkflowConnection[];
  isConnecting: boolean;
  connectingFrom: {
    nodeId: string;
    pointId: string;
    position: { x: number; y: number };
  } | null;
  hoveredConnection: string | null;
}

export interface BezierCurve {
  start: { x: number; y: number };
  control1: { x: number; y: number };
  control2: { x: number; y: number };
  end: { x: number; y: number };
}


