import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

/**
 * Página de chat WhatsApp.
 * Próximamente se usará la API oficial de Meta (WhatsApp Business API).
 */
export const WhatsAppChatPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            Chat WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Próximamente esta sección usará la <strong>API oficial de Meta</strong> (WhatsApp Business API) para gestionar conversaciones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
