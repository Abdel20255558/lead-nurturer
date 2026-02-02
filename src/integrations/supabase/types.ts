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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          activity: string | null
          address: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          contact_method: Database["public"]["Enums"]["contact_method"] | null
          contact_result: Database["public"]["Enums"]["contact_result"] | null
          created_at: string
          email: string | null
          follow_up_count: number | null
          id: string
          last_action_at: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          offer_sent_date: string | null
          phone_fixed: string | null
          phone_mobile: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          activity?: string | null
          address?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          contact_method?: Database["public"]["Enums"]["contact_method"] | null
          contact_result?: Database["public"]["Enums"]["contact_result"] | null
          created_at?: string
          email?: string | null
          follow_up_count?: number | null
          id?: string
          last_action_at?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          offer_sent_date?: string | null
          phone_fixed?: string | null
          phone_mobile?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          activity?: string | null
          address?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          contact_method?: Database["public"]["Enums"]["contact_method"] | null
          contact_result?: Database["public"]["Enums"]["contact_result"] | null
          created_at?: string
          email?: string | null
          follow_up_count?: number | null
          id?: string
          last_action_at?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          offer_sent_date?: string | null
          phone_fixed?: string | null
          phone_mobile?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          client_id: string
          created_at: string
          date_time: string
          id: string
          next_step: string | null
          summary: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_time?: string
          id?: string
          next_step?: string | null
          summary?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_time?: string
          id?: string
          next_step?: string | null
          summary?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          company_name: string
          created_at: string
          delivery_date: string
          driver: Database["public"]["Enums"]["driver_type"]
          id: string
          notes: string | null
          postponed_date: string | null
          product: string
          status: Database["public"]["Enums"]["delivery_status"]
          truck: Database["public"]["Enums"]["truck_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          delivery_date: string
          driver: Database["public"]["Enums"]["driver_type"]
          id?: string
          notes?: string | null
          postponed_date?: string | null
          product: string
          status?: Database["public"]["Enums"]["delivery_status"]
          truck: Database["public"]["Enums"]["truck_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          delivery_date?: string
          driver?: Database["public"]["Enums"]["driver_type"]
          id?: string
          notes?: string | null
          postponed_date?: string | null
          product?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          truck?: Database["public"]["Enums"]["truck_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_status:
        | "not_prepared"
        | "not_contacted"
        | "in_progress"
        | "rejected"
      company_type: "SA" | "Non SA"
      contact_method: "email" | "reels"
      contact_result: "pending" | "interested" | "not_interested"
      delivery_status: "pending" | "delivered" | "postponed" | "cancelled"
      driver_type: "M. Jalale" | "M. Dawi"
      interaction_type: "call" | "email" | "reels" | "visit" | "other"
      truck_type: "SOLO 1" | "SOLO 2" | "Renault" | "Man"
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
      client_status: [
        "not_prepared",
        "not_contacted",
        "in_progress",
        "rejected",
      ],
      company_type: ["SA", "Non SA"],
      contact_method: ["email", "reels"],
      contact_result: ["pending", "interested", "not_interested"],
      delivery_status: ["pending", "delivered", "postponed", "cancelled"],
      driver_type: ["M. Jalale", "M. Dawi"],
      interaction_type: ["call", "email", "reels", "visit", "other"],
      truck_type: ["SOLO 1", "SOLO 2", "Renault", "Man"],
    },
  },
} as const
