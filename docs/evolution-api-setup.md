# Configuración de Evolution API

## Descripción
Evolution API es un servicio que permite integrar WhatsApp Business API con tu aplicación. Esta integración permite enviar y recibir mensajes de WhatsApp en tiempo real.

## Configuración

### 1. Variables de Entorno
Agrega las siguientes variables a tu archivo `.env`:

```bash
# Evolution API Configuration
VITE_EVOLUTION_API_URL=wss://api.evolution.com
VITE_EVOLUTION_INSTANCE=rdrgz
```

### 2. Instalación de Dependencias
La dependencia `socket.io-client` ya está instalada. Si necesitas reinstalarla:

```bash
npm install socket.io-client
```

### 3. Configuración de la Instancia
1. Ve a tu panel de Evolution API
2. Crea una nueva instancia o usa la existente `rdrgz`
3. Configura los webhooks para recibir mensajes
4. Obtén el token de autenticación

### 4. Webhook de Evolution API
Configura el webhook en Evolution API para que apunte a:
```
https://tu-supabase-project.supabase.co/functions/v1/whatsapp-webhook
```

## Funcionalidades Implementadas

### Chat en Tiempo Real
- ✅ Conexión WebSocket con Evolution API
- ✅ Recepción de mensajes en tiempo real
- ✅ Envío de mensajes
- ✅ Indicadores de estado (enviado, entregado, leído)
- ✅ Indicadores de typing
- ✅ Lista de conversaciones dinámica
- ✅ Búsqueda de conversaciones

### Integración con Automatización n8n
- ✅ Webhook para recibir validaciones de pedidos
- ✅ Procesamiento de diferentes tipos de mensajes
- ✅ Estados de validación en tiempo real

## Uso

### Enviar Mensaje
```typescript
const { sendMessage } = useEvolution();
sendMessage('+56912345678@s.whatsapp.net', 'Hola, ¿cómo estás?');
```

### Recibir Mensajes
Los mensajes se reciben automáticamente a través del WebSocket y se muestran en la interfaz de chat.

### Estados de Conexión
- **Conectado**: Verde con ícono de WiFi
- **Desconectado**: Rojo con ícono de WiFi tachado
- **Error**: Badge de error con detalles

## Troubleshooting

### Problemas de Conexión
1. Verifica que la URL de Evolution API sea correcta
2. Confirma que la instancia existe y está activa
3. Revisa los logs de la consola para errores

### Mensajes No Llegan
1. Verifica la configuración del webhook
2. Confirma que la función `whatsapp-webhook` esté desplegada
3. Revisa los logs de Supabase Functions

### Errores de Autenticación
1. Verifica el token de Evolution API
2. Confirma que la instancia tenga permisos correctos
3. Revisa la configuración de CORS

## Estructura de Datos

### Mensaje de Evolution API
```typescript
interface EvolutionMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'document';
  status?: 'sent' | 'delivered' | 'read';
}
```

### Webhook de n8n
```typescript
interface OrderValidationData {
  clientId: string;
  messageId: string;
  date_time: string;
  etapaActual: 'Producto' | 'Dirección' | 'Monto' | 'Confirmación';
  mensajeCliente: string;
  pedidoCompleto: boolean;
  bloqueDestino: 'validacion' | 'trackid' | 'duda';
}
```

## Próximos Pasos

1. **Configurar instancia real de Evolution API**
2. **Probar envío y recepción de mensajes**
3. **Integrar con tu automatización n8n**
4. **Configurar webhooks de Shopify**
5. **Probar flujo completo de validación de pedidos**
