import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Store, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyConnectProps {
  onConnectionSuccess?: (shopDomain: string) => void;
  onConnectionError?: (error: string) => void;
}

export const ShopifyConnect: React.FC<ShopifyConnectProps> = ({
  onConnectionSuccess,
  onConnectionError
}) => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'connecting' | 'success' | 'error'>('input');

  const validateShopDomain = (domain: string): string | null => {
    if (!domain) {
      return 'Por favor ingresa el dominio de tu tienda';
    }

    // Remover espacios y convertir a minúsculas
    domain = domain.trim().toLowerCase();

    // Remover https:// o http:// si existe
    domain = domain.replace(/^https?:\/\//, '');

    // Remover .myshopify.com si existe
    domain = domain.replace(/\.myshopify\.com\/?$/, '');

    // Validar que solo contenga caracteres válidos
    if (!/^[a-z0-9-]+$/.test(domain)) {
      return 'El dominio solo puede contener letras, números y guiones';
    }

    // Validar longitud
    if (domain.length < 3 || domain.length > 60) {
      return 'El dominio debe tener entre 3 y 60 caracteres';
    }

    return null;
  };

  const initializeShopifyAuth = async () => {
    const validationError = validateShopDomain(shopDomain);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStep('connecting');

    try {
      const cleanDomain = shopDomain.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\.myshopify\.com\/?$/, '');

      // Llamar a la función Supabase para inicializar OAuth
      const { data, error: functionError } = await supabase.functions.invoke('shopify-oauth-init', {
        body: {
          shop: cleanDomain,
          scopes: [
            'read_products',
            'write_products',
            'read_orders',
            'write_orders',
            'read_customers',
            'write_customers',
            'read_inventory',
            'write_inventory',
            'read_analytics',
            'read_reports'
          ]
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Error iniciando autenticación OAuth');
      }

      if (!data?.success || !data?.authUrl) {
        throw new Error('No se recibió URL de autenticación válida');
      }

      console.log('Redirigiendo a Shopify OAuth:', data.authUrl);

      // Redirigir al usuario a la página de autorización de Shopify
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('Error iniciando OAuth:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      setStep('error');
      onConnectionError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initializeShopifyAuth();
  };

  const resetForm = () => {
    setShopDomain('');
    setError(null);
    setStep('input');
    setIsConnecting(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-black border border-gray-700/50 shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
          <Store className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold text-white mb-3">Conectar Tienda Shopify</CardTitle>
        <CardDescription className="text-gray-300 text-base">
          Conecta tu tienda Shopify para sincronizar productos, pedidos y métricas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 'input' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="shop-domain" className="text-sm font-semibold text-white">
                Dominio de tu tienda
              </label>
              <div className="relative">
                <Input
                  id="shop-domain"
                  type="text"
                  placeholder="mi-tienda"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="pr-32 bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 h-12 text-base"
                  disabled={isConnecting}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                  .myshopify.com
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Solo ingresa el nombre de tu tienda (sin .myshopify.com)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 h-12 text-base shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 transform hover:scale-105"
              disabled={isConnecting || !shopDomain.trim()}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-5 w-5" />
                  Conectar Tienda
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        )}

        {step === 'connecting' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-2">
              <h3 className="font-semibold">Redirigiendo a Shopify</h3>
              <p className="text-sm text-muted-foreground">
                Te estamos redirigiendo a Shopify para autorizar la conexión...
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">¡Conexión Exitosa!</h3>
              <p className="text-sm text-muted-foreground">
                Tu tienda se ha conectado correctamente
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={resetForm} variant="outline" className="w-full">
              Intentar de nuevo
            </Button>
          </div>
        )}

        <div className="text-center pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-400">
            Al conectar autorizas a NOMADEV a acceder a los datos de tu tienda según los permisos solicitados
          </p>
        </div>
      </CardContent>
    </Card>
  );
};