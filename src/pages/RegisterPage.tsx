import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import RippleGrid from '@/components/RippleGrid';

// Componente para mostrar requisitos de contraseña
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
    )}
    <span className={met ? 'text-emerald-300' : 'text-gray-400'}>{text}</span>
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
    } catch (error) {
      console.error('Error al registrarse:', error);
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
            className="text-emerald-300 hover:text-white hover:bg-emerald-500/20 transition-all duration-200 backdrop-blur-sm"
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
            <h1 
              className="text-5xl font-black text-emerald-400 hover:text-emerald-300 transition-all duration-300 cursor-pointer tracking-wider uppercase"
              style={{
                fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                fontWeight: 900,
                letterSpacing: '0.15em',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                transform: 'skew(-3deg)',
                display: 'inline-block',
                filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.8))',
                animation: 'glow 3s ease-in-out infinite alternate'
              }}
            >
              NOMADEV.IO
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Crear Cuenta
          </h2>
          <p className="text-gray-300 text-sm">
            Regístrate para comenzar a usar NOMADEV.IO
          </p>
        </div>

        <Card className="shadow-2xl border border-emerald-500/30 bg-gray-900/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-8">
            <CardDescription className="text-gray-300 text-base">
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
                  <Label htmlFor="firstName" className="text-emerald-200 font-medium text-sm">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre"
                    className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 focus:bg-gray-800 h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-emerald-200 font-medium text-sm">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Tu apellido"
                    className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 focus:bg-gray-800 h-12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-emerald-200 font-medium text-sm">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@ejemplo.com"
                  className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 focus:bg-gray-800 h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-emerald-200 font-medium text-sm">Contraseña</Label>
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
                    className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 focus:bg-gray-800 h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Requisitos de contraseña */}
                {(passwordFocused || formData.password.length > 0) && (
                  <div className="bg-gray-800/50 border border-emerald-500/20 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-300 mb-2">La contraseña debe contener:</p>
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
                <Label htmlFor="confirmPassword" className="text-emerald-200 font-medium text-sm">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Repite tu contraseña"
                    className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-emerald-400 focus:bg-gray-800 h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-4 h-12 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-xs text-amber-400 text-center">
                  Completa todos los requisitos de contraseña para continuar
                </p>
              )}
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-emerald-500/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-emerald-300 font-medium">O CONTINUAR CON</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 font-medium py-4 h-12 shadow-sm hover:shadow-md transition-all duration-200 text-base"
              onClick={() => {
                console.log('🖱️ Botón de Google clickeado');
                // Aquí iría la lógica de registro con Google
                alert('Funcionalidad de Google en desarrollo');
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
              <div className="flex items-center justify-center space-x-4 text-emerald-300 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Datos Seguros</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <span>Encriptado</span>
                </div>
              </div>
              
              <div className="border-t border-emerald-500/30 pt-4">
                <p className="text-sm text-emerald-200">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-emerald-300 hover:text-emerald-200 transition-colors duration-200"
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

