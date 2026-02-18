import { create } from 'zustand';
import { WorkflowConnection, ConnectionState } from '@/types/workflow';

interface ConnectionStore extends ConnectionState {
  // Actions
  addConnection: (connection: Omit<WorkflowConnection, 'id'>) => void;
  removeConnection: (connectionId: string) => void;
  startConnecting: (nodeId: string, pointId: string, position: { x: number; y: number }) => void;
  updateConnectingPosition: (position: { x: number; y: number }) => void;
  finishConnecting: (nodeId: string, pointId: string) => void;
  cancelConnecting: () => void;
  setHoveredConnection: (connectionId: string | null) => void;
  clearAllConnections: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  // Initial state
  connections: [],
  isConnecting: false,
  connectingFrom: null,
  hoveredConnection: null,

  // Actions
  addConnection: (connection) => {
    const newConnection: WorkflowConnection = {
      ...connection,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    set((state) => ({
      connections: [...state.connections, newConnection],
    }));
  },

  removeConnection: (connectionId) => {
    set((state) => ({
      connections: state.connections.filter(conn => conn.id !== connectionId),
    }));
  },

  startConnecting: (nodeId, pointId, position) => {
    set({
      isConnecting: true,
      connectingFrom: {
        nodeId,
        pointId,
        position,
      },
    });
  },

  updateConnectingPosition: (position) => {
    set((state) => ({
      connectingFrom: state.connectingFrom ? {
        ...state.connectingFrom,
        position,
      } : null,
    }));
  },

  finishConnecting: (nodeId, pointId) => {
    const { connectingFrom } = get();
    
    if (!connectingFrom) return;

    // Verificar que no se conecte consigo mismo
    if (connectingFrom.nodeId === nodeId) {
      get().cancelConnecting();
      return;
    }

    // Verificar que no exista ya esta conexión
    const existingConnection = get().connections.find(conn => 
      conn.from.nodeId === connectingFrom.nodeId &&
      conn.from.pointId === connectingFrom.pointId &&
      conn.to.nodeId === nodeId &&
      conn.to.pointId === pointId
    );

    if (existingConnection) {
      get().cancelConnecting();
      return;
    }

    // Crear nueva conexión
    get().addConnection({
      from: {
        nodeId: connectingFrom.nodeId,
        pointId: connectingFrom.pointId,
      },
      to: {
        nodeId,
        pointId,
      },
    });

    get().cancelConnecting();
  },

  cancelConnecting: () => {
    set({
      isConnecting: false,
      connectingFrom: null,
    });
  },

  setHoveredConnection: (connectionId) => {
    set({ hoveredConnection: connectionId });
  },

  clearAllConnections: () => {
    set({
      connections: [],
      isConnecting: false,
      connectingFrom: null,
      hoveredConnection: null,
    });
  },
}));


