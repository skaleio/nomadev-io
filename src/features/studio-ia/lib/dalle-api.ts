// DALL-E API Integration para NOMADEV
export interface DalleConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style: string;
  background: string;
  lighting: string;
  referenceImage?: File;
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: 'standard' | 'hd';
  n?: number; // número de imágenes a generar
}

export interface ImageGenerationResponse {
  images: Array<{
    url: string;
    revised_prompt?: string;
  }>;
  metadata: {
    prompt: string;
    style: string;
    background: string;
    lighting: string;
    hasReference: boolean;
    generatedAt: string;
  };
}

export class DalleService {
  private config: DalleConfig;

  constructor(config: DalleConfig) {
    this.config = config;
  }

  async generateImages(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // Construir prompt mejorado
      const enhancedPrompt = this.buildEnhancedPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: request.n || 4,
          size: request.size || '1024x1024',
          quality: request.quality || 'standard',
          style: 'natural', // o 'vivid' para más creativo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DALL-E API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      return {
        images: data.data.map((img: any) => ({
          url: img.url,
          revised_prompt: img.revised_prompt
        })),
        metadata: {
          prompt: request.prompt,
          style: request.style,
          background: request.background,
          lighting: request.lighting,
          hasReference: !!request.referenceImage,
          generatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Error generating images:', error);
      throw error;
    }
  }

  private buildEnhancedPrompt(request: ImageGenerationRequest): string {
    const { prompt, style, background, lighting } = request;
    
    // Mapear estilos a descripciones más específicas
    const styleMap = {
      'professional': 'professional product photography, clean and corporate style',
      'minimalist': 'minimalist design, simple and elegant, clean composition',
      'luxury': 'luxury and premium aesthetic, high-end product photography',
      'casual': 'casual and friendly style, relaxed atmosphere',
      'vintage': 'vintage and retro style, nostalgic aesthetic',
      'modern': 'modern and contemporary design, sleek and futuristic'
    };

    // Mapear fondos
    const backgroundMap = {
      'white': 'white background, clean and minimal',
      'transparent': 'transparent background, isolated product',
      'gradient': 'gradient background, smooth color transition',
      'texture': 'textured background, subtle pattern',
      'lifestyle': 'lifestyle setting, realistic environment'
    };

    // Mapear iluminación
    const lightingMap = {
      'studio': 'professional studio lighting, even and bright',
      'natural': 'natural lighting, soft and organic',
      'dramatic': 'dramatic lighting, high contrast and shadows',
      'soft': 'soft lighting, gentle and diffused'
    };

    const styleDesc = styleMap[style as keyof typeof styleMap] || style;
    const backgroundDesc = backgroundMap[background as keyof typeof backgroundMap] || background;
    const lightingDesc = lightingMap[lighting as keyof typeof lightingMap] || lighting;

    // Construir prompt final
    let finalPrompt = `Create a high-quality product image of: ${prompt}. `;
    finalPrompt += `Style: ${styleDesc}. `;
    finalPrompt += `Background: ${backgroundDesc}. `;
    finalPrompt += `Lighting: ${lightingDesc}. `;
    
    // Agregar instrucciones específicas para productos
    finalPrompt += `The image should be: high resolution, detailed, commercial quality, suitable for e-commerce, well-lit, professional product photography. `;
    
    // Si hay imagen de referencia, mencionarlo
    if (request.referenceImage) {
      finalPrompt += `Use the reference image as inspiration for the product design and style. `;
    }

    // Limitar longitud del prompt (DALL-E tiene límites)
    if (finalPrompt.length > 1000) {
      finalPrompt = finalPrompt.substring(0, 997) + '...';
    }

    return finalPrompt;
  }

  // Verificar si la API key es válida para DALL-E
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      // Verificar si DALL-E está disponible
      return data.data.some((model: any) => model.id.includes('dall-e'));
    } catch (error) {
      console.error('Error validating DALL-E API key:', error);
      return false;
    }
  }
}

// Función helper para obtener la configuración de DALL-E desde el localStorage
export function getDalleConfig(): DalleConfig | null {
  try {
    const apiKey = localStorage.getItem('openai_api_key');
    const model = localStorage.getItem('openai_model') || 'dall-e-3';
    
    if (!apiKey) {
      return null;
    }

    return {
      apiKey,
      model,
    };
  } catch (error) {
    console.error('Error getting DALL-E config:', error);
    return null;
  }
}
