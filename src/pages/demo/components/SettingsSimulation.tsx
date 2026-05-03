import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings as SettingsIcon,
  ShoppingCart,
  MessageSquare,
  Bell,
  CreditCard,
  Shield,
  Users,
  Zap,
  CheckCircle,
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  badge?: string;
}

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  { id: 'shopify', name: 'Shopify', description: 'Sincronización de pedidos y productos', icon: ShoppingCart, connected: true, badge: 'Activo' },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Bot de validación y soporte', icon: MessageSquare, connected: true, badge: 'Activo' },
  { id: 'instagram', name: 'Instagram DM', description: 'Auto-respuestas en DMs', icon: MessageSquare, connected: true },
  { id: 'mercadopago', name: 'Mercado Pago', description: 'Cobros y validación de transacciones', icon: CreditCard, connected: true },
  { id: 'starken', name: 'Starken', description: 'Etiquetas y tracking automático', icon: Zap, connected: false },
  { id: 'klaviyo', name: 'Klaviyo', description: 'Email marketing automatizado', icon: Bell, connected: false },
];

export const SettingsSimulation: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [notifs, setNotifs] = useState({ orders: true, leads: true, validations: false, daily: true });

  const toggle = (id: string) => {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Vista de demostración
          </Badge>
        </div>
        <p className="text-gray-400">
          Conecta todas tus herramientas en un solo lugar. Los cambios aquí son ilustrativos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-gray-700 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Integraciones
            </CardTitle>
            <CardDescription className="text-gray-500 text-xs">
              Activa o desactiva conexiones con tus herramientas favoritas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {integrations.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-700/60 bg-gray-800/40"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700/60 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        {item.connected && (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-0 text-[10px] py-0 h-4">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Conectado
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 leading-snug">{item.description}</p>
                    </div>
                    <Switch checked={item.connected} onCheckedChange={() => toggle(item.id)} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'orders', label: 'Pedidos nuevos' },
                { key: 'leads', label: 'Leads calientes' },
                { key: 'validations', label: 'Validaciones rechazadas' },
                { key: 'daily', label: 'Resumen diario' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between">
                  <Label className="text-sm text-gray-300">{n.label}</Label>
                  <Switch
                    checked={notifs[n.key as keyof typeof notifs]}
                    onCheckedChange={(v) => setNotifs((s) => ({ ...s, [n.key]: v }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Tu equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Sergio Ruiz', role: 'Owner', initials: 'SR' },
                { name: 'María Luna', role: 'Admin', initials: 'ML' },
                { name: 'Pedro Castro', role: 'Operador', initials: 'PC' },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2 rounded-md bg-gray-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center">
                      {m.initials}
                    </div>
                    <div>
                      <p className="text-white text-sm leading-tight">{m.name}</p>
                      <p className="text-gray-500 text-[10px]">{m.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full border-gray-700 mt-2" disabled>
                + Invitar miembro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Marca y dominio
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Nombre de la tienda</Label>
            <Input defaultValue="Boutique Aurora" className="bg-gray-800/60 border-gray-700 text-white" disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Dominio</Label>
            <Input defaultValue="boutiqueaurora.cl" className="bg-gray-800/60 border-gray-700 text-white" disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Email de soporte</Label>
            <Input defaultValue="hola@boutiqueaurora.cl" className="bg-gray-800/60 border-gray-700 text-white" disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Plan</Label>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">Growth</Badge>
              <span className="text-xs text-gray-500">Renueva en 24 días</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSimulation;
