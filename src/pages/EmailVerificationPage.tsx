import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ExternalLink, CheckCircle, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import RippleGrid from '@/components/RippleGrid';

export const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'tu correo';
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOpenEmail = () => {
    // Detectar proveedor de email y abrir el correspondiente
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (domain?.includes('gmail')) {
      window.open('https://mail.google.com', '_blank');
    } else if (domain?.includes('outlook') || domain?.includes('hotmail')) {
      window.open('https://outlook.live.com', '_blank');
    } else if (domain?.includes('yahoo')) {
      window.open('https://mail.yahoo.com', '_blank');
    } else {
      // Email genérico
      window.open(`https://mail.${domain}`, '_blank');
    }
  };

  const handleResendEmail = () => {
    // TODO: Implementar reenvío de email
    setCountdown(60);
    setCanResend(false);
  };

  return (
    <div className="relative min-h-screen overflow-auto">
      {/* RippleGrid Background */}
      <div className="fixed inset-0 z-0">
        <RippleGrid
          enableRainbow={false}
          gridColor="#10b981"
          rippleIntensity={0.08}
          gridSize={8}
          gridThickness={12}
          mouseInteraction={true}
          mouseInteractionRadius={1.5}
          opacity={0.6}
          glowIntensity={0.15}
          fadeDistance={1.3}
          vignetteStrength={1.8}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 bg-transparent">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-emerald-300 hover:text-white hover:bg-emerald-500/20 transition-all duration-200 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
        <Card className="w-full max-w-2xl shadow-2xl border border-emerald-500/30 bg-gray-900/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-12">
            {/* Email Icon with Animation */}
            <div className="mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto shadow-lg">
                <Mail className="h-10 w-10 text-white" />
              </div>
            </div>

            <CardTitle className="text-4xl font-bold text-white mb-3">
              ¡Revisa tu Correo! 📬
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Hemos enviado un enlace de verificación a:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-12">
            {/* Email Display */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-emerald-300 font-semibold text-lg text-center break-all">
                {email}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold text-center mb-4">
                Sigue estos pasos para continuar:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                    <span className="text-emerald-400 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-gray-200 font-medium">Revisa tu bandeja de entrada</p>
                    <p className="text-gray-400 text-sm">Busca un correo de NOMADEV</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                    <span className="text-emerald-400 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-gray-200 font-medium">Haz clic en el enlace de verificación</p>
                    <p className="text-gray-400 text-sm">El enlace es válido por 24 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                    <span className="text-emerald-400 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-gray-200 font-medium">¡Listo! Ya puedes iniciar sesión</p>
                    <p className="text-gray-400 text-sm">Serás redirigido automáticamente</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <h3 className="text-white font-semibold text-lg">Después de verificar</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Te guiaremos paso a paso para conectar tu tienda Shopify y comenzar a automatizar tus ventas con WhatsApp. 
                ¡En menos de 5 minutos estarás listo para enviar tu primer mensaje automatizado! 🚀
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleOpenEmail}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Abrir mi Correo
              </Button>

              <Button
                onClick={handleResendEmail}
                disabled={!canResend}
                variant="outline"
                className="w-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 py-6 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${!canResend ? '' : ''}`} />
                {canResend ? 'Reenviar Correo' : `Reenviar en ${countdown}s`}
              </Button>

              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-gray-800 py-6 text-base"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>

            {/* Help Section */}
            <div className="pt-6 border-t border-gray-700">
              <h4 className="text-gray-300 font-medium text-center mb-3">
                ¿No recibiste el correo?
              </h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Revisa tu carpeta de spam o correo no deseado</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Verifica que el correo sea correcto: <span className="text-emerald-400">{email}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Espera unos minutos, a veces puede tardar</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

