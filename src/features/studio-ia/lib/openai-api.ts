// OpenAI API Integration para NOMADEV
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface CopywritingRequest {
  contentType: string;
  tone: string;
  targetAudience: string;
  productInfo: string;
  keywords?: string;
}

export interface CopywritingResponse {
  content: string;
  metadata: {
    contentType: string;
    tone: string;
    audience: string;
    wordCount: number;
    generatedAt: string;
  };
}

export class OpenAIService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async generateCopywriting(request: CopywritingRequest): Promise<CopywritingResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'Eres un experto copywriter especializado en ecommerce. Genera contenido persuasivo y optimizado para conversiones.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        content: content.trim(),
        metadata: {
          contentType: request.contentType,
          tone: request.tone,
          audience: request.targetAudience,
          wordCount: content.split(' ').length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error generating copywriting:', error);
      throw error;
    }
  }

  private buildPrompt(request: CopywritingRequest): string {
    const contentTypeMap = {
      'product-description': 'descripción de producto para catálogo',
      'email-marketing': 'email de marketing promocional',
      'ad-copy': 'anuncio publicitario para redes sociales',
      'social-media': 'post para redes sociales',
      'landing-page': 'contenido para landing page',
      'product-title': 'título optimizado para SEO',
    };

    const toneMap = {
      'professional': 'profesional y formal',
      'friendly': 'amigable y cercano',
      'persuasive': 'persuasivo y convincente',
      'urgent': 'urgente y con sensación de escasez',
      'luxury': 'elegante y de lujo',
      'casual': 'casual y relajado',
    };

    const audienceMap = {
      'general': 'público general',
      'young-adults': 'jóvenes adultos (18-35 años)',
      'professionals': 'profesionales y ejecutivos',
      'parents': 'padres de familia',
      'seniors': 'adultos mayores (50+ años)',
      'tech-savvy': 'personas amantes de la tecnología',
    };

    const contentType = contentTypeMap[request.contentType as keyof typeof contentTypeMap] || request.contentType;
    const tone = toneMap[request.tone as keyof typeof toneMap] || request.tone;
    const audience = audienceMap[request.targetAudience as keyof typeof audienceMap] || request.targetAudience;

    let prompt = `Genera una ${contentType} con las siguientes especificaciones:

**Información del producto:**
${request.productInfo}

**Tono:** ${tone}
**Audiencia objetivo:** ${audience}`;

    if (request.keywords) {
      prompt += `\n**Palabras clave a incluir:** ${request.keywords}`;
    }

    prompt += `\n\n**Instrucciones específicas:**
- El contenido debe ser persuasivo y orientado a conversiones
- Adapta el lenguaje al público objetivo
- Incluye beneficios claros del producto
- Mantén el tono especificado
- Optimiza para el canal de comunicación
- Máximo 200 palabras

**Formato de respuesta:**
Proporciona solo el contenido final, sin explicaciones adicionales.`;

    return prompt;
  }

  // Verificar si la API key es válida
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating OpenAI API key:', error);
      return false;
    }
  }
}

// Función helper para obtener la configuración de OpenAI desde el localStorage
export function getOpenAIConfig(): OpenAIConfig | null {
  try {
    const apiKey = localStorage.getItem('openai_api_key');
    const model = localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
    
    if (!apiKey) {
      return null;
    }

    return {
      apiKey,
      model,
    };
  } catch (error) {
    console.error('Error getting OpenAI config:', error);
    return null;
  }
}

// Función helper para guardar la configuración de OpenAI
export function saveOpenAIConfig(config: OpenAIConfig): void {
  try {
    localStorage.setItem('openai_api_key', config.apiKey);
    localStorage.setItem('openai_model', config.model);
  } catch (error) {
    console.error('Error saving OpenAI config:', error);
  }
}
