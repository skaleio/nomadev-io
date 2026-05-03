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
import { Mail, MessageSquare, Phone, Building2, User as UserIcon, Loader2, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

// Endpoint que recibe los formularios de contacto del demo.
// Se puede sobreescribir con VITE_DEMO_CONTACT_WEBHOOK_URL desde el .env.
const DEFAULT_WEBHOOK_URL = '';

const getWebhookUrl = (): string => {
  const fromEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_DEMO_CONTACT_WEBHOOK_URL;
  return (fromEnv && fromEnv.trim()) || DEFAULT_WEBHOOK_URL;
};

interface ContactDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContactFormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const INITIAL_FORM: ContactFormState = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  message: '',
};

export const ContactDemoDialog: React.FC<ContactDemoDialogProps> = ({ open, onOpenChange }) => {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(INITIAL_FORM);
    setSuccess(false);
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      // Reseteamos al cerrar para que la próxima vez abra limpio.
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

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      toast.error('No hay endpoint configurado', {
        description: 'Definí VITE_DEMO_CONTACT_WEBHOOK_URL en tu .env',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        source: 'demo-interactiva',
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
      toast.success('¡Recibimos tu mensaje!', {
        description: 'Te contactamos en menos de 24 horas hábiles.',
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
      <DialogContent className="max-w-lg bg-gray-900 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl">Contactar</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Dejanos tus datos y te respondemos en menos de 24h.
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
              <h3 className="text-lg font-semibold text-white">¡Listo, {form.fullName.split(' ')[0]}!</h3>
              <p className="text-gray-400 text-sm">
                Recibimos tu mensaje. Te escribimos pronto a <span className="text-emerald-300">{form.email}</span>.
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
                <Label htmlFor="fullName" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3" /> Nombre completo
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Pepe Pérez"
                  required
                  className="bg-gray-800/60 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="vos@empresa.cl"
                  required
                  className="bg-gray-800/60 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Teléfono
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+569 12345678"
                  className="bg-gray-800/60 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Empresa
                </Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  placeholder="Mi empresa SpA"
                  className="bg-gray-800/60 border-gray-700 text-white focus-visible:ring-emerald-500/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs text-gray-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Mensaje
              </Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Contanos qué necesitás resolver y cuándo te gustaría empezar."
                rows={4}
                className="bg-gray-800/60 border-gray-700 text-white focus-visible:ring-emerald-500/40 resize-none"
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

export default ContactDemoDialog;
