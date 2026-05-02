import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { useOnboardingRedirect } from '../hooks/useOnboardingRedirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import RippleGrid from '@/components/effects/RippleGrid';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();

  useAuthRedirect();
  useOnboardingRedirect();

  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsHeaderVisible(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isSubmitting) return;

    clearError();
    setIsSubmitting(true);
    try {
      await login(email, password);
      // La redirección la gestiona useAuthRedirect cuando el user quede en estado.
    } catch {
      // Error ya guardado en contexto; permanecemos en la página
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-auto">
      {/* RippleGrid Background - Fixed to cover the entire viewport */}
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

      {/* Back Button - Fixed position, always visible */}
      <div className="fixed top-6 left-6 z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Sticky Header - Only appears on scroll */}
      <header
        className={`fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border/40 shadow-sm transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-lg font-bold text-foreground">
            NOMADEV.IO
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>
      
      {/* Main content - Centered and scrollable */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-8">
            <span className="font-orbitron wordmark-glow text-5xl uppercase tracking-[0.15em] cursor-pointer">
              NOMADEV.IO
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-muted-foreground text-sm">
            Accede a tu cuenta de NOMADEV.IO
          </p>
        </div>

        <Card className="shadow-2xl border-border bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-8">
            <CardDescription className="text-muted-foreground text-base">
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-muted-foreground font-medium text-sm">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@ejemplo.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-muted-foreground font-medium text-sm">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-medium">O CONTINUAR CON</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 font-medium py-4 h-12 shadow-sm hover:shadow-md transition-all duration-200 text-base"
              disabled={isSubmitting}
              onClick={async () => {
                clearError();
                try {
                  await loginWithGoogle();
                } catch {
                  // Error ya mostrado en context
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>

            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center space-x-4 text-muted-foreground text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Sistema Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>SSL Encriptado</span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <p className="text-sm text-muted-foreground">
                  ¿No tienes una cuenta?{' '}
                  <Link
                    to={{ pathname: '/', hash: 'pricing' }}
                    className="font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

