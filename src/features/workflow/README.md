# Sistema de Conexiones Visuales para Workflow Builder

Este sistema implementa conexiones visuales tipo n8n para crear workflows con nodos conectables.

## Componentes Principales

### 1. **WorkflowCanvas** - Componente principal
```tsx
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';

<WorkflowCanvas
  nodes={nodes}
  onNodesChange={setNodes}
  className="w-full h-full"
/>
```

### 2. **WorkflowNode** - Nodos individuales
```tsx
import { WorkflowNode } from '@/components/workflow/WorkflowNode';

// Los nodos se renderizan automáticamente dentro del canvas
```

### 3. **ConnectionRenderer** - Renderizado de conexiones SVG
```tsx
import { ConnectionRenderer } from '@/components/workflow/ConnectionRenderer';

// Se renderiza automáticamente dentro del canvas
```

## Características Implementadas

### ✅ **Conexiones Visuales**
- **SVG con curvas Bezier** suaves tipo n8n
- **Colores adaptativos**: Gris por defecto, verde en hover
- **Grosor dinámico**: 2px normal, 3px en hover
- **Líneas temporales** punteadas durante el arrastre

### ✅ **Puntos de Conexión**
- **Puntos de entrada** (azules) a la izquierda de cada nodo
- **Puntos de salida** (verdes) a la derecha de cada nodo
- **Hover effects** con escalado y sombras
- **Estados visuales** para conexiones activas

### ✅ **Sistema de Conexión**
- **Click y arrastrar** desde punto de salida
- **Línea temporal** que sigue el cursor
- **Validación** para evitar auto-conexiones
- **Cancelación** al soltar en área inválida

### ✅ **Gestión de Estado**
- **Zustand store** para conexiones globales
- **Estado reactivo** que se actualiza automáticamente
- **Persistencia** de conexiones entre re-renders

## Uso Básico

### 1. **Configurar el Store**
```tsx
import { useConnectionStore } from '@/stores/connectionStore';

const { connections, addConnection, removeConnection } = useConnectionStore();
```

### 2. **Definir Nodos**
```tsx
const [nodes, setNodes] = useState<WorkflowNodeType[]>([
  {
    id: 'node-1',
    type: 'Trigger',
    position: { x: 100, y: 100 },
    data: { triggerType: 'webhook' },
    inputs: [],
    outputs: [],
  },
  // ... más nodos
]);
```

### 3. **Renderizar Canvas**
```tsx
<WorkflowCanvas
  nodes={nodes}
  onNodesChange={setNodes}
  className="w-full h-full"
/>
```

## Interacciones

### **Crear Conexión**
1. Haz click en el **punto verde** (salida) de un nodo
2. Arrastra hasta el **punto azul** (entrada) de otro nodo
3. Suelta para crear la conexión

### **Eliminar Conexión**
1. Pasa el mouse sobre una conexión
2. Haz click en el **círculo rojo** que aparece

### **Mover Nodos**
1. Arrastra cualquier parte del nodo (excepto los puntos de conexión)
2. Las conexiones se actualizan automáticamente

## Personalización

### **Colores de Conexión**
```tsx
// En ConnectionRenderer.tsx
stroke={isHovered ? "#10b981" : "#6b7280"} // Verde hover, gris normal
```

### **Estilo de Curvas**
```tsx
// En ConnectionRenderer.tsx
const controlOffset = Math.min(distance * 0.3, 100); // Ajustar curvatura
```

### **Tamaño de Puntos**
```tsx
// En ConnectionPoint.tsx
className="w-3 h-3" // Cambiar tamaño de puntos
```

## Estructura de Archivos

```
src/components/workflow/
├── WorkflowCanvas.tsx      # Canvas principal
├── WorkflowNode.tsx        # Componente de nodo
├── ConnectionPoint.tsx     # Puntos de conexión
├── ConnectionRenderer.tsx  # Renderizado SVG
├── WorkflowExample.tsx     # Ejemplo de uso
└── README.md              # Esta documentación

src/stores/
└── connectionStore.ts     # Store Zustand

src/types/
└── workflow.ts           # Tipos TypeScript
```

## Próximas Mejoras

- [ ] **Múltiples inputs/outputs** por nodo
- [ ] **Validación de tipos** de conexión
- [ ] **Undo/Redo** para conexiones
- [ ] **Exportar/Importar** workflows
- [ ] **Zoom y pan** en el canvas
- [ ] **Snap to grid** para alineación
- [ ] **Minimap** del workflow


