import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ShoppingBag } from 'lucide-react';

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shop = searchParams.get('shop');
  const connected = searchParams.get('connected');

  useEffect(() => {
    const processConnection = async () => {
      try {
        // Verificar que tenemos los parámetros necesarios
        if (connected !== 'true' || !shop) {
          setError('Parámetros de conexión inválidos');
          setIsProcessing(false);
          return;
        }

        // Simular procesamiento de la conexión
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Redirigir al dashboard de Shopify
        navigate('/shopify', { 
          replace: true,
          state: { 
            connectionSuccess: true,
            shop: shop 
          }
        });
      } catch (err) {
        console.error('Error procesando conexión:', err);
        setError('Error al procesar la conexión');
        setIsProcessing(false);
      }
    };

    processConnection();
  }, [connected, shop, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-destructive-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Error de Conexión</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={() => navigate('/shopify/connect')}
              className="w-full"
            >
              Intentar Nuevamente
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/shopify')}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Volver al Dashboard
            </Button>
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
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">¡Conexión Exitosa!</CardTitle>
          <p className="text-muted-foreground">
            Tu tienda <span className="text-primary font-semibold">{shop}</span> se ha conectado correctamente
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">
            Configurando tu dashboard... Serás redirigido automáticamente.
          </p>
          <div className="text-sm text-muted-foreground">
            Si no eres redirigido automáticamente, haz clic en el botón de abajo.
          </div>
          <Button
            onClick={() => navigate('/shopify')}
            className="w-full"
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}