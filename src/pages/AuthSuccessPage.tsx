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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/90 border-gray-700 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Error de Conexión</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">{error}</p>
            <Button 
              onClick={() => navigate('/shopify/connect')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Intentar Nuevamente
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/shopify')}
              className="w-full text-gray-400 hover:text-white"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/90 border-gray-700 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">¡Conexión Exitosa!</CardTitle>
          <p className="text-gray-300">
            Tu tienda <span className="text-green-400 font-semibold">{shop}</span> se ha conectado correctamente
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
          <p className="text-gray-300">
            Configurando tu dashboard... Serás redirigido automáticamente.
          </p>
          <div className="text-sm text-gray-400">
            Si no eres redirigido automáticamente, haz clic en el botón de abajo.
          </div>
          <Button 
            onClick={() => navigate('/shopify')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}