# Integración Frontend con Backend

## 1. Configuración Inicial

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto frontend:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# WebSocket Configuration
VITE_WS_URL=ws://localhost:3001

# App Configuration
VITE_APP_NAME=Shopify WhatsApp SaaS
VITE_APP_VERSION=1.0.0

# Development
VITE_DEV_MODE=true
```

### Para Producción
```env
# API Configuration
VITE_API_URL=https://tu-backend.railway.app/api

# WebSocket Configuration
VITE_WS_URL=wss://tu-backend.railway.app

# App Configuration
VITE_APP_NAME=Shopify WhatsApp SaaS
VITE_APP_VERSION=1.0.0

# Development
VITE_DEV_MODE=false
```

## 2. Estructura de Archivos Agregados

```
src/
├── lib/
│   └── api.ts                 # Cliente API centralizado
├── hooks/
│   └── useWebSocket.ts        # Hook para WebSocket
├── contexts/
│   ├── AuthContext.tsx        # Context de autenticación
│   └── WebSocketContext.tsx   # Context de WebSocket
├── components/
│   └── ProtectedRoute.tsx     # Componente para rutas protegidas
└── pages/
    ├── LoginPage.tsx          # Página de login
    └── RegisterPage.tsx       # Página de registro
```

## 3. Uso de la API

### Autenticación
```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
      // Usuario autenticado
    } catch (error) {
      // Manejar error
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Hola, {user?.firstName}!</p>
          <button onClick={logout}>Cerrar Sesión</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
};
```

### Llamadas a la API
```typescript
import { shopifyApi, whatsappApi } from '../lib/api';

const MyComponent = () => {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopsData = await shopifyApi.getShops();
        setShops(shopsData);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };

    fetchShops();
  }, []);

  const sendMessage = async () => {
    try {
      await whatsappApi.sendTextMessage({
        phoneNumber: '+1234567890',
        message: 'Hola! Este es un mensaje de prueba.'
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h2>Tiendas Conectadas</h2>
      {shops.map(shop => (
        <div key={shop.id}>
          <h3>{shop.shopName}</h3>
          <p>{shop.shopifyDomain}</p>
        </div>
      ))}
      
      <button onClick={sendMessage}>Enviar Mensaje</button>
    </div>
  );
};
```

### WebSocket
```typescript
import { useWebSocketContext } from '../contexts/WebSocketContext';

const ChatComponent = () => {
  const { isConnected, lastMessage, joinConversation } = useWebSocketContext();

  useEffect(() => {
    if (isConnected) {
      joinConversation('conversation-id');
    }
  }, [isConnected, joinConversation]);

  useEffect(() => {
    if (lastMessage) {
      console.log('Nuevo mensaje:', lastMessage);
      // Actualizar UI con el nuevo mensaje
    }
  }, [lastMessage]);

  return (
    <div>
      <p>Estado de conexión: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      {/* UI del chat */}
    </div>
  );
};
```

## 4. Rutas Protegidas

Todas las rutas principales están protegidas y requieren autenticación:

```typescript
// En App.tsx
<Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
<Route path="/shopify" element={<ProtectedRoute><ShopifyPage /></ProtectedRoute>} />
<Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
```

## 5. Manejo de Errores

### Errores de API
```typescript
import { ApiError } from '../lib/api';

try {
  await shopifyApi.getShops();
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Token expirado, redirigir al login
      window.location.href = '/login';
    } else {
      // Mostrar error al usuario
      alert(error.message);
    }
  }
}
```

### Errores de WebSocket
```typescript
const { error } = useWebSocketContext();

if (error) {
  return (
    <div className="error">
      <p>Error de conexión: {error}</p>
      <button onClick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  );
}
```

## 6. Testing

### Mock de la API para Testing
```typescript
// En tests
import { vi } from 'vitest';

vi.mock('../lib/api', () => ({
  shopifyApi: {
    getShops: vi.fn().mockResolvedValue([
      { id: '1', shopName: 'Test Shop', shopifyDomain: 'test.myshopify.com' }
    ])
  }
}));
```

## 7. Deploy

### Variables de Entorno en Producción
Asegúrate de configurar las variables de entorno en tu plataforma de deploy:

**Vercel:**
```bash
vercel env add VITE_API_URL
vercel env add VITE_WS_URL
```

**Netlify:**
```bash
netlify env:set VITE_API_URL "https://tu-backend.railway.app/api"
netlify env:set VITE_WS_URL "wss://tu-backend.railway.app"
```

## 8. Troubleshooting

### Problemas Comunes

**Error: "API URL not configured"**
- Verifica que `VITE_API_URL` esté configurada en `.env`
- Asegúrate de que el backend esté ejecutándose

**Error: "WebSocket connection failed"**
- Verifica que `VITE_WS_URL` esté configurada correctamente
- Asegúrate de que el backend soporte WebSockets

**Error: "CORS error"**
- Verifica que el backend tenga configurado CORS para tu dominio
- En desarrollo, asegúrate de que `FRONTEND_URL` esté configurada en el backend

**Error: "Authentication failed"**
- Verifica que el token esté guardado en localStorage
- Revisa que el backend esté configurado correctamente

### Logs Útiles
```typescript
// Habilitar logs de debug
localStorage.setItem('debug', 'true');

// Ver estado de autenticación
console.log('Auth state:', useAuth());

// Ver estado de WebSocket
console.log('WebSocket state:', useWebSocketContext());
```

## 9. Próximos Pasos

1. **Implementar páginas específicas** usando los hooks y contextos
2. **Agregar manejo de estado** con React Query para caching
3. **Implementar notificaciones** en tiempo real
4. **Agregar tests** para los componentes
5. **Optimizar performance** con lazy loading y code splitting


