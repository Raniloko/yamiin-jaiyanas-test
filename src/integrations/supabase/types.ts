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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          added_at: string
          can_view_stats: boolean
          email: string
          role: string
        }
        Insert: {
          added_at?: string
          can_view_stats?: boolean
          email: string
          role?: string
        }
        Update: {
          added_at?: string
          can_view_stats?: boolean
          email?: string
          role?: string
        }
        Relationships: []
      }
      menu_availability: {
        Row: {
          created_at: string
          key: string
          until: string | null
        }
        Insert: {
          created_at?: string
          key: string
          until?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          until?: string | null
        }
        Relationships: []
      }
      menu_events: {
        Row: {
          category: string | null
          created_at: string
          device: string | null
          event: string
          id: number
          item: string | null
          qty: number | null
          query: string | null
          session_id: string
          value: number | null
          variant: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          device?: string | null
          event: string
          id?: never
          item?: string | null
          qty?: number | null
          query?: string | null
          session_id: string
          value?: number | null
          variant?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          device?: string | null
          event?: string
          id?: never
          item?: string | null
          qty?: number | null
          query?: string | null
          session_id?: string
          value?: number | null
          variant?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          access_token: string
          address: Json | null
          contact: Json
          created_at: string
          delivery_fee: number
          fulfillment: string
          id: string
          items: Json
          note: string
          paid: boolean
          payment: string
          pickup_at: string
          pickup_label: string
          status: string
          stripe_session_id: string | null
          total: number
        }
        Insert: {
          access_token?: string
          address?: Json | null
          contact: Json
          created_at?: string
          delivery_fee?: number
          fulfillment?: string
          id: string
          items: Json
          note?: string
          paid?: boolean
          payment: string
          pickup_at: string
          pickup_label: string
          status?: string
          stripe_session_id?: string | null
          total: number
        }
        Update: {
          access_token?: string
          address?: Json | null
          contact?: Json
          created_at?: string
          delivery_fee?: number
          fulfillment?: string
          id?: string
          items?: Json
          note?: string
          paid?: boolean
          payment?: string
          pickup_at?: string
          pickup_label?: string
          status?: string
          stripe_session_id?: string | null
          total?: number
        }
        Relationships: []
      }
      shop_status: {
        Row: {
          id: number
          pause_note: string | null
          paused_until: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          pause_note?: string | null
          paused_until?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          pause_note?: string | null
          paused_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_accounts: {
        Args: never
        Returns: {
          confirmed: boolean
          created_at: string | null
          email: string
          can_view_stats: boolean
          has_account: boolean
          is_admin: boolean
          last_sign_in_at: string | null
          role: string | null
        }[]
      }
      admin_menu_analytics: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      can_view_stats: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      my_access: { Args: never; Returns: Json }
      owner_set_access: {
        Args: { p_admin: boolean; p_email: string; p_stats: boolean }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
