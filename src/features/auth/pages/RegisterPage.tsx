import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import RippleGrid from '@/components/effects/RippleGrid';

// Componente para mostrar requisitos de contraseña
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    )}
    <span className={met ? 'text-success' : 'text-muted-foreground'}>{text}</span>
  </div>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  // Hook para manejar redirección automática
  useAuthRedirect();

  // Validación de requisitos de contraseña
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    // Validar requisitos de contraseña
    if (!isPasswordValid) {
      alert('La contraseña no cumple con todos los requisitos');
      setIsLoading(false);
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      // Redirigir a la página de verificación de email
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch {
      // El error ya se setea en AuthContext.error y se muestra en el Alert
    } finally {
      setIsLoading(false);
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

      {/* Header - Fixed and always visible */}
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 bg-transparent">
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
            Crear Cuenta
          </h2>
          <p className="text-muted-foreground text-sm">
            Regístrate para comenzar a usar NOMADEV.IO
          </p>
        </div>

        <Card className="shadow-2xl border-border bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-8">
            <CardDescription className="text-muted-foreground text-base">
              Completa el formulario para crear tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-muted-foreground font-medium text-sm">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre"
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-muted-foreground font-medium text-sm">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Tu apellido"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-muted-foreground font-medium text-sm">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@ejemplo.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-muted-foreground font-medium text-sm">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    placeholder="Crea una contraseña segura"
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Requisitos de contraseña */}
                {(passwordFocused || formData.password.length > 0) && (
                  <div className="bg-muted/50 border border-border/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">La contraseña debe contener:</p>
                    <div className="grid grid-cols-1 gap-2">
                      <PasswordRequirement
                        met={passwordRequirements.minLength}
                        text="Mínimo 8 caracteres"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasUpperCase}
                        text="Una letra mayúscula (A-Z)"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasLowerCase}
                        text="Una letra minúscula (a-z)"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasNumber}
                        text="Un número (0-9)"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasSpecialChar}
                        text="Un carácter especial (!@#$%...)"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-muted-foreground font-medium text-sm">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Repite tu contraseña"
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base"
                disabled={isLoading || !isPasswordValid || formData.password !== formData.confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>

              {formData.password.length > 0 && !isPasswordValid && (
                <p className="text-xs text-warning text-center">
                  Completa todos los requisitos de contraseña para continuar
                </p>
              )}
            </form>

            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center space-x-4 text-muted-foreground text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Datos Seguros</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Encriptado</span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <p className="text-sm text-muted-foreground">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                  >
                    Inicia sesión aquí
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

export default RegisterPage;

