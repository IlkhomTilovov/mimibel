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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_followed: boolean | null
          is_indexed: boolean | null
          meta_description_ru: string | null
          meta_description_uz: string | null
          meta_keywords: string | null
          meta_title_ru: string | null
          meta_title_uz: string | null
          name_ru: string
          name_uz: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_followed?: boolean | null
          is_indexed?: boolean | null
          meta_description_ru?: string | null
          meta_description_uz?: string | null
          meta_keywords?: string | null
          meta_title_ru?: string | null
          meta_title_uz?: string | null
          name_ru: string
          name_uz: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_followed?: boolean | null
          is_indexed?: boolean | null
          meta_description_ru?: string | null
          meta_description_uz?: string | null
          meta_keywords?: string | null
          meta_title_ru?: string | null
          meta_title_uz?: string | null
          name_ru?: string
          name_uz?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_field_options: {
        Row: {
          created_at: string
          field_id: string
          id: string
          is_active: boolean
          label_ru: string
          label_uz: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          is_active?: boolean
          label_ru: string
          label_uz: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          is_active?: boolean
          label_ru?: string
          label_uz?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_field_options_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "checkout_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_fields: {
        Row: {
          created_at: string
          field_type: string
          icon: string | null
          id: string
          is_active: boolean
          is_required: boolean
          label_ru: string
          label_uz: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          label_ru: string
          label_uz: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          label_ru?: string
          label_uz?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string | null
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_snapshot: number | null
          product_id: string
          product_name_snapshot: string
          quantity: number
          selected_options: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_snapshot?: number | null
          product_id: string
          product_name_snapshot: string
          quantity?: number
          selected_options?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_snapshot?: number | null
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          selected_options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          customer_id: string | null
          customer_message: string | null
          customer_name: string
          customer_phone: string
          deadline: string | null
          id: string
          order_number: string
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          customer_message?: string | null
          customer_name: string
          customer_phone: string
          deadline?: string | null
          id?: string
          order_number: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string | null
          customer_message?: string | null
          customer_name?: string
          customer_phone?: string
          deadline?: string | null
          id?: string
          order_number?: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          application: string[] | null
          category_id: string | null
          colors: string[] | null
          created_at: string
          description_ru: string | null
          description_uz: string | null
          full_description_ru: string | null
          full_description_uz: string | null
          fur_length: string[] | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          initial_stock: number
          is_active: boolean | null
          is_featured: boolean | null
          is_followed: boolean | null
          is_indexed: boolean | null
          is_negotiable: boolean | null
          keyword_variations: string[] | null
          materials: string[] | null
          meta_description_ru: string | null
          meta_description_uz: string | null
          meta_keywords: string | null
          meta_title_ru: string | null
          meta_title_uz: string | null
          name_ru: string
          name_uz: string
          original_price: number | null
          price: number | null
          sizes: string[] | null
          slug: string | null
          sort_order: number | null
          target_keyword: string | null
          updated_at: string
        }
        Insert: {
          application?: string[] | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_ru?: string | null
          description_uz?: string | null
          full_description_ru?: string | null
          full_description_uz?: string | null
          fur_length?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          initial_stock?: number
          is_active?: boolean | null
          is_featured?: boolean | null
          is_followed?: boolean | null
          is_indexed?: boolean | null
          is_negotiable?: boolean | null
          keyword_variations?: string[] | null
          materials?: string[] | null
          meta_description_ru?: string | null
          meta_description_uz?: string | null
          meta_keywords?: string | null
          meta_title_ru?: string | null
          meta_title_uz?: string | null
          name_ru: string
          name_uz: string
          original_price?: number | null
          price?: number | null
          sizes?: string[] | null
          slug?: string | null
          sort_order?: number | null
          target_keyword?: string | null
          updated_at?: string
        }
        Update: {
          application?: string[] | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_ru?: string | null
          description_uz?: string | null
          full_description_ru?: string | null
          full_description_uz?: string | null
          fur_length?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          initial_stock?: number
          is_active?: boolean | null
          is_featured?: boolean | null
          is_followed?: boolean | null
          is_indexed?: boolean | null
          is_negotiable?: boolean | null
          keyword_variations?: string[] | null
          materials?: string[] | null
          meta_description_ru?: string | null
          meta_description_uz?: string | null
          meta_keywords?: string | null
          meta_title_ru?: string | null
          meta_title_uz?: string | null
          name_ru?: string
          name_uz?: string
          original_price?: number | null
          price?: number | null
          sizes?: string[] | null
          slug?: string | null
          sort_order?: number | null
          target_keyword?: string | null
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
          email: string
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          key: string
          page: string | null
          section: string | null
          updated_at: string
          value_ru: string | null
          value_uz: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          key: string
          page?: string | null
          section?: string | null
          updated_at?: string
          value_ru?: string | null
          value_uz?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          key?: string
          page?: string | null
          section?: string | null
          updated_at?: string
          value_ru?: string | null
          value_uz?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          product_id: string
          quantity: number
          reason: string
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          product_id: string
          quantity: number
          reason: string
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          type?: Database["public"]["Enums"]["stock_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          address_ru: string | null
          address_uz: string | null
          contact_phone: string | null
          created_at: string
          default_language: string | null
          favicon_url: string | null
          id: string
          languages_enabled: string[] | null
          logo_url: string | null
          primary_domain: string | null
          seo_description: string | null
          seo_title: string | null
          short_description_ru: string | null
          short_description_uz: string | null
          site_name: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_telegram: string | null
          updated_at: string
          whatsapp_number: string | null
          working_hours_ru: string | null
          working_hours_uz: string | null
        }
        Insert: {
          address_ru?: string | null
          address_uz?: string | null
          contact_phone?: string | null
          created_at?: string
          default_language?: string | null
          favicon_url?: string | null
          id?: string
          languages_enabled?: string[] | null
          logo_url?: string | null
          primary_domain?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description_ru?: string | null
          short_description_uz?: string | null
          site_name?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          working_hours_ru?: string | null
          working_hours_uz?: string | null
        }
        Update: {
          address_ru?: string | null
          address_uz?: string | null
          contact_phone?: string | null
          created_at?: string
          default_language?: string | null
          favicon_url?: string | null
          id?: string
          languages_enabled?: string[] | null
          logo_url?: string | null
          primary_domain?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description_ru?: string | null
          short_description_uz?: string | null
          site_name?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          working_hours_ru?: string | null
          working_hours_uz?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          color_palette: Json
          component_styles: Json
          created_at: string
          id: string
          is_active: boolean
          is_dark: boolean
          layout_settings: Json
          name: string
          slug: string
          typography: Json
          updated_at: string
        }
        Insert: {
          color_palette?: Json
          component_styles?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_dark?: boolean
          layout_settings?: Json
          name: string
          slug: string
          typography?: Json
          updated_at?: string
        }
        Update: {
          color_palette?: Json
          component_styles?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_dark?: boolean
          layout_settings?: Json
          name?: string
          slug?: string
          typography?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_product_stock: { Args: { p_product_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "seller" | "manager"
      stock_movement_type: "in" | "out"
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
      app_role: ["admin", "editor", "seller", "manager"],
      stock_movement_type: ["in", "out"],
    },
  },
} as const
