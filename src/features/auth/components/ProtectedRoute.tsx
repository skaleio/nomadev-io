import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { disableDemoMode, isDemoMode } from '@/lib/demoMode';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Si el usuario está autenticado de verdad, limpiamos el flag de demo
  // para que el sidebar y rutas vuelvan a su comportamiento normal.
  useEffect(() => {
    if (isAuthenticated && user) {
      disableDemoMode();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Si el usuario llegó desde el demo, lo dejamos navegar por las
    // herramientas reales en modo lectura (sin datos) en lugar de
    // mandarlo al login. El sidebar se encargará de mapear los links
    // a sus rutas /*-demo cuando exista una.
    if (isDemoMode()) {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
