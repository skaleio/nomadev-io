import { API_CONFIG, getEvolutionHeaders } from './config';

// Tipos para Evolution API
export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName: string;
  messageType: string;
}

export interface EvolutionContact {
  id: string;
  name: string;
  pushName: string;
  profilePictureUrl?: string;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
}

export interface EvolutionInstanceInfo {
  instance: {
    instanceName: string;
    state: string;
    serverUrl: string;
    apikey: string;
    qrcode?: {
      code: string;
      base64: string;
    };
  };
}

export interface SendMessageRequest {
  number: string;
  text: string;
  options?: {
    delay?: number;
    presence?: string;
  };
}

// Servicio de Evolution API
export class EvolutionAPIService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.EVOLUTION_API.baseUrl;
    this.headers = getEvolutionHeaders();
  }

  // Obtener información de la instancia
  async getInstanceInfo(): Promise<EvolutionInstanceInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${API_CONFIG.EVOLUTION_API.instance}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting instance info:', error);
      throw error;
    }
  }

  // Enviar mensaje
  async sendMessage(request: SendMessageRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${API_CONFIG.EVOLUTION_API.instance}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          number: request.number,
          text: request.text,
          options: request.options || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Obtener mensajes de un chat
  async getMessages(chatId: string, limit: number = 50): Promise<EvolutionMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/findMessages/${API_CONFIG.EVOLUTION_API.instance}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          where: {
            key: {
              remoteJid: chatId
            }
          },
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Obtener contactos
  async getContacts(): Promise<EvolutionContact[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/findContacts/${API_CONFIG.EVOLUTION_API.instance}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  // Configurar webhook
  async setWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/set/${API_CONFIG.EVOLUTION_API.instance}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONTACTS_SET',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'PRESENCE_UPDATE',
            'CHATS_SET',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CHATS_DELETE',
            'GROUPS_UPSERT',
            'GROUP_UPDATE',
            'GROUP_PARTICIPANTS_UPDATE',
            'CONNECTION_UPDATE',
            'CALL',
            'NEW_JWT_TOKEN'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  }

  // Verificar estado de conexión
  async checkConnection(): Promise<boolean> {
    try {
      const info = await this.getInstanceInfo();
      return info.instance.state === 'open';
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }
}

// Instancia singleton
export const evolutionAPI = new EvolutionAPIService();
