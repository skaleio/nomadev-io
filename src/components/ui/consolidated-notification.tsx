import React, { useState } from 'react';
import { AlertTriangle, Bell, Clock, Package, X, Eye, CheckCircle2, Shield, MessageCircle, ShoppingBag, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  count: number;
  items: any[];
  actionUrl?: string;
  actionText?: string;
  icon?: string;
}

interface ConsolidatedNotificationProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onViewAll: (id: string) => void;
  onDismissAll: () => void;
}

export function ConsolidatedNotification({
  notifications,
  onDismiss,
  onViewAll,
  onDismissAll
}: ConsolidatedNotificationProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Validar que las notificaciones existan y tengan la estructura correcta
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  const getIcon = (iconName?: string) => {
    const icons = {
      Shield: <Shield className="w-4 h-4" />,
      AlertTriangle: <AlertTriangle className="w-4 h-4" />,
      MessageCircle: <MessageCircle className="w-4 h-4" />,
      ShoppingBag: <ShoppingBag className="w-4 h-4" />,
      Download: <Download className="w-4 h-4" />,
      Package: <Package className="w-4 h-4" />
    };
    return icons[iconName as keyof typeof icons] || <Bell className="w-4 h-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
      high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      low: 'text-green-400 bg-green-500/10 border-green-500/20'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const totalNotifications = notifications.length;
  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0);

  return (
    <div className="w-96 bg-gray-900 backdrop-blur-sm rounded-2xl shadow-xl animate-slide-in-up border border-gray-700">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/40">
              {totalNotifications}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDismissAll}
              className="text-gray-400 hover:text-white transition-colors text-xs"
            >
              Cerrar Todas
            </button>
            <button
              onClick={onDismissAll}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="text-lg font-bold text-white mb-1">{totalCount.toLocaleString()}</div>
          <div className="text-xs text-gray-400">elementos requieren atención</div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.filter(notification => notification && notification.id).map((notification) => {
            const isExpanded = expandedItems.has(notification.id);
            const priorityColor = getPriorityColor(notification.priority || 'medium');
            
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all ${priorityColor}`}
              >
                {/* Notification Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(notification.icon)}
                    <span className="text-sm font-medium text-white">{notification.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {notification.count}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {notification.items.length > 0 && (
                      <button
                        onClick={() => toggleExpanded(notification.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => onDismiss(notification.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Notification Message */}
                <div className="text-xs text-gray-300 mb-3">
                  {notification.message}
                </div>

                {/* Expanded Items */}
                {isExpanded && notification.items && Array.isArray(notification.items) && notification.items.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {notification.items.slice(0, 5).map((item, index) => (
                      <div key={index} className="p-2 bg-gray-800/30 rounded border border-gray-700">
                        <div className="text-xs text-gray-300">
                          {item?.number && <span className="font-mono">{item.number}</span>}
                          {item?.customer && <span className="ml-2">{item.customer}</span>}
                          {item?.amount && <span className="ml-2 text-green-400">${item.amount}</span>}
                          {item?.lastMessage && <div className="mt-1 text-gray-400 truncate">{item.lastMessage}</div>}
                        </div>
                      </div>
                    ))}
                    {notification.items.length > 5 && (
                      <div className="text-xs text-gray-400 text-center">
                        ... y {notification.items.length - 5} más
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {notification.actionUrl && (
                  <Button
                    onClick={() => onViewAll(notification.id)}
                    size="sm"
                    className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {notification.actionText || 'Ver Todos'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Global Actions */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <Button
            onClick={() => onViewAll('all')}
            size="sm"
            className="w-full h-8 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver Todas las Notificaciones
          </Button>
        </div>
      </div>
    </div>
  );
}
