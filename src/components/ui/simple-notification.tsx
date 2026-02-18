import React from 'react';
import { Bell, X, Eye } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface SimpleNotificationProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    count: number;
    actionUrl?: string;
    actionText?: string;
  }>;
  onDismiss: (id: string) => void;
  onViewAll: (id: string) => void;
  onDismissAll: () => void;
}

export function SimpleNotification({
  notifications,
  onDismiss,
  onViewAll,
  onDismissAll
}: SimpleNotificationProps) {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'border-red-500 bg-red-500/10',
      high: 'border-orange-500 bg-orange-500/10',
      medium: 'border-yellow-500 bg-yellow-500/10',
      low: 'border-green-500 bg-green-500/10'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0);

  return (
    <div className="w-80 bg-gray-900 rounded-xl shadow-xl border border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300">
            {notifications.length}
          </Badge>
        </div>
        <button
          onClick={onDismissAll}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="text-lg font-bold text-white">{totalCount.toLocaleString()}</div>
        <div className="text-xs text-gray-400">elementos requieren atención</div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{notification.title}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {notification.count}
                </Badge>
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-300 mb-3">
              {notification.message}
            </div>

            {notification.actionUrl && (
              <Button
                onClick={() => onViewAll(notification.id)}
                size="sm"
                className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-3 h-3 mr-1" />
                {notification.actionText || 'Ver'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
