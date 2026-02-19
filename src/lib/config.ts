// Configuración de APIs y servicios
export const API_CONFIG = {
  // N8N Webhook Configuration
  N8N_WEBHOOK: {
    url: 'https://n8n-n8n.bivjyu.easypanel.host/webhook-test/6db529ec-87eb-42cc-8b6b-bbd125c63d49',
    endpoints: {
      chatUpdate: '/webhook-test/6db529ec-87eb-42cc-8b6b-bbd125c63d49',
      leadUpdate: '/webhook-test/6db529ec-87eb-42cc-8b6b-bbd125c63d49',
      validationUpdate: '/webhook-test/6db529ec-87eb-42cc-8b6b-bbd125c63d49'
    }
  }
};

// Headers para las peticiones
export const getN8NHeaders = () => ({
  'Content-Type': 'application/json'
});
