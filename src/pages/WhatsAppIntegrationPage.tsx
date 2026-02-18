import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '@/components/dashboard/NewDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  ExternalLink,
  Settings,
  Plus
} from 'lucide-react';

export default function WhatsAppIntegrationPage() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // Verificar estado de conexión (simulado por ahora)
  useEffect(() => {
    // TODO: Implementar verificación real de conexión con WhatsApp Business
    // Por ahora, simulamos que no hay conexión
    setIsConnected(false);
    setPhoneNumber(null);
  }, []);

  const handleConnectWhatsApp = () => {
    // Detectar si estamos en desarrollo y usar ngrok si está disponible
    const isDevelopment = import.meta.env.DEV;
    let origin;
    
    if (isDevelopment) {
      // En desarrollo, usar la URL de ngrok si está configurada
      const ngrokUrl = import.meta.env.VITE_NGROK_URL;
      if (ngrokUrl) {
        origin = ngrokUrl.replace(/\/$/, ''); // Remover trailing slash si existe
      } else {
        // Si no hay ngrok, forzar HTTPS del origen actual
        origin = window.location.origin.replace('http://', 'https://');
      }
    } else {
      // En producción, usar el origen actual forzando HTTPS
      origin = window.location.origin.replace('http://', 'https://');
    }
    
    const redirectUri = encodeURIComponent(`${origin}/whatsapp/callback`);
    const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || '2418200798594955';
    const scope = 'whatsapp_business_management,business_management,whatsapp_business_messaging';
    
    // URL de OAuth de Facebook para WhatsApp Business
    const facebookOAuthUrl = `https://www.facebook.com/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=whatsapp_connect&auth_type=rerequest`;
    
    // Abrir ventana emergente centrada
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      facebookOAuthUrl,
      'Conectar WhatsApp',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    // Monitorear cuando se cierre la ventana
    if (popup) {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // No recargar automáticamente para evitar deslogueo
          // El callback de WhatsApp manejará la actualización del estado
        }
      }, 500);
    }
  };

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Configuración del Agente</h1>
                <p className="text-gray-400 text-sm">Personaliza el comportamiento y la conexión de tu asistente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Conexión */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Estado de Conexión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isConnected && phoneNumber ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">WhatsApp Conectado</h4>
                      <p className="text-sm text-green-600 dark:text-green-400">Número: {phoneNumber}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <Wifi className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">No hay número vinculado</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Conecta tu número de WhatsApp Business para comenzar
                  </p>
                  <Button
                    onClick={handleConnectWhatsApp}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 shadow-lg hover:shadow-green-500/25 transition-all duration-200 transform hover:scale-105"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Conectar WhatsApp
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {!isConnected && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Configuración manual avanzada</strong>
                    <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                      Si prefieres configurar manualmente, puedes hacerlo desde la configuración avanzada.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integraciones CRM */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-500" />
              Integraciones CRM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Conecta con Zapier, Hubspot y API para automatizar tus procesos de venta.
            </p>
          </CardContent>
        </Card>
      </div>
    </NewDashboardLayout>
  );
}

