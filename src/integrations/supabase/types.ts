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
      locked_deals: {
        Row: {
          amount: number
          asset: string
          asset_symbol: string
          created_at: string
          currency: string
          expires_at: string
          id: string
          offer_id: string
          payment_method: string
          price: number
          seller_username: string
          status: Database["public"]["Enums"]["deal_status"]
          type: Database["public"]["Enums"]["offer_type"]
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          asset_symbol: string
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          offer_id: string
          payment_method: string
          price: number
          seller_username: string
          status?: Database["public"]["Enums"]["deal_status"]
          type: Database["public"]["Enums"]["offer_type"]
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          asset_symbol?: string
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          offer_id?: string
          payment_method?: string
          price?: number
          seller_username?: string
          status?: Database["public"]["Enums"]["deal_status"]
          type?: Database["public"]["Enums"]["offer_type"]
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          asset: string
          clicks_count: number
          created_at: string
          currency: string
          id: string
          locks_count: number
          max_limit: number
          min_limit: number
          payment_methods: string[]
          price: number
          remaining_amount: number
          status: Database["public"]["Enums"]["offer_status"]
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          amount: number
          asset: string
          clicks_count?: number
          created_at?: string
          currency?: string
          id?: string
          locks_count?: number
          max_limit?: number
          min_limit?: number
          payment_methods?: string[]
          price: number
          remaining_amount: number
          status?: Database["public"]["Enums"]["offer_status"]
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          amount?: number
          asset?: string
          clicks_count?: number
          created_at?: string
          currency?: string
          id?: string
          locks_count?: number
          max_limit?: number
          min_limit?: number
          payment_methods?: string[]
          price?: number
          remaining_amount?: number
          status?: Database["public"]["Enums"]["offer_status"]
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          completion_rate: number
          created_at: string
          id: string
          is_verified: boolean
          rating: number
          trades_count: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          completion_rate?: number
          created_at?: string
          id?: string
          is_verified?: boolean
          rating?: number
          trades_count?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          completion_rate?: number
          created_at?: string
          id?: string
          is_verified?: boolean
          rating?: number
          trades_count?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      trade_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          trade_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_messages_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          asset: string
          buyer_id: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          offer_id: string
          payment_method: string
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["trade_status"]
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          asset: string
          buyer_id: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          offer_id: string
          payment_method: string
          price: number
          seller_id: string
          status?: Database["public"]["Enums"]["trade_status"]
          total: number
          updated_at?: string
        }
        Update: {
          amount?: number
          asset?: string
          buyer_id?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          offer_id?: string
          payment_method?: string
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["trade_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          asset: string
          created_at: string
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          created_at?: string
          id?: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          asset: string
          balance: number
          created_at: string
          id: string
          locked_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset: string
          balance?: number
          created_at?: string
          id?: string
          locked_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: string
          balance?: number
          created_at?: string
          id?: string
          locked_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      deal_status: "locked" | "expired" | "completed"
      offer_status: "active" | "inactive" | "completed"
      offer_type: "buy" | "sell"
      trade_status:
        | "pending"
        | "paid"
        | "completed"
        | "disputed"
        | "cancelled"
        | "locked"
        | "expired"
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
      deal_status: ["locked", "expired", "completed"],
      offer_status: ["active", "inactive", "completed"],
      offer_type: ["buy", "sell"],
      trade_status: [
        "pending",
        "paid",
        "completed",
        "disputed",
        "cancelled",
        "locked",
        "expired",
      ],
    },
  },
} as const
