/**
 * POST de formularios en la landing (header soporte, CTA “Solicitar demo”, etc.).
 * Prioridad: webhook dedicado soporte → mismo endpoint que demo/contacto.
 */
export function getLandingContactWebhookUrl(): string {
  const landing = import.meta.env.VITE_LANDING_SUPPORT_WEBHOOK_URL?.trim();
  const fallback = import.meta.env.VITE_DEMO_CONTACT_WEBHOOK_URL?.trim();
  return landing || fallback || '';
}
