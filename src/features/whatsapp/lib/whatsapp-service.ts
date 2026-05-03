/**
 * Servicio de WhatsApp Business API
 * Maneja toda la integración con WhatsApp Business
 */

import { Agent } from './agent-service';
import { conversationService } from './conversation-service';

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'template';
  text?: {
    body: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
  audio?: {
    link: string;
  };
  video?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename?: string;
    caption?: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          audio?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          video?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          document?: {
            id: string;
            mime_type: string;
            sha256: string;
            filename: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

class WhatsAppService {
  private readonly WHATSAPP_API_VERSION = 'v18.0';
  private readonly WHATSAPP_API_URL = `https://graph.facebook.com/${this.WHATSAPP_API_VERSION}`;

  /**
   * Enviar mensaje de texto
   */
  async sendTextMessage(
    agent: Agent,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!agent.whatsapp_phone_id || !agent.whatsapp_access_token) {
      return {
        success: false,
        error: 'WhatsApp no está configurado para este agente'
      };
    }

    try {
      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${agent.whatsapp_phone_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agent.whatsapp_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Error al enviar mensaje'
        };
      }

      return {
        success: true,
        messageId: data.messages[0].id
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: 'Error de conexión con WhatsApp'
      };
    }
  }

  /**
   * Enviar imagen
   */
  async sendImage(
    agent: Agent,
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!agent.whatsapp_phone_id || !agent.whatsapp_access_token) {
      return {
        success: false,
        error: 'WhatsApp no está configurado para este agente'
      };
    }

    try {
      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${agent.whatsapp_phone_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agent.whatsapp_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Error al enviar imagen'
        };
      }

      return {
        success: true,
        messageId: data.messages[0].id
      };
    } catch (error) {
      console.error('Error sending WhatsApp image:', error);
      return {
        success: false,
        error: 'Error de conexión con WhatsApp'
      };
    }
  }

  /**
   * Procesar webhook de WhatsApp
   */
  async processWebhook(
    payload: WhatsAppWebhookPayload,
    agent: Agent,
    userId: string
  ): Promise<void> {
    try {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') {
            continue;
          }

          const value = change.value;

          // Procesar mensajes entrantes
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              await this.processIncomingMessage(message, value, agent, userId);
            }
          }

          // Procesar actualizaciones de estado
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await this.processStatusUpdate(status);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  /**
   * Procesar mensaje entrante
   */
  private async processIncomingMessage(
    message: any,
    value: any,
    agent: Agent,
    userId: string
  ): Promise<void> {
    try {
      const from = message.from;
      const messageId = message.id;
      
      // Obtener nombre del contacto
      const contactName = value.contacts?.[0]?.profile?.name || 'Usuario';

      // Obtener o crear conversación
      const conversation = await conversationService.getOrCreateConversationByWhatsApp(
        userId,
        agent.id,
        from, // Usar el número como ID de conversación
        from,
        contactName
      );

      // Extraer contenido del mensaje
      let messageContent = '';
      let messageType: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text';

      if (message.type === 'text' && message.text) {
        messageContent = message.text.body;
        messageType = 'text';
      } else if (message.type === 'image') {
        messageContent = '[Imagen]';
        messageType = 'image';
      } else if (message.type === 'audio') {
        messageContent = '[Audio]';
        messageType = 'audio';
      } else if (message.type === 'video') {
        messageContent = '[Video]';
        messageType = 'video';
      } else if (message.type === 'document') {
        messageContent = `[Documento: ${message.document?.filename || 'archivo'}]`;
        messageType = 'document';
      }

      // Procesar mensaje y generar respuesta con IA
      const result = await conversationService.processIncomingMessage(
        conversation.id,
        messageContent,
        {
          phone: from,
          name: contactName
        }
      );

      // Si se generó una respuesta con IA, enviarla por WhatsApp
      if (result.aiResponse) {
        const sendResult = await this.sendTextMessage(
          agent,
          from,
          result.aiResponse.content
        );

        // Actualizar el mensaje con el ID de WhatsApp si se envió correctamente
        if (sendResult.success && sendResult.messageId) {
          // TODO: Actualizar el mensaje en la base de datos con el whatsapp_message_id
        }
      }
    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error);
    }
  }

  /**
   * Procesar actualización de estado
   */
  private async processStatusUpdate(status: any): Promise<void> {
    try {
      await conversationService.updateWhatsAppMessageStatus(
        status.id,
        status.status
      );
    } catch (error) {
      console.error('Error processing WhatsApp status update:', error);
    }
  }

  /**
   * Verificar webhook (para configuración inicial)
   */
  verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ): { verified: boolean; challenge?: string } {
    if (mode === 'subscribe' && token === verifyToken) {
      return {
        verified: true,
        challenge: challenge
      };
    }

    return {
      verified: false
    };
  }

  /**
   * Obtener información del número de teléfono
   */
  async getPhoneNumberInfo(
    phoneNumberId: string,
    accessToken: string
  ): Promise<{
    verified_name: string;
    display_phone_number: string;
    quality_rating: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting phone number info:', error);
      return null;
    }
  }

  /**
   * Registrar número de teléfono
   */
  async registerPhoneNumber(
    phoneNumberId: string,
    accessToken: string,
    pin: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${phoneNumberId}/register`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            pin: pin
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Error al registrar número'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error registering phone number:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  /**
   * Obtener plantillas de mensajes
   */
  async getMessageTemplates(
    businessAccountId: string,
    accessToken: string
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting message templates:', error);
      return [];
    }
  }

  /**
   * Enviar plantilla de mensaje
   */
  async sendTemplate(
    agent: Agent,
    to: string,
    templateName: string,
    languageCode: string = 'es',
    components?: any[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!agent.whatsapp_phone_id || !agent.whatsapp_access_token) {
      return {
        success: false,
        error: 'WhatsApp no está configurado para este agente'
      };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components || []
        }
      };

      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${agent.whatsapp_phone_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agent.whatsapp_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Error al enviar plantilla'
        };
      }

      return {
        success: true,
        messageId: data.messages[0].id
      };
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      return {
        success: false,
        error: 'Error de conexión con WhatsApp'
      };
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(
    agent: Agent,
    messageId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!agent.whatsapp_phone_id || !agent.whatsapp_access_token) {
      return {
        success: false,
        error: 'WhatsApp no está configurado para este agente'
      };
    }

    try {
      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${agent.whatsapp_phone_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agent.whatsapp_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
          })
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: 'Error al marcar mensaje como leído'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }
}

export const whatsappService = new WhatsAppService();

