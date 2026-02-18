// Configuración de APIs y servicios
export const API_CONFIG = {
  // Evolution API Configuration
  EVOLUTION_API: {
    baseUrl: 'https://evolutionapi-evolution-api.bivjyu.easypanel.host',
    apiKey: 'C78527301197-4F79-B0FB-6A46773EE5DC',
    instance: 'SKALETEST',
    endpoints: {
      sendMessage: '/message/sendText',
      getMessages: '/chat/findMessages',
      getContacts: '/chat/findContacts',
      getInstanceInfo: '/instance/connectionState',
      webhook: '/webhook/set'
    }
  },
  
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
export const getEvolutionHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': API_CONFIG.EVOLUTION_API.apiKey,
  'instance': API_CONFIG.EVOLUTION_API.instance
});

export const getN8NHeaders = () => ({
  'Content-Type': 'application/json'
});
