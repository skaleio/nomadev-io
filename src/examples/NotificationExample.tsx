/**
 * EJEMPLO DE USO DEL SISTEMA DE NOTIFICACIONES
 * 
 * Este archivo muestra cómo usar el sistema de notificaciones desde cualquier componente.
 * NO es necesario incluir este archivo en tu app, es solo para referencia.
 */

import { useNotifications } from '@/contexts/NotificationsContext';

export function NotificationExample() {
  const { addNotification } = useNotifications();

  // Ejemplo 1: Notificación de nuevo mensaje de chat
  const handleNewChatMessage = (senderName: string) => {
    addNotification({
      type: 'chat',
      title: 'Nuevo mensaje',
      message: `${senderName} te ha enviado un mensaje en WhatsApp`,
      time: 'hace unos segundos',
      read: false,
      priority: 'high',
      actionUrl: '/chat',
    });
  };

  // Ejemplo 2: Notificación de nuevo pedido
  const handleNewOrder = (orderNumber: string, amount: number) => {
    addNotification({
      type: 'order',
      title: 'Nuevo pedido',
      message: `Pedido #${orderNumber} por $${amount} requiere validación`,
      time: 'hace unos segundos',
      read: false,
      priority: 'high',
      actionUrl: '/orders',
    });
  };

  // Ejemplo 3: Notificación de cliente validado
  const handleClientValidated = (clientName: string) => {
    addNotification({
      type: 'validation',
      title: 'Cliente validado',
      message: `${clientName} ha sido validado exitosamente`,
      time: 'hace unos segundos',
      read: false,
      priority: 'medium',
      actionUrl: '/validation',
    });
  };

  // Ejemplo 4: Alerta de stock bajo
  const handleLowStock = (productName: string, quantity: number) => {
    addNotification({
      type: 'alert',
      title: 'Stock bajo',
      message: `Producto "${productName}" tiene solo ${quantity} unidades`,
      time: 'hace unos segundos',
      read: false,
      priority: 'medium',
      actionUrl: '/shopify',
    });
  };

  // Ejemplo 5: Lead caliente
  const handleHotLead = (leadName: string, visits: number) => {
    addNotification({
      type: 'lead',
      title: 'Lead caliente',
      message: `${leadName} ha visitado tu tienda ${visits} veces esta semana`,
      time: 'hace unos segundos',
      read: false,
      priority: 'low',
      actionUrl: '/leads',
    });
  };

  // Ejemplo 6: Sincronización completada
  const handleSyncCompleted = (productCount: number) => {
    addNotification({
      type: 'system',
      title: 'Sincronización completada',
      message: `Shopify se sincronizó correctamente con ${productCount} productos`,
      time: 'hace unos segundos',
      read: false,
      priority: 'low',
      actionUrl: '/settings',
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Ejemplos de Notificaciones</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleNewChatMessage('María González')}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Nuevo Mensaje de Chat
        </button>

        <button
          onClick={() => handleNewOrder('1247', 320.50)}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Nuevo Pedido
        </button>

        <button
          onClick={() => handleClientValidated('Juan Pérez')}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Cliente Validado
        </button>

        <button
          onClick={() => handleLowStock('Zapatillas Nike Air', 3)}
          className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Alerta de Stock Bajo
        </button>

        <button
          onClick={() => handleHotLead('Ana Silva', 5)}
          className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Lead Caliente
        </button>

        <button
          onClick={() => handleSyncCompleted(47)}
          className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Sincronización Completada
        </button>
      </div>
    </div>
  );
}

/**
 * INTEGRACIÓN CON TU APP:
 * 
 * 1. En cualquier componente, importa el hook:
 *    import { useNotifications } from '@/contexts/NotificationsContext';
 * 
 * 2. Usa el hook:
 *    const { addNotification } = useNotifications();
 * 
 * 3. Llama a addNotification cuando necesites mostrar una notificación:
 *    addNotification({
 *      type: 'chat' | 'order' | 'validation' | 'alert' | 'lead' | 'system',
 *      title: 'Título',
 *      message: 'Descripción de la notificación',
 *      time: 'hace unos segundos',
 *      read: false,
 *      priority: 'low' | 'medium' | 'high',
 *      actionUrl: '/ruta-de-navegacion', // Opcional
 *    });
 * 
 * EJEMPLOS DE INTEGRACIÓN REAL:
 * 
 * - En ChatPage.tsx: Cuando llega un nuevo mensaje de WhatsApp
 * - En ShopifyPage.tsx: Cuando se crea un nuevo pedido
 * - En ValidationPage.tsx: Cuando se valida/rechaza un cliente
 * - En cualquier lugar donde ocurra un evento importante
 */

