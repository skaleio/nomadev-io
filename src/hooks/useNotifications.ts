import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'validation' | 'system' | 'chat' | 'order' | 'integration' | 'security';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  count?: number; // Para notificaciones consolidadas
  items?: any[]; // Para agrupar elementos similares
}

interface ConsolidatedNotification {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  count: number;
  items: any[];
  actionUrl?: string;
  actionText?: string;
  icon?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [consolidatedMode, setConsolidatedMode] = useState(false);

  // Cargar notificaciones cerradas del localStorage
  useEffect(() => {
    const savedDismissed = localStorage.getItem('dismissedNotifications');
    if (savedDismissed) {
      setDismissedNotifications(new Set(JSON.parse(savedDismissed)));
    }
  }, []);

  // Generar notificaciones optimizadas y escalables
  useEffect(() => {
    try {
      const generateOptimizedNotifications = (): Notification[] => {
        const notifications: Notification[] = [];

        // 1. Notificación consolidada de validaciones
        notifications.push({
          id: 'validation-consolidated',
          type: 'validation',
          title: 'Validaciones Pendientes',
          message: '1,247 pedidos requieren validación',
          priority: 'urgent',
          timestamp: new Date(Date.now() - 5 * 60000),
          actionUrl: '/order-validation',
          actionText: 'Ver Todos',
          icon: 'Shield',
          count: 1247,
          items: [
            { id: 'order-1', number: '#000001', customer: 'Cliente 1', amount: 150 },
            { id: 'order-2', number: '#000002', customer: 'Cliente 2', amount: 275 },
            { id: 'order-3', number: '#000003', customer: 'Cliente 3', amount: 89 }
          ]
        });

        // 2. Notificación de chats
        notifications.push({
          id: 'chats-consolidated',
          type: 'chat',
          title: 'Chats Sin Leer',
          message: '8 conversaciones requieren atención',
          priority: 'medium',
          timestamp: new Date(Date.now() - 2 * 60000),
          actionUrl: '/chat',
          actionText: 'Responder',
          icon: 'MessageCircle',
          count: 8,
          items: [
            { id: 'chat-1', customer: 'Cliente 1', lastMessage: 'Hola, necesito ayuda...', timeAgo: '2 min' },
            { id: 'chat-2', customer: 'Cliente 2', lastMessage: '¿Cuándo llega mi pedido?', timeAgo: '5 min' }
          ]
        });

        // 3. Notificación del sistema
        notifications.push({
          id: 'system-update',
          type: 'system',
          title: 'Actualización Disponible',
          message: 'Nueva versión de NOMADEV.IO disponible',
          priority: 'medium',
          timestamp: new Date(Date.now() - 15 * 60000),
          actionUrl: '/settings',
          actionText: 'Actualizar',
          icon: 'Download',
          count: 1,
          items: []
        });

        return notifications;
      };

      // Cargar notificaciones optimizadas
      const allNotifications = generateOptimizedNotifications();
      const filteredNotifications = allNotifications.filter(
        notification => !dismissedNotifications.has(notification.id)
      );
      
      if (filteredNotifications.length > 0) {
        setConsolidatedMode(true);
        const timer = setTimeout(() => {
          setNotifications(filteredNotifications);
          setIsVisible(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
      // En caso de error, no mostrar notificaciones
      setNotifications([]);
      setIsVisible(false);
    }
  }, [dismissedNotifications]);

  const dismissNotification = (id: string) => {
    // Agregar a la lista de notificaciones cerradas
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(id);
    setDismissedNotifications(newDismissed);
    
    // Guardar en localStorage
    localStorage.setItem('dismissedNotifications', JSON.stringify([...newDismissed]));
    
    // Remover de las notificaciones actuales
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Si no hay más notificaciones, ocultar el banner
    if (notifications.length === 1) {
      setIsVisible(false);
    }
  };

  const viewNotification = (notification: Notification) => {
    // Retornar la URL para que el componente padre maneje la navegación
    return notification.actionUrl;
  };

  const viewOrder = (orderNumber: string) => {
    if (orderNumber === 'all') {
      return '/order-validation';
    } else {
      return `/order-validation?order=${orderNumber}`;
    }
  };

  const dismissAll = () => {
    // Marcar todas las notificaciones actuales como cerradas
    const allIds = notifications.map(n => n.id);
    const newDismissed = new Set([...dismissedNotifications, ...allIds]);
    setDismissedNotifications(newDismissed);
    
    // Guardar en localStorage
    localStorage.setItem('dismissedNotifications', JSON.stringify([...newDismissed]));
    
    setNotifications([]);
    setIsVisible(false);
  };

  const clearDismissedHistory = () => {
    setDismissedNotifications(new Set());
    localStorage.removeItem('dismissedNotifications');
  };

  // Calcular estadísticas para modo consolidado
  const getConsolidatedStats = () => {
    const urgentCount = notifications.filter(n => n.priority === 'urgent').length;
    const highCount = notifications.filter(n => n.priority === 'high').length;
    const mediumCount = notifications.filter(n => n.priority === 'medium').length;
    const lowCount = notifications.filter(n => n.priority === 'low').length;
    
    return {
      total: notifications.length,
      urgent: urgentCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount
    };
  };

  return {
    notifications,
    isVisible,
    dismissedNotifications,
    consolidatedMode,
    consolidatedStats: getConsolidatedStats(),
    dismissNotification,
    viewNotification,
    viewOrder,
    dismissAll,
    clearDismissedHistory
  };
}
