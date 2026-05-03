import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ExternalLink, CheckCircle, Sparkles, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import RippleGrid from '@/components/effects/RippleGrid';

export const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'tu correo';
  const { resendVerificationEmail } = useAuth();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendOk, setResendOk] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOpenEmail = () => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain?.includes('gmail')) {
      window.open('https://mail.google.com', '_blank');
    } else if (domain?.includes('outlook') || domain?.includes('hotmail')) {
      window.open('https://outlook.live.com', '_blank');
    } else if (domain?.includes('yahoo')) {
      window.open('https://mail.yahoo.com', '_blank');
    } else {
      window.open(`https://mail.${domain}`, '_blank');
    }
  };

  const handleResendEmail = async () => {
    if (!canResend || resending) return;
    if (!email || email === 'tu correo') {
      setResendError('No tenemos tu email. Volvé a /register y completá el formulario.');
      return;
    }
    setResending(true);
    setResendError(null);
    setResendOk(false);
    try {
      await resendVerificationEmail(email);
      setResendOk(true);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'No pudimos reenviar el correo.');
    } finally {
      setResending(false);
    }
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
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
        <Card className="w-full max-w-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-12">
            <div className="mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary mx-auto shadow-lg">
                <Mail className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>

            <CardTitle className="text-4xl font-bold text-foreground mb-3">
              Revisa tu Correo
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Hemos enviado un enlace de verificación a:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-12">
            {/* Email Display */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-primary font-semibold text-lg text-center break-all">
                {email}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4 bg-muted/50 rounded-lg p-6 border border-border">
              <h3 className="text-foreground font-semibold text-center mb-4">
                Sigue estos pasos para continuar:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                    <span className="text-primary font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Revisa tu bandeja de entrada</p>
                    <p className="text-muted-foreground text-sm">Busca un correo de NOMADEV</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                    <span className="text-primary font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Haz clic en el enlace de verificación</p>
                    <p className="text-muted-foreground text-sm">El enlace es válido por 24 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                    <span className="text-primary font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Ya puedes iniciar sesión</p>
                    <p className="text-muted-foreground text-sm">Serás redirigido automáticamente</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
                <h3 className="text-foreground font-semibold text-lg">Después de verificar</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Te guiaremos paso a paso para conectar tu tienda Shopify y comenzar a automatizar tus ventas con WhatsApp.
                En menos de 5 minutos estarás listo para enviar tu primer mensaje automatizado.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleOpenEmail}
                className="w-full font-semibold py-6 text-lg"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Abrir mi Correo
              </Button>

              <Button
                onClick={handleResendEmail}
                disabled={!canResend || resending}
                variant="outline"
                className="w-full py-6 text-base"
              >
                {resending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {resending
                  ? 'Reenviando...'
                  : canResend
                  ? 'Reenviar Correo'
                  : `Reenviar en ${countdown}s`}
              </Button>

              {resendOk && (
                <Alert>
                  <AlertDescription>
                    Te reenviamos el correo. Revisá tu bandeja de entrada y spam.
                  </AlertDescription>
                </Alert>
              )}
              {resendError && (
                <Alert variant="destructive">
                  <AlertDescription>{resendError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground py-6 text-base"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>

            {/* Help Section */}
            <div className="pt-6 border-t border-border">
              <h4 className="text-muted-foreground font-medium text-center mb-3">
                ¿No recibiste el correo?
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Revisa tu carpeta de spam o correo no deseado</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Verifica que el correo sea correcto: <span className="text-primary">{email}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
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

