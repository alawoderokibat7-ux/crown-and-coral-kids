export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id: string
          label: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          label?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          new_stock: number
          performed_by: string | null
          previous_stock: number
          quantity_change: number
          reason: string
          reference_order_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_stock: number
          performed_by?: string | null
          previous_stock: number
          quantity_change: number
          reason: string
          reference_order_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_stock?: number
          performed_by?: string | null
          previous_stock?: number
          quantity_change?: number
          reason?: string
          reference_order_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          size: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          size: string
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string
          client_tier: string
          courier_partner: string | null
          created_at: string
          customer_name: string
          delivery_address: string
          delivery_fee: number
          email: string | null
          fulfillment_status: string
          gift_wrapping: string
          id: string
          order_notes: string | null
          payment_gateway: string | null
          payment_method: string
          payment_reference: string | null
          payment_status: string
          phone: string
          subtotal: number
          total: number
          updated_at: string
          waybill_number: string | null
        }
        Insert: {
          city: string
          client_tier?: string
          courier_partner?: string | null
          created_at?: string
          customer_name: string
          delivery_address: string
          delivery_fee?: number
          email?: string | null
          fulfillment_status?: string
          gift_wrapping?: string
          id: string
          order_notes?: string | null
          payment_gateway?: string | null
          payment_method: string
          payment_reference?: string | null
          payment_status?: string
          phone: string
          subtotal: number
          total: number
          updated_at?: string
          waybill_number?: string | null
        }
        Update: {
          city?: string
          client_tier?: string
          courier_partner?: string | null
          created_at?: string
          customer_name?: string
          delivery_address?: string
          delivery_fee?: number
          email?: string | null
          fulfillment_status?: string
          gift_wrapping?: string
          id?: string
          order_notes?: string | null
          payment_gateway?: string | null
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          phone?: string
          subtotal?: number
          total?: number
          updated_at?: string
          waybill_number?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          channel: string
          created_at: string
          currency: string
          gateway_response: Json | null
          id: string
          order_id: string
          reference: string
          status: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          channel: string
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          order_id: string
          reference: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string
          reference?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          product_id: string
          size: string
          sku: string | null
          stock_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          size: string
          sku?: string | null
          stock_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          size?: string
          sku?: string | null
          stock_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          age_max: number
          age_min: number
          age_range: string
          care_instructions: Json | null
          category_id: string | null
          created_at: string
          description: string | null
          fabric_details: string | null
          gender: string
          id: string
          in_stock: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          name: string
          original_price: number | null
          price: number
          tagline: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          age_max: number
          age_min: number
          age_range: string
          care_instructions?: Json | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fabric_details?: string | null
          gender: string
          id: string
          in_stock?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          name: string
          original_price?: number | null
          price: number
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          age_max?: number
          age_min?: number
          age_range?: string
          care_instructions?: Json | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fabric_details?: string | null
          gender?: string
          id?: string
          in_stock?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          name?: string
          original_price?: number | null
          price?: number
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          announcement: string | null
          brand_name: string
          created_at: string
          currency_symbol: string
          id: string
          tagline: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          announcement?: string | null
          brand_name?: string
          created_at?: string
          currency_symbol?: string
          id?: string
          tagline?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          announcement?: string | null
          brand_name?: string
          created_at?: string
          currency_symbol?: string
          id?: string
          tagline?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_name: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_name: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_name?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          customer_name: string
          email: string | null
          id: string
          message: string
          order_id: string | null
          phone: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          customer_name: string
          email?: string | null
          id: string
          message: string
          order_id?: string | null
          phone: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_name?: string
          email?: string | null
          id?: string
          message?: string
          order_id?: string | null
          phone?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
