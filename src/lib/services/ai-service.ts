/**
 * Servicio de Inteligencia Artificial
 * Maneja toda la lógica de generación de respuestas con IA
 */

import { Agent } from './agent-service';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens_used: number;
  confidence: number;
  finish_reason: string;
}

export interface ConversationContext {
  conversationId: string;
  contactName?: string;
  contactPhone?: string;
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  leadInfo?: {
    status?: string;
    score?: number;
    notes?: string;
  };
  customContext?: Record<string, any>;
}

class AIService {
  private readonly OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Generar respuesta de IA basada en el agente y el contexto
   */
  async generateResponse(
    agent: Agent,
    userMessage: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      // Construir el prompt del sistema
      const systemPrompt = this.buildSystemPrompt(agent, context);

      // Construir el historial de mensajes
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...this.buildMessageHistory(context),
        { role: 'user', content: userMessage }
      ];

      // Llamar a la API de OpenAI
      const response = await this.callOpenAI(messages, agent);

      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Error al generar respuesta de IA');
    }
  }

  /**
   * Construir el prompt del sistema basado en el agente
   */
  private buildSystemPrompt(agent: Agent, context: ConversationContext): string {
    let prompt = '';

    // Prompt base del agente
    if (agent.ai_system_prompt) {
      prompt += agent.ai_system_prompt + '\n\n';
    } else {
      prompt += `Eres ${agent.name}, un asistente de IA ${this.getAgentTypeDescription(agent.type)}.\n\n`;
    }

    // Agregar personalidad
    if (agent.personality) {
      prompt += `Tu personalidad:\n`;
      prompt += `- Tono: ${agent.personality.tone}\n`;
      prompt += `- Idioma: ${agent.personality.language}\n`;
      prompt += `- Estilo: ${agent.personality.style}\n\n`;
    }

    // Agregar contexto del agente
    if (agent.ai_context) {
      prompt += `Contexto adicional:\n${agent.ai_context}\n\n`;
    }

    // Agregar información del contacto
    if (context.contactName) {
      prompt += `Estás hablando con: ${context.contactName}\n`;
    }
    if (context.contactPhone) {
      prompt += `Teléfono del contacto: ${context.contactPhone}\n`;
    }

    // Agregar información del lead si existe
    if (context.leadInfo) {
      prompt += `\nInformación del lead:\n`;
      if (context.leadInfo.status) {
        prompt += `- Estado: ${context.leadInfo.status}\n`;
      }
      if (context.leadInfo.score) {
        prompt += `- Puntuación: ${context.leadInfo.score}/100\n`;
      }
      if (context.leadInfo.notes) {
        prompt += `- Notas: ${context.leadInfo.notes}\n`;
      }
    }

    // Agregar contexto personalizado
    if (context.customContext && Object.keys(context.customContext).length > 0) {
      prompt += `\nContexto adicional:\n${JSON.stringify(context.customContext, null, 2)}\n`;
    }

    // Instrucciones finales
    prompt += `\nInstrucciones importantes:\n`;
    prompt += `- Responde de manera natural y conversacional\n`;
    prompt += `- Mantén las respuestas concisas y relevantes\n`;
    prompt += `- Si no sabes algo, admítelo honestamente\n`;
    prompt += `- Sé empático y profesional\n`;
    
    if (agent.type === 'chatbot') {
      prompt += `- Tu objetivo es ayudar al usuario y responder sus preguntas\n`;
    } else if (agent.type === 'automation') {
      prompt += `- Tu objetivo es automatizar procesos y tareas\n`;
    }

    return prompt;
  }

  /**
   * Obtener descripción del tipo de agente
   */
  private getAgentTypeDescription(type: Agent['type']): string {
    const descriptions = {
      chatbot: 'diseñado para conversar y ayudar a los usuarios',
      automation: 'especializado en automatizar procesos y tareas',
      analytics: 'enfocado en analizar datos y proporcionar insights',
      integration: 'que conecta diferentes sistemas y servicios',
      custom: 'personalizado para necesidades específicas'
    };

    return descriptions[type] || 'versátil y adaptable';
  }

  /**
   * Construir historial de mensajes
   */
  private buildMessageHistory(context: ConversationContext): AIMessage[] {
    const messages: AIMessage[] = [];

    // Limitar el historial a los últimos 10 mensajes para no exceder tokens
    const recentMessages = context.previousMessages.slice(-10);

    for (const msg of recentMessages) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    return messages;
  }

  /**
   * Llamar a la API de OpenAI
   */
  private async callOpenAI(messages: AIMessage[], agent: Agent): Promise<AIResponse> {
    if (!this.OPENAI_API_KEY) {
      throw new Error('OpenAI API key no configurada');
    }

    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: agent.ai_model || 'gpt-4-turbo-preview',
        messages: messages,
        temperature: agent.ai_temperature ?? 0.7,
        max_tokens: agent.ai_max_tokens ?? 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`Error de OpenAI: ${error.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      model: data.model,
      tokens_used: data.usage.total_tokens,
      confidence: this.calculateConfidence(data.choices[0]),
      finish_reason: data.choices[0].finish_reason
    };
  }

  /**
   * Calcular confianza de la respuesta
   */
  private calculateConfidence(choice: any): number {
    // Por ahora, una estimación simple basada en el finish_reason
    if (choice.finish_reason === 'stop') {
      return 0.95;
    } else if (choice.finish_reason === 'length') {
      return 0.75;
    } else {
      return 0.60;
    }
  }

  /**
   * Analizar sentimiento del mensaje
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    emotions: string[];
  }> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `Eres un experto en análisis de sentimientos. Analiza el siguiente texto y responde SOLO con un JSON en este formato exacto:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": número entre -1 y 1,
  "emotions": ["emoción1", "emoción2"]
}`
        },
        {
          role: 'user',
          content: text
        }
      ];

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.3,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('Error al analizar sentimiento');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return result;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Retornar valor neutral por defecto
      return {
        sentiment: 'neutral',
        score: 0,
        emotions: []
      };
    }
  }

  /**
   * Extraer intención del mensaje
   */
  async extractIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: Array<{ type: string; value: string }>;
  }> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `Eres un experto en procesamiento de lenguaje natural. Analiza el siguiente mensaje y extrae la intención principal y las entidades relevantes. Responde SOLO con un JSON en este formato:
{
  "intent": "intención principal",
  "confidence": número entre 0 y 1,
  "entities": [{"type": "tipo", "value": "valor"}]
}`
        },
        {
          role: 'user',
          content: text
        }
      ];

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('Error al extraer intención');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return result;
    } catch (error) {
      console.error('Error extracting intent:', error);
      return {
        intent: 'unknown',
        confidence: 0,
        entities: []
      };
    }
  }

  /**
   * Generar resumen de conversación
   */
  async summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`)
        .join('\n');

      const aiMessages: AIMessage[] = [
        {
          role: 'system',
          content: 'Eres un experto en resumir conversaciones. Crea un resumen conciso y útil de la siguiente conversación, destacando los puntos clave y cualquier acción requerida.'
        },
        {
          role: 'user',
          content: `Resume esta conversación:\n\n${conversationText}`
        }
      ];

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: aiMessages,
          temperature: 0.5,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Error al generar resumen');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return 'No se pudo generar el resumen';
    }
  }

  /**
   * Clasificar lead automáticamente
   */
  async classifyLead(
    conversationMessages: Array<{ role: string; content: string }>,
    contactInfo: { name?: string; phone?: string; email?: string }
  ): Promise<{
    score: number;
    stage: string;
    reasoning: string;
  }> {
    try {
      const conversationText = conversationMessages
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`)
        .join('\n');

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `Eres un experto en calificación de leads. Analiza la conversación y la información del contacto para determinar:
1. Puntuación del lead (0-100)
2. Etapa del lead (new, contacted, qualified, proposal, negotiation, won, lost)
3. Razonamiento de tu evaluación

Responde SOLO con un JSON en este formato:
{
  "score": número entre 0 y 100,
  "stage": "etapa",
  "reasoning": "explicación breve"
}`
        },
        {
          role: 'user',
          content: `Información del contacto: ${JSON.stringify(contactInfo)}\n\nConversación:\n${conversationText}`
        }
      ];

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: messages,
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Error al clasificar lead');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return result;
    } catch (error) {
      console.error('Error classifying lead:', error);
      return {
        score: 50,
        stage: 'contacted',
        reasoning: 'Clasificación automática no disponible'
      };
    }
  }

  /**
   * Generar sugerencias de respuesta
   */
  async generateSuggestions(
    agent: Agent,
    context: ConversationContext,
    userMessage: string
  ): Promise<string[]> {
    try {
      const systemPrompt = this.buildSystemPrompt(agent, context);

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `${systemPrompt}\n\nGenera 3 sugerencias de respuesta diferentes para el siguiente mensaje. Responde SOLO con un array JSON de strings: ["sugerencia1", "sugerencia2", "sugerencia3"]`
        },
        ...this.buildMessageHistory(context),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: agent.ai_model || 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.8,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Error al generar sugerencias');
      }

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0].message.content);

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}

export const aiService = new AIService();

