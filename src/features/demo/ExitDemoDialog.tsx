import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, Sparkles } from 'lucide-react';

interface ExitDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onContact?: () => void;
}

export const ExitDemoDialog: React.FC<ExitDemoDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onContact,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30">
            <Sparkles className="h-7 w-7 text-emerald-400" />
          </div>
          <DialogTitle className="text-center text-xl text-white">
            ¿Salir de la demo?
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-400 leading-relaxed pt-1">
            Estuviste explorando NOMADEV.IO con datos simulados. Si te gustó lo que viste,
            <span className="text-emerald-300"> conversemos </span>
            para llevarlo a tu negocio real.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-gray-800 bg-gray-800/40 p-3 mt-1">
          <ul className="space-y-1.5 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400 flex-shrink-0" />
              <span>Implementación en menos de 7 días.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400 flex-shrink-0" />
              <span>Onboarding 1‑a‑1 con tu equipo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400 flex-shrink-0" />
              <span>Sin compromiso: probás 14 días gratis.</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="mt-2 flex-col sm:flex-col gap-2">
          {onContact && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onContact();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Mail className="w-4 h-4 mr-2" />
              Quiero hablar con ustedes
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Seguir explorando
            </Button>
            <Button
              variant="outline"
              onClick={onConfirm}
              className="flex-1 border-gray-700 text-gray-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExitDemoDialog;
