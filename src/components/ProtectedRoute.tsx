import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('Usuario no autenticado, redirigiendo a login');
    console.log('Estado actual - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);
    // Redirigir al login con la ruta actual como state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('Usuario autenticado, mostrando contenido protegido');
  return <>{children}</>;
};

export default ProtectedRoute;

