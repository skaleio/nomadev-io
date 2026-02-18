import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MessageSquare,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Settings,
  TrendingUp,
  FileText,
  Package,
  Bell,
  LogOut,
  User,
  Zap,
  Download,
  Upload,
  BarChart3,
  Home,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings' | 'theme';
  keywords: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [theme] = useState<'dark'>('dark');

  // Definir comandos
  const commands: Command[] = [
    // Navegación
    {
      id: 'nav-dashboard',
      title: 'Ir al Dashboard',
      subtitle: 'Ver métricas principales',
      icon: Home,
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'inicio', 'home', 'principal'],
    },
    {
      id: 'nav-chat',
      title: 'Abrir Chat en Vivo',
      subtitle: 'Gestionar conversaciones',
      icon: MessageSquare,
      action: () => navigate('/chat'),
      category: 'navigation',
      keywords: ['chat', 'whatsapp', 'conversaciones', 'mensajes'],
    },
    {
      id: 'nav-validation',
      title: 'Validación de Clientes',
      subtitle: 'Verificar clientes',
      icon: Shield,
      action: () => navigate('/validation'),
      category: 'navigation',
      keywords: ['validación', 'clientes', 'verificar', 'n8n'],
    },
    {
      id: 'nav-shopify',
      title: 'Shopify Analytics',
      subtitle: 'Ver métricas de tienda',
      icon: ShoppingCart,
      action: () => navigate('/shopify'),
      category: 'navigation',
      keywords: ['shopify', 'analytics', 'tienda', 'ventas'],
    },
    {
      id: 'nav-orders',
      title: 'Validación de Pedidos',
      subtitle: 'Gestionar pedidos',
      icon: Package,
      action: () => navigate('/orders'),
      category: 'navigation',
      keywords: ['pedidos', 'orders', 'validación'],
    },
    {
      id: 'nav-tracking',
      title: 'Seguimiento de Envíos',
      subtitle: 'Rastrear paquetes',
      icon: Truck,
      action: () => navigate('/tracking'),
      category: 'navigation',
      keywords: ['tracking', 'envíos', 'seguimiento', 'paquetes'],
    },
    {
      id: 'nav-leads',
      title: 'Gestor de Leads',
      subtitle: 'Administrar prospectos',
      icon: Users,
      action: () => navigate('/leads'),
      category: 'navigation',
      keywords: ['leads', 'prospectos', 'clientes potenciales'],
    },
    {
      id: 'nav-crm',
      title: 'CRM Pipeline',
      subtitle: 'Gestionar pipeline de ventas',
      icon: UserCheck,
      action: () => navigate('/crm'),
      category: 'navigation',
      keywords: ['crm', 'pipeline', 'ventas', 'oportunidades', 'prospectos'],
    },
    {
      id: 'nav-settings',
      title: 'Configuración',
      subtitle: 'Ajustes del sistema',
      icon: Settings,
      action: () => navigate('/settings'),
      category: 'navigation',
      keywords: ['configuración', 'settings', 'ajustes'],
    },
    {
      id: 'nav-profile',
      title: 'Mi Perfil',
      subtitle: 'Ver perfil de usuario',
      icon: User,
      action: () => navigate('/profile'),
      category: 'navigation',
      keywords: ['perfil', 'profile', 'usuario', 'cuenta'],
    },

    // Acciones rápidas
    {
      id: 'action-new-chat',
      title: 'Nuevo Chat',
      subtitle: 'Iniciar conversación',
      icon: MessageSquare,
      action: () => {
        navigate('/chat');
        // Aquí podrías agregar lógica para abrir un nuevo chat
      },
      category: 'actions',
      keywords: ['nuevo', 'chat', 'conversación', 'mensaje'],
    },
    {
      id: 'action-validate-client',
      title: 'Validar Cliente',
      subtitle: 'Verificar nuevo cliente',
      icon: Shield,
      action: () => {
        navigate('/validation');
      },
      category: 'actions',
      keywords: ['validar', 'cliente', 'verificar'],
    },
    {
      id: 'action-export-data',
      title: 'Exportar Datos',
      subtitle: 'Descargar reporte',
      icon: Download,
      action: () => {
        console.log('Exportando datos...');
        // Implementar exportación
      },
      category: 'actions',
      keywords: ['exportar', 'descargar', 'datos', 'reporte'],
    },
    {
      id: 'action-import-data',
      title: 'Importar Datos',
      subtitle: 'Cargar información',
      icon: Upload,
      action: () => {
        console.log('Importando datos...');
        // Implementar importación
      },
      category: 'actions',
      keywords: ['importar', 'cargar', 'datos', 'upload'],
    },
    {
      id: 'action-view-analytics',
      title: 'Ver Análisis',
      subtitle: 'Dashboard de métricas',
      icon: BarChart3,
      action: () => navigate('/shopify'),
      category: 'actions',
      keywords: ['análisis', 'analytics', 'métricas', 'estadísticas'],
    },
    {
      id: 'action-notifications',
      title: 'Ver Notificaciones',
      subtitle: 'Centro de notificaciones',
      icon: Bell,
      action: () => {
        // Simular click en el botón de notificaciones
        const notificationButton = document.querySelector('[title="Notificaciones"]') as HTMLElement;
        if (notificationButton) {
          notificationButton.click();
        }
      },
      category: 'actions',
      keywords: ['notificaciones', 'alertas', 'avisos', 'bell', 'campana'],
    },

    // Configuración
    {
      id: 'settings-logout',
      title: 'Cerrar Sesión',
      subtitle: 'Salir de la cuenta',
      icon: LogOut,
      action: () => {
        logout();
        navigate('/login');
      },
      category: 'settings',
      keywords: ['cerrar', 'salir', 'logout', 'desconectar'],
    },
  ];

  // Filtrar comandos según búsqueda
  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.subtitle?.toLowerCase().includes(searchLower) ||
      command.keywords.some((keyword) => keyword.includes(searchLower))
    );
  });

  // Agrupar comandos por categoría
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryLabels = {
    navigation: 'Navegación',
    actions: 'Acciones Rápidas',
    settings: 'Configuración',
  };

  // Manejar navegación con teclado
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onOpenChange(false);
          setSearch('');
        }
      }
    },
    [filteredCommands, selectedIndex, onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // Reset index cuando cambia la búsqueda
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comandos, páginas o acciones..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <ScrollArea className="max-h-[400px]">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No se encontraron resultados</p>
              <p className="text-sm mt-1">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                  <div>
                    {cmds.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = command.icon;

                      return (
                        <button
                          key={command.id}
                          onClick={() => {
                            command.action();
                            onOpenChange(false);
                            setSearch('');
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {command.title}
                            </p>
                            {command.subtitle && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {command.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                ↓
              </kbd>
              <span className="ml-1">navegar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                ↵
              </kbd>
              <span className="ml-1">seleccionar</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{filteredCommands.length} comandos</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar el command palette
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}

