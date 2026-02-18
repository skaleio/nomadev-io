export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: string
          status: string
          config: Json
          ai_model: string | null
          ai_temperature: number | null
          ai_max_tokens: number | null
          ai_system_prompt: string | null
          ai_context: string | null
          personality: Json | null
          whatsapp_phone_id: string | null
          whatsapp_business_account_id: string | null
          whatsapp_access_token: string | null
          whatsapp_webhook_verify_token: string | null
          crm_enabled: boolean | null
          crm_config: Json | null
          workflow_id: string | null
          total_conversations: number | null
          total_messages: number | null
          success_rate: number | null
          avg_response_time: number | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
          last_active_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type?: string
          status?: string
          config?: Json
          ai_model?: string | null
          ai_temperature?: number | null
          ai_max_tokens?: number | null
          ai_system_prompt?: string | null
          ai_context?: string | null
          personality?: Json | null
          whatsapp_phone_id?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_access_token?: string | null
          whatsapp_webhook_verify_token?: string | null
          crm_enabled?: boolean | null
          crm_config?: Json | null
          workflow_id?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          success_rate?: number | null
          avg_response_time?: number | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          last_active_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: string
          status?: string
          config?: Json
          ai_model?: string | null
          ai_temperature?: number | null
          ai_max_tokens?: number | null
          ai_system_prompt?: string | null
          ai_context?: string | null
          personality?: Json | null
          whatsapp_phone_id?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_access_token?: string | null
          whatsapp_webhook_verify_token?: string | null
          crm_enabled?: boolean | null
          crm_config?: Json | null
          workflow_id?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          success_rate?: number | null
          avg_response_time?: number | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          last_active_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shops: {
        Row: {
          id: string
          shopify_shop_id: string
          shopify_domain: string
          shopify_access_token: string
          shopify_scope: string
          shop_name: string
          shop_email: string | null
          shop_phone: string | null
          is_active: boolean
          connected_at: string
          last_sync_at: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          shopify_shop_id: string
          shopify_domain: string
          shopify_access_token: string
          shopify_scope: string
          shop_name: string
          shop_email?: string | null
          shop_phone?: string | null
          is_active?: boolean
          connected_at?: string
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          shopify_shop_id?: string
          shopify_domain?: string
          shopify_access_token?: string
          shopify_scope?: string
          shop_name?: string
          shop_email?: string | null
          shop_phone?: string | null
          is_active?: boolean
          connected_at?: string
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      orders: {
        Row: {
          id: string
          shopify_order_id: string
          order_number: string
          customer_email: string | null
          customer_phone: string | null
          total_price: number
          currency: string
          status: Database["public"]["Enums"]["order_status"]
          fulfillment_status: string | null
          validation_status: Database["public"]["Enums"]["validation_status"]
          validation_data: Json | null
          created_at: string
          updated_at: string
          shop_id: string
          customer_id: string | null
        }
        Insert: {
          id?: string
          shopify_order_id: string
          order_number: string
          customer_email?: string | null
          customer_phone?: string | null
          total_price: number
          currency?: string
          status?: Database["public"]["Enums"]["order_status"]
          fulfillment_status?: string | null
          validation_status?: Database["public"]["Enums"]["validation_status"]
          validation_data?: Json | null
          created_at?: string
          updated_at?: string
          shop_id: string
          customer_id?: string | null
        }
        Update: {
          id?: string
          shopify_order_id?: string
          order_number?: string
          customer_email?: string | null
          customer_phone?: string | null
          total_price?: number
          currency?: string
          status?: Database["public"]["Enums"]["order_status"]
          fulfillment_status?: string | null
          validation_status?: Database["public"]["Enums"]["validation_status"]
          validation_data?: Json | null
          created_at?: string
          updated_at?: string
          shop_id?: string
          customer_id?: string | null
        }
      }
      products: {
        Row: {
          id: string
          shopify_product_id: string
          title: string
          handle: string
          description: string | null
          price: number
          currency: string
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          shop_id: string
        }
        Insert: {
          id?: string
          shopify_product_id: string
          title: string
          handle: string
          description?: string | null
          price: number
          currency?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          shop_id: string
        }
        Update: {
          id?: string
          shopify_product_id?: string
          title?: string
          handle?: string
          description?: string | null
          price?: number
          currency?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          shop_id?: string
        }
      }
      customers: {
        Row: {
          id: string
          shopify_customer_id: string
          email: string | null
          phone: string | null
          first_name: string | null
          last_name: string | null
          total_spent: number
          orders_count: number
          created_at: string
          updated_at: string
          shop_id: string
        }
        Insert: {
          id?: string
          shopify_customer_id: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          total_spent?: number
          orders_count?: number
          created_at?: string
          updated_at?: string
          shop_id: string
        }
        Update: {
          id?: string
          shopify_customer_id?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          total_spent?: number
          orders_count?: number
          created_at?: string
          updated_at?: string
          shop_id?: string
        }
      }
      conversations: {
        Row: {
          id: string
          phone_number: string
          status: Database["public"]["Enums"]["conversation_status"]
          last_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          user_id: string
          shop_id: string
          order_id: string | null
        }
        Insert: {
          id?: string
          phone_number: string
          status?: Database["public"]["Enums"]["conversation_status"]
          last_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          user_id: string
          shop_id: string
          order_id?: string | null
        }
        Update: {
          id?: string
          phone_number?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          last_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          user_id?: string
          shop_id?: string
          order_id?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          message_id: string
          content: string
          type: Database["public"]["Enums"]["message_type"]
          direction: Database["public"]["Enums"]["message_direction"]
          status: Database["public"]["Enums"]["message_status"]
          metadata: Json | null
          created_at: string
          conversation_id: string
        }
        Insert: {
          id?: string
          message_id: string
          content: string
          type?: Database["public"]["Enums"]["message_type"]
          direction: Database["public"]["Enums"]["message_direction"]
          status?: Database["public"]["Enums"]["message_status"]
          metadata?: Json | null
          created_at?: string
          conversation_id: string
        }
        Update: {
          id?: string
          message_id?: string
          content?: string
          type?: Database["public"]["Enums"]["message_type"]
          direction?: Database["public"]["Enums"]["message_direction"]
          status?: Database["public"]["Enums"]["message_status"]
          metadata?: Json | null
          created_at?: string
          conversation_id?: string
        }
      }
      refresh_tokens: {
        Row: {
          id: string
          token: string
          expires_at: string
          is_revoked: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          token: string
          expires_at: string
          is_revoked?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          token?: string
          expires_at?: string
          is_revoked?: boolean
          created_at?: string
          user_id?: string
        }
      }
      webhook_logs: {
        Row: {
          id: string
          source: string
          event: string
          payload: Json
          status: string
          error: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          source: string
          event: string
          payload: Json
          status: string
          error?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          source?: string
          event?: string
          payload?: Json
          status?: string
          error?: string | null
          created_at?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"
      validation_status: "PENDING" | "VALIDATED" | "REJECTED" | "EXPIRED"
      conversation_status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "BLOCKED"
      message_type: "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO" | "VIDEO" | "LOCATION" | "CONTACT"
      message_direction: "INBOUND" | "OUTBOUND"
      message_status: "SENT" | "DELIVERED" | "READ" | "FAILED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: {
        PENDING: "PENDING",
        PROCESSING: "PROCESSING", 
        SHIPPED: "SHIPPED",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
        REFUNDED: "REFUNDED"
      },
      validation_status: {
        PENDING: "PENDING",
        VALIDATED: "VALIDATED",
        REJECTED: "REJECTED", 
        EXPIRED: "EXPIRED"
      },
      conversation_status: {
        ACTIVE: "ACTIVE",
        PAUSED: "PAUSED",
        ARCHIVED: "ARCHIVED",
        BLOCKED: "BLOCKED"
      },
      message_type: {
        TEXT: "TEXT",
        IMAGE: "IMAGE",
        DOCUMENT: "DOCUMENT",
        AUDIO: "AUDIO",
        VIDEO: "VIDEO",
        LOCATION: "LOCATION",
        CONTACT: "CONTACT"
      },
      message_direction: {
        INBOUND: "INBOUND",
        OUTBOUND: "OUTBOUND"
      },
      message_status: {
        SENT: "SENT",
        DELIVERED: "DELIVERED",
        READ: "READ",
        FAILED: "FAILED"
      }
    },
  },
} as const
