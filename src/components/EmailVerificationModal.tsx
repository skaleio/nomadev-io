import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, ExternalLink, CheckCircle, Sparkles } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const EmailVerificationModal = ({ isOpen, onClose, email }: EmailVerificationModalProps) => {
  const handleOpenGmail = () => {
    // Abrir Gmail en una nueva pestaña
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
            <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white">
            ¡Verifica tu correo!
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            Hemos enviado un enlace de verificación a:
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
            <p className="text-emerald-400 font-medium text-sm">{email}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Revisa tu bandeja de entrada</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Haz clic en el enlace de verificación</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>¡Listo! Inicia sesión para comenzar</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Después de verificar:</p>
            </div>
            <p className="text-xs text-gray-300">
              Te guiaremos paso a paso para conectar tu tienda Shopify y comenzar a automatizar tus ventas.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleOpenGmail}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Gmail
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cerrar
            </Button>
          </div>

          <p className="text-xs text-gray-400 pt-2">
            ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
            <button 
              onClick={() => window.location.reload()} 
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              intenta registrarte de nuevo
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
