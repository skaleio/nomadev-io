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
  const { login, error, clearError } = useAuth();
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
                    to="/pricing"
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

