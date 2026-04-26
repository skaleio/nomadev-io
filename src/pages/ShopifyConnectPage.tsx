import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';

export default function ShopifyConnectPage() {
  const [shopDomain, setShopDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Manejar callback de OAuth
  useEffect(() => {
    const connected = searchParams.get('connected');
    const shop = searchParams.get('shop');
    
    if (connected === 'true' && shop) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/shopify');
      }, 2000);
    }
  }, [searchParams, navigate]);

  const handleConnectShopify = async () => {
    if (!shopDomain.trim()) {
      setError('Por favor ingresa el dominio de tu tienda');
      return;
    }

    // Limpiar el dominio (remover .myshopify.com si está incluido)
    const cleanDomain = shopDomain.replace('.myshopify.com', '').trim();
    
    setLoading(true);
    setError(null);

    try {
      // Llamar a la Edge Function para iniciar OAuth
      const { data, error } = await supabase.functions.invoke('shopify-oauth-start', {
        body: { 
          shop: cleanDomain,
          user_id: user?.id 
        }
      });

      if (error) {
        console.error('Error de Edge Function:', error);
        throw error;
      }

      console.log('Respuesta de Edge Function:', data);

      if (data?.auth_url) {
        // Redirigir a Shopify OAuth
        console.log('Redirigiendo a:', data.auth_url);
        window.location.href = data.auth_url;
      } else {
        throw new Error('No se recibió la URL de autorización');
      }
    } catch (err) {
      console.error('Error iniciando OAuth:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con Shopify');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">¡Conexión Exitosa!</h2>
              <p className="text-muted-foreground mb-4">
                Tu tienda se ha conectado correctamente. Redirigiendo al dashboard...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Conectar Tienda Shopify</CardTitle>
          <p className="text-muted-foreground">
            Conecta tu tienda Shopify para sincronizar productos, pedidos y métricas
          </p>
          <div className="text-left text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="font-medium text-foreground mb-2">Pasos:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Ingresa el dominio de tu tienda (ej: mi-tienda).</li>
              <li>Haz clic en &quot;Conectar Tienda&quot;.</li>
              <li>Serás redirigido a Shopify para autorizar el acceso.</li>
              <li>Inicia sesión en Shopify si te lo pide y acepta los permisos.</li>
              <li>Volverás a Nomadev y tu tienda quedará conectada.</li>
            </ol>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="shop-domain" className="text-foreground font-medium">Dominio de tu tienda</Label>
            <div className="flex gap-2">
              <Input
                id="shop-domain"
                placeholder="mi-tienda"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                disabled={loading}
              />
              <span className="flex items-center text-muted-foreground">.myshopify.com</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo ingresa el nombre de tu tienda (sin .myshopify.com)
            </p>
          </div>

          <Button
            onClick={handleConnectShopify}
            disabled={loading || !shopDomain.trim()}
            className="w-full font-semibold py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 mr-2" />
                Conectar Tienda
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/shopify')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Volver al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}