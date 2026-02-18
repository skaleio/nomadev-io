import { API_CONFIG, getN8NHeaders } from './config';

// Tipos para N8N Webhook
export interface N8NWebhookData {
  type: 'chat_update' | 'lead_update' | 'validation_update' | 'sale_update';
  data: any;
  timestamp: number;
  source: string;
}

export interface ChatUpdateData {
  chatId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  messageCount: number;
  status: 'active' | 'pending' | 'resolved';
  leadScore?: number;
  isHot?: boolean;
}

export interface LeadUpdateData {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  score: number;
  status: 'hot' | 'warm' | 'cold';
  value: number;
  product: string;
  notes: string;
  lastContact: string;
}

export interface ValidationUpdateData {
  validationId: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  details: string;
}

export interface SaleUpdateData {
  saleId: string;
  customerName: string;
  product: string;
  amount: number;
  status: 'completed' | 'processing' | 'shipped' | 'pending';
  timestamp: string;
  paymentMethod: string;
}

// Servicio de N8N Webhook
export class N8NWebhookService {
  private webhookUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.webhookUrl = API_CONFIG.N8N_WEBHOOK.url;
    this.headers = getN8NHeaders();
  }

  // Enviar actualización de chat
  async sendChatUpdate(data: ChatUpdateData): Promise<boolean> {
    try {
      const webhookData: N8NWebhookData = {
        type: 'chat_update',
        data,
        timestamp: Date.now(),
        source: 'evolution-api'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(webhookData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending chat update to N8N:', error);
      return false;
    }
  }

  // Enviar actualización de lead
  async sendLeadUpdate(data: LeadUpdateData): Promise<boolean> {
    try {
      const webhookData: N8NWebhookData = {
        type: 'lead_update',
        data,
        timestamp: Date.now(),
        source: 'evolution-api'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(webhookData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending lead update to N8N:', error);
      return false;
    }
  }

  // Enviar actualización de validación
  async sendValidationUpdate(data: ValidationUpdateData): Promise<boolean> {
    try {
      const webhookData: N8NWebhookData = {
        type: 'validation_update',
        data,
        timestamp: Date.now(),
        source: 'evolution-api'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(webhookData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending validation update to N8N:', error);
      return false;
    }
  }

  // Enviar actualización de venta
  async sendSaleUpdate(data: SaleUpdateData): Promise<boolean> {
    try {
      const webhookData: N8NWebhookData = {
        type: 'sale_update',
        data,
        timestamp: Date.now(),
        source: 'evolution-api'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(webhookData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending sale update to N8N:', error);
      return false;
    }
  }

  // Procesar webhook entrante (para cuando N8N envía datos de vuelta)
  async processIncomingWebhook(data: any): Promise<void> {
    try {
      console.log('Processing incoming webhook from N8N:', data);
      
      // Aquí puedes procesar los datos que N8N envía de vuelta
      // Por ejemplo, actualizar el estado de la aplicación
      
    } catch (error) {
      console.error('Error processing incoming webhook:', error);
    }
  }
}

// Instancia singleton
export const n8nWebhook = new N8NWebhookService();
