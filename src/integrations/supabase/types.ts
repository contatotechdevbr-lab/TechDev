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
      activity_logs: {
        Row: {
          action: string
          actor_name: string
          created_at: string
          id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_name?: string
          created_at?: string
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_name?: string
          created_at?: string
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          avatar_color: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_color?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_color?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      custom_plans: {
        Row: {
          active: boolean
          base_plan_id: string | null
          created_at: string
          id: string
          interval: Database["public"]["Enums"]["plan_interval"]
          name: string
          notes: string | null
          price_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          base_plan_id?: string | null
          created_at?: string
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          name: string
          notes?: string | null
          price_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          base_plan_id?: string | null
          created_at?: string
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          name?: string
          notes?: string | null
          price_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_plans_base_plan_id_fkey"
            columns: ["base_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          last_sent_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          last_sent_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          installments: number
          mp_order_id: string | null
          mp_payment_id: string | null
          pagarme_charge_id: string | null
          pagarme_order_id: string | null
          paid_at: string | null
          payer_email: string | null
          payment_method: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          installments?: number
          mp_order_id?: string | null
          mp_payment_id?: string | null
          pagarme_charge_id?: string | null
          pagarme_order_id?: string | null
          paid_at?: string | null
          payer_email?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          installments?: number
          mp_order_id?: string | null
          mp_payment_id?: string | null
          pagarme_charge_id?: string | null
          pagarme_order_id?: string | null
          paid_at?: string | null
          payer_email?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          features: string[]
          id: string
          interval: Database["public"]["Enums"]["plan_interval"]
          is_popular: boolean
          max_installments: number
          name: string
          pagarme_plan_id: string | null
          price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_popular?: boolean
          max_installments?: number
          name: string
          pagarme_plan_id?: string | null
          price_cents: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_popular?: boolean
          max_installments?: number
          name?: string
          pagarme_plan_id?: string | null
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_zip_code: string | null
          cpf: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          pagarme_customer_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_zip_code?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          pagarme_customer_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_zip_code?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          pagarme_customer_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          progress: number
          responsible: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          progress?: number
          responsible?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          progress?: number
          responsible?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          client_id: string | null
          created_at: string
          domain: string | null
          id: string
          link: string | null
          name: string
          status: Database["public"]["Enums"]["site_status"]
          tech: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          link?: string | null
          name: string
          status?: Database["public"]["Enums"]["site_status"]
          tech?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          link?: string | null
          name?: string
          status?: Database["public"]["Enums"]["site_status"]
          tech?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          custom_plan_id: string | null
          id: string
          pagarme_subscription_id: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          custom_plan_id?: string | null
          id?: string
          pagarme_subscription_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          custom_plan_id?: string | null
          id?: string
          pagarme_subscription_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_custom_plan_id_fkey"
            columns: ["custom_plan_id"]
            isOneToOne: false
            referencedRelation: "custom_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_staff: boolean
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_events: {
        Row: {
          id: string
          payload: Json | null
          processed_at: string
          resource_id: string | null
          status: string | null
          topic: string | null
        }
        Insert: {
          id: string
          payload?: Json | null
          processed_at?: string
          resource_id?: string | null
          status?: string | null
          topic?: string | null
        }
        Update: {
          id?: string
          payload?: Json | null
          processed_at?: string
          resource_id?: string | null
          status?: string | null
          topic?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      client_status: "ativo" | "pendente" | "inativo"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "canceled"
      plan_interval: "month" | "year" | "one_time"
      project_status:
        | "briefing"
        | "design"
        | "desenvolvimento"
        | "revisao"
        | "finalizado"
      site_status: "ativo" | "desenvolvimento" | "suspenso"
      subscription_status:
        | "active"
        | "pending"
        | "past_due"
        | "canceled"
        | "suspended"
      ticket_priority: "baixa" | "media" | "alta"
      ticket_status: "aberto" | "em_andamento" | "resolvido" | "fechado"
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
      app_role: ["admin", "user"],
      client_status: ["ativo", "pendente", "inativo"],
      payment_status: ["pending", "paid", "failed", "refunded", "canceled"],
      plan_interval: ["month", "year", "one_time"],
      project_status: [
        "briefing",
        "design",
        "desenvolvimento",
        "revisao",
        "finalizado",
      ],
      site_status: ["ativo", "desenvolvimento", "suspenso"],
      subscription_status: [
        "active",
        "pending",
        "past_due",
        "canceled",
        "suspended",
      ],
      ticket_priority: ["baixa", "media", "alta"],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
    },
  },
} as const
