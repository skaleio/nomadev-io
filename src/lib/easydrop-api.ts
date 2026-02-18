/**
 * 🚀 EasyDrop API Integration Service
 * 
 * Servicio para integrar NOMADEV con EasyDrop para automatización de envíos
 * 
 * @author NOMADEV Team
 * @version 1.0.0
 */

export interface EasyDropConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface ShipmentData {
  // Datos del remitente
  sender: {
    name: string;
    company?: string;
    address: string;
    city: string;
    region: string;
    postalCode: string;
    phone: string;
    email?: string;
  };
  
  // Datos del destinatario
  recipient: {
    name: string;
    address: string;
    city: string;
    region: string;
    postalCode: string;
    phone: string;
    email?: string;
  };
  
  // Datos del paquete
  package: {
    weight: number; // en kg
    length: number; // en cm
    width: number;  // en cm
    height: number; // en cm
    description: string;
    value?: number; // valor declarado
  };
  
  // Datos del envío
  service: {
    type: 'standard' | 'express' | 'overnight';
    insurance?: boolean;
    signature?: boolean;
  };
  
  // Referencias
  references: {
    orderNumber: string;
    customerId?: string;
    notes?: string;
  };
}

export interface ShipmentResponse {
  success: boolean;
  trackingNumber: string;
  labelUrl?: string;
  estimatedDelivery?: string;
  cost?: number;
  error?: string;
}

export interface TrackingResponse {
  success: boolean;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  currentLocation?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  error?: string;
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

export class EasyDropAPI {
  private config: EasyDropConfig;
  private baseUrl: string;

  constructor(config: EasyDropConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? config.baseUrl 
      : config.baseUrl.replace('api', 'sandbox-api');
  }

  /**
   * 🔐 Verificar conexión con EasyDrop API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/verify`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        return { success: true, message: 'Conexión exitosa con EasyDrop' };
      } else {
        const error = await response.text();
        return { success: false, message: `Error de conexión: ${error}` };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      };
    }
  }

  /**
   * 📦 Crear guía de envío
   */
  async createShipment(shipmentData: ShipmentData): Promise<ShipmentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/shipments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.formatShipmentData(shipmentData)),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          trackingNumber: data.tracking_number,
          labelUrl: data.label_url,
          estimatedDelivery: data.estimated_delivery,
          cost: data.cost,
        };
      } else {
        return {
          success: false,
          trackingNumber: '',
          error: data.message || 'Error creando envío',
        };
      }
    } catch (error) {
      return {
        success: false,
        trackingNumber: '',
        error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  /**
   * 🔍 Obtener estado de seguimiento
   */
  async getTrackingStatus(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tracking/${trackingNumber}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          trackingNumber: data.tracking_number,
          status: this.mapStatus(data.status),
          currentLocation: data.current_location,
          estimatedDelivery: data.estimated_delivery,
          actualDelivery: data.actual_delivery,
          events: data.events || [],
        };
      } else {
        return {
          success: false,
          trackingNumber,
          status: 'pending',
          events: [],
          error: data.message || 'Error obteniendo seguimiento',
        };
      }
    } catch (error) {
      return {
        success: false,
        trackingNumber,
        status: 'pending',
        events: [],
        error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  /**
   * 📋 Obtener lista de envíos
   */
  async getShipments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ success: boolean; shipments: any[]; total: number; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.dateFrom) queryParams.append('date_from', params.dateFrom);
      if (params?.dateTo) queryParams.append('date_to', params.dateTo);

      const response = await fetch(`${this.baseUrl}/api/v1/shipments?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          shipments: data.shipments || [],
          total: data.total || 0,
        };
      } else {
        return {
          success: false,
          shipments: [],
          total: 0,
          error: data.message || 'Error obteniendo envíos',
        };
      }
    } catch (error) {
      return {
        success: false,
        shipments: [],
        total: 0,
        error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  /**
   * 🔧 Obtener headers de autenticación
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Secret': this.config.apiSecret,
      'User-Agent': 'NOMADEV-EasyDrop-Integration/1.0.0',
    };
  }

  /**
   * 📝 Formatear datos de envío para EasyDrop
   */
  private formatShipmentData(data: ShipmentData): any {
    return {
      sender: {
        name: data.sender.name,
        company: data.sender.company,
        address: data.sender.address,
        city: data.sender.city,
        region: data.sender.region,
        postal_code: data.sender.postalCode,
        phone: data.sender.phone,
        email: data.sender.email,
      },
      recipient: {
        name: data.recipient.name,
        address: data.recipient.address,
        city: data.recipient.city,
        region: data.recipient.region,
        postal_code: data.recipient.postalCode,
        phone: data.recipient.phone,
        email: data.recipient.email,
      },
      package: {
        weight: data.package.weight,
        dimensions: {
          length: data.package.length,
          width: data.package.width,
          height: data.package.height,
        },
        description: data.package.description,
        declared_value: data.package.value,
      },
      service: {
        type: data.service.type,
        insurance: data.service.insurance,
        signature_required: data.service.signature,
      },
      references: {
        order_number: data.references.orderNumber,
        customer_id: data.references.customerId,
        notes: data.references.notes,
      },
    };
  }

  /**
   * 🗺️ Mapear estados de EasyDrop a estados internos
   */
  private mapStatus(easydropStatus: string): 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned' {
    const statusMap: Record<string, 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'> = {
      'pending': 'pending',
      'processing': 'pending',
      'picked_up': 'in_transit',
      'in_transit': 'in_transit',
      'out_for_delivery': 'in_transit',
      'delivered': 'delivered',
      'failed': 'failed',
      'returned': 'returned',
      'exception': 'failed',
    };

    return statusMap[easydropStatus.toLowerCase()] || 'pending';
  }
}

/**
 * 🏭 Factory function para crear instancia de EasyDrop API
 */
export function createEasyDropAPI(config: EasyDropConfig): EasyDropAPI {
  return new EasyDropAPI(config);
}

/**
 * 🔄 Helper para convertir datos de Shopify a formato EasyDrop
 */
export function convertShopifyOrderToEasyDrop(
  shopifyOrder: any,
  shopData: any
): ShipmentData {
  const shippingAddress = shopifyOrder.shipping_address || shopifyOrder.billing_address;
  
  return {
    sender: {
      name: shopData.name || 'Tienda',
      company: shopData.company,
      address: shopData.address || 'Dirección de la tienda',
      city: shopData.city || 'Santiago',
      region: shopData.region || 'Metropolitana',
      postalCode: shopData.postal_code || '0000000',
      phone: shopData.phone || '+56900000000',
      email: shopData.email,
    },
    recipient: {
      name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
      address: shippingAddress.address1,
      city: shippingAddress.city,
      region: shippingAddress.province,
      postalCode: shippingAddress.zip,
      phone: shippingAddress.phone,
      email: shopifyOrder.email,
    },
    package: {
      weight: calculateOrderWeight(shopifyOrder.line_items),
      length: 30, // Valores por defecto, se pueden calcular mejor
      width: 20,
      height: 10,
      description: generatePackageDescription(shopifyOrder.line_items),
      value: parseFloat(shopifyOrder.total_price),
    },
    service: {
      type: 'standard',
      insurance: parseFloat(shopifyOrder.total_price) > 50000, // Seguro si > $50k CLP
      signature: true,
    },
    references: {
      orderNumber: shopifyOrder.order_number?.toString() || shopifyOrder.id.toString(),
      customerId: shopifyOrder.customer?.id?.toString(),
      notes: shopifyOrder.note || `Pedido de ${shopifyOrder.customer?.first_name} ${shopifyOrder.customer?.last_name}`,
    },
  };
}

/**
 * ⚖️ Calcular peso total del pedido
 */
function calculateOrderWeight(lineItems: any[]): number {
  // Peso promedio por producto (se puede mejorar con datos reales)
  const averageWeightPerItem = 0.5; // kg
  const totalItems = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  return totalItems * averageWeightPerItem;
}

/**
 * 📝 Generar descripción del paquete
 */
function generatePackageDescription(lineItems: any[]): string {
  const items = lineItems.slice(0, 3).map(item => item.name).join(', ');
  const moreItems = lineItems.length > 3 ? ` y ${lineItems.length - 3} productos más` : '';
  return `Pedido: ${items}${moreItems}`;
}