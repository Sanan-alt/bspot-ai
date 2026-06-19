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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          feature: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      conversions: {
        Row: {
          amount: number
          converted_amount: number
          created_at: string
          exchange_rate: number
          from_currency: string
          id: string
          to_currency: string
          usd_value: number | null
          user_id: string
        }
        Insert: {
          amount: number
          converted_amount: number
          created_at?: string
          exchange_rate: number
          from_currency: string
          id?: string
          to_currency: string
          usd_value?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          converted_amount?: number
          created_at?: string
          exchange_rate?: number
          from_currency?: string
          id?: string
          to_currency?: string
          usd_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      country_live_data: {
        Row: {
          country_code: string
          created_at: string
          currency_code: string
          fetched_at: string
          fx_rate_usd: number | null
          inflation_pct: number | null
          policy_rate_pct: number | null
          source: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          currency_code: string
          fetched_at?: string
          fx_rate_usd?: number | null
          inflation_pct?: number | null
          policy_rate_pct?: number | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency_code?: string
          fetched_at?: string
          fx_rate_usd?: number | null
          inflation_pct?: number | null
          policy_rate_pct?: number | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      country_scores: {
        Row: {
          code: string
          created_at: string
          data: Json
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          data: Json
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          data?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          feature: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          feature?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          feature?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          last_free_grant_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          last_free_grant_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          last_free_grant_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dossier_cache: {
        Row: {
          city_name: string | null
          country_code: string
          created_at: string
          data: Json
          id: string
          scope: string
        }
        Insert: {
          city_name?: string | null
          country_code: string
          created_at?: string
          data: Json
          id?: string
          scope: string
        }
        Update: {
          city_name?: string | null
          country_code?: string
          created_at?: string
          data?: Json
          id?: string
          scope?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          country: string | null
          created_at: string
          currency: string
          current_value: number
          id: string
          initial_amount: number
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency: string
          current_value: number
          id?: string
          initial_amount: number
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string
          current_value?: number
          id?: string
          initial_amount?: number
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email_hash: string
          id: string
          ip: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email_hash: string
          id?: string
          ip?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email_hash?: string
          id?: string
          ip?: string | null
          success?: boolean
        }
        Relationships: []
      }
      mfa_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_terms: boolean
          avatar_url: string | null
          business_interests: string[] | null
          created_at: string
          display_name: string | null
          experience_level: string | null
          home_country: string | null
          id: string
          investment_budget_usd: number | null
          is_demo: boolean
          language: string
          onboarded_at: string | null
          readiness_score: number | null
          target_country: string | null
          timeline: string | null
          updated_at: string
        }
        Insert: {
          accepted_terms?: boolean
          avatar_url?: string | null
          business_interests?: string[] | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          home_country?: string | null
          id: string
          investment_budget_usd?: number | null
          is_demo?: boolean
          language?: string
          onboarded_at?: string | null
          readiness_score?: number | null
          target_country?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          accepted_terms?: boolean
          avatar_url?: string | null
          business_interests?: string[] | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          home_country?: string | null
          id?: string
          investment_budget_usd?: number | null
          is_demo?: boolean
          language?: string
          onboarded_at?: string | null
          readiness_score?: number | null
          target_country?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          remind_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          remind_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          remind_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          business_type: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          phase: string
          status: string
          step_index: number
          target_country: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          phase: string
          status?: string
          step_index: number
          target_country?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          phase?: string
          status?: string
          step_index?: number
          target_country?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          category: string
          content_type: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content_type?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content_type?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          user_id?: string
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
      watchlists: {
        Row: {
          alert_above: number | null
          alert_below: number | null
          created_at: string
          id: string
          kind: string
          label: string | null
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_above?: number | null
          alert_below?: number | null
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_above?: number | null
          alert_below?: number | null
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          symbol?: string
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
      check_ai_rate_limit: {
        Args: { p_feature: string; p_max: number; p_window_seconds: number }
        Returns: Json
      }
      check_login_lockout: { Args: { p_email_hash: string }; Returns: Json }
      claim_daily_free_credits: { Args: never; Returns: Json }
      consume_credits: {
        Args: { p_amount: number; p_description?: string; p_feature: string }
        Returns: number
      }
      consume_mfa_recovery_code: { Args: { p_code: string }; Returns: boolean }
      grant_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_type: string
          p_user: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_login_attempt: {
        Args: { p_email_hash: string; p_success: boolean }
        Returns: Json
      }
      regenerate_mfa_recovery_codes: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user" | "owner"
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
      app_role: ["admin", "user", "owner"],
    },
  },
} as const
