export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clothing: {
        Row: {
          anchor_x: number
          anchor_y: number
          category: string
          color: string
          color_hex: string
          created_at: string
          id: string
          image_naked: string | null
          image_original: string | null
          material: string
          name: string
          scale_x: number
          scale_y: number
          status: string
          style: string
          subcategory: string
          temp_max: number
          temp_min: number
          thickness: string
          updated_at: string
          user_id: string
          waterproof: boolean
        }
        Insert: {
          anchor_x?: number
          anchor_y?: number
          category: string
          color?: string
          color_hex?: string
          created_at?: string
          id?: string
          image_naked?: string | null
          image_original?: string | null
          material?: string
          name: string
          scale_x?: number
          scale_y?: number
          status?: string
          style: string
          subcategory?: string
          temp_max?: number
          temp_min?: number
          thickness: string
          updated_at?: string
          user_id: string
          waterproof?: boolean
        }
        Update: {
          anchor_x?: number
          anchor_y?: number
          category?: string
          color?: string
          color_hex?: string
          created_at?: string
          id?: string
          image_naked?: string | null
          image_original?: string | null
          material?: string
          name?: string
          scale_x?: number
          scale_y?: number
          status?: string
          style?: string
          subcategory?: string
          temp_max?: number
          temp_min?: number
          thickness?: string
          updated_at?: string
          user_id?: string
          waterproof?: boolean
        }
        Relationships: []
      }
      compliments: {
        Row: {
          id: string
          is_fallback: boolean
          personality_tags: string[]
          tags: string[]
          text: string
        }
        Insert: {
          id?: string
          is_fallback?: boolean
          personality_tags?: string[]
          tags?: string[]
          text: string
        }
        Update: {
          id?: string
          is_fallback?: boolean
          personality_tags?: string[]
          tags?: string[]
          text?: string
        }
        Relationships: []
      }
      diary: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          outfit_id: string | null
          rating: number
          user_id: string
          weather_info: Json | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          outfit_id?: string | null
          rating?: number
          user_id: string
          weather_info?: Json | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          outfit_id?: string | null
          rating?: number
          user_id?: string
          weather_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit"
            referencedColumns: ["id"]
          },
        ]
      }
      image_queue: {
        Row: {
          clothing_id: string
          error_message: string | null
          id: string
          last_heartbeat: string | null
          original_url: string
          retry_count: number
          status: string
          user_id: string
        }
        Insert: {
          clothing_id: string
          error_message?: string | null
          id?: string
          last_heartbeat?: string | null
          original_url: string
          retry_count?: number
          status?: string
          user_id: string
        }
        Update: {
          clothing_id?: string
          error_message?: string | null
          id?: string
          last_heartbeat?: string | null
          original_url?: string
          retry_count?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_queue_clothing_id_fkey"
            columns: ["clothing_id"]
            isOneToOne: false
            referencedRelation: "clothing"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          is_recommended: boolean
          name: string
          style: string | null
          updated_at: string
          user_id: string
          weather_condition: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_recommended?: boolean
          name?: string
          style?: string | null
          updated_at?: string
          user_id: string
          weather_condition?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_recommended?: boolean
          name?: string
          style?: string | null
          updated_at?: string
          user_id?: string
          weather_condition?: Json | null
        }
        Relationships: []
      }
      outfit_item: {
        Row: {
          clothing_id: string
          id: string
          layer_order: number
          outfit_id: string
          slot: string
        }
        Insert: {
          clothing_id: string
          id?: string
          layer_order?: number
          outfit_id: string
          slot: string
        }
        Update: {
          clothing_id?: string
          id?: string
          layer_order?: number
          outfit_id?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_item_clothing_id_fkey"
            columns: ["clothing_id"]
            isOneToOne: false
            referencedRelation: "clothing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_item_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          commute: string
          fav_category_counts: Json
          fav_clothing_ids: string[]
          fav_color_counts: Json
          fav_patterns: Json
          fav_style_counts: Json
          onboarding_done: boolean
          personality: string
          phone: string | null
          style_prefs: string[]
          user_id: string
        }
        Insert: {
          commute?: string
          fav_category_counts?: Json
          fav_clothing_ids?: string[]
          fav_color_counts?: Json
          fav_patterns?: Json
          fav_style_counts?: Json
          onboarding_done?: boolean
          personality?: string
          phone?: string | null
          style_prefs?: string[]
          user_id: string
        }
        Update: {
          commute?: string
          fav_category_counts?: Json
          fav_clothing_ids?: string[]
          fav_color_counts?: Json
          fav_patterns?: Json
          fav_style_counts?: Json
          onboarding_done?: boolean
          personality?: string
          phone?: string | null
          style_prefs?: string[]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      lookup_email_by_phone: { Args: { search_phone: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

