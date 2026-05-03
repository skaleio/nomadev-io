import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Headset,
  Mail,
  MessageSquare,
  Phone,
  Building2,
  User as UserIcon,
  Loader2,
  CheckCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { getLandingContactWebhookUrl } from '@/lib/landing-contact-webhook';

interface SupportContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const INITIAL: FormState = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  message: '',
};

export const SupportContactDialog: React.FC<SupportContactDialogProps> = ({ open, onOpenChange }) => {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(INITIAL);
    setSuccess(false);
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setTimeout(reset, 200);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    const webhookUrl = getLandingContactWebhookUrl();
    if (!webhookUrl) {
      toast.error('No hay endpoint configurado', {
        description: 'Definí VITE_LANDING_SUPPORT_WEBHOOK_URL o VITE_DEMO_CONTACT_WEBHOOK_URL en tu .env',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        source: 'landing-header-soporte',
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setSuccess(true);
      toast.success('¡Recibimos tu consulta!', {
        description: 'El equipo de soporte te contactará pronto.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('No pudimos enviar el formulario', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-gray-950 border border-emerald-500/25 shadow-2xl shadow-emerald-500/15">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center">
              <Headset className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl">Soporte</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Contanos tu duda o problema; te respondemos a la brevedad.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">¡Gracias, {form.fullName.split(' ')[0]}!</h3>
              <p className="text-gray-400 text-sm">
                Te escribiremos a <span className="text-emerald-300">{form.email}</span> cuando tengamos novedades.
              </p>
            </div>
            <Button
              onClick={() => handleClose(false)}
              variant="outline"
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="support-fullName" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3" /> Nombre completo
                </Label>
                <Input
                  id="support-fullName"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="bg-gray-900/80 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-email" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="vos@empresa.cl"
                  required
                  className="bg-gray-900/80 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-phone" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Teléfono
                </Label>
                <Input
                  id="support-phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="bg-gray-900/80 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-company" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Empresa
                </Label>
                <Input
                  id="support-company"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  placeholder="Opcional"
                  className="bg-gray-900/80 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="support-message" className="text-xs text-gray-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Mensaje
              </Label>
              <Textarea
                id="support-message"
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Describe tu consulta, error o lo que necesitás del producto."
                rows={4}
                className="bg-gray-900/80 border-gray-700 text-white focus-visible:ring-emerald-500/40 resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportContactDialog;
