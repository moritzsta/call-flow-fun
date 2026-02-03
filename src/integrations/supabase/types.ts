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
      analyse_instructions: {
        Row: {
          created_at: string
          id: string
          instruction: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instruction: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instruction?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_pipelines: {
        Row: {
          anna_workflow_id: string | null
          britta_workflow_id: string | null
          completed_at: string | null
          config: Json
          created_at: string
          current_phase: string | null
          error_message: string | null
          felix_workflow_id: string | null
          id: string
          paul_workflow_id: string | null
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anna_workflow_id?: string | null
          britta_workflow_id?: string | null
          completed_at?: string | null
          config: Json
          created_at?: string
          current_phase?: string | null
          error_message?: string | null
          felix_workflow_id?: string | null
          id?: string
          paul_workflow_id?: string | null
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anna_workflow_id?: string | null
          britta_workflow_id?: string | null
          completed_at?: string | null
          config?: Json
          created_at?: string
          current_phase?: string | null
          error_message?: string | null
          felix_workflow_id?: string | null
          id?: string
          paul_workflow_id?: string | null
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_pipelines_anna_workflow_id_fkey"
            columns: ["anna_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_pipelines_britta_workflow_id_fkey"
            columns: ["britta_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_pipelines_felix_workflow_id_fkey"
            columns: ["felix_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_pipelines_paul_workflow_id_fkey"
            columns: ["paul_workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_pipelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          analysis: Json | null
          ceo_name: string | null
          city: string | null
          company: string
          created_at: string
          district: string | null
          email: string | null
          id: string
          industry: string | null
          phone: string | null
          project_id: string
          state: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          analysis?: Json | null
          ceo_name?: string | null
          city?: string | null
          company: string
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          project_id: string
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          analysis?: Json | null
          ceo_name?: string | null
          city?: string | null
          company?: string
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          project_id?: string
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_instructions: {
        Row: {
          created_at: string
          id: string
          instruction: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instruction: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instruction?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_template: string
          created_at: string
          enum_name: string
          id: string
          subject_template: string
          title: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          enum_name?: string
          id?: string
          subject_template: string
          title: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          enum_name?: string
          id?: string
          subject_template?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      german_cities: {
        Row: {
          city: string | null
          created_at: string
          id: number
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: number
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: number
          state?: string | null
        }
        Relationships: []
      }
      german_companies: {
        Row: {
          address: string | null
          analysis: string | null
          ceo_name: string | null
          city: string | null
          company: string | null
          created_at: string
          district: string | null
          email: string | null
          id: number
          industry: string | null
          phone: string | null
          state: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          analysis?: string | null
          ceo_name?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: number
          industry?: string | null
          phone?: string | null
          state?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          analysis?: string | null
          ceo_name?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: number
          industry?: string | null
          phone?: string | null
          state?: string | null
          website?: string | null
        }
        Relationships: []
      }
      german_districts: {
        Row: {
          city: string | null
          created_at: string
          district: string | null
          id: number
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          district?: string | null
          id?: number
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          district?: string | null
          id?: number
          state?: string | null
        }
        Relationships: []
      }
      n8n_workflow_states: {
        Row: {
          completed_at: string | null
          conversation_active: boolean | null
          created_at: string
          id: string
          last_message_at: string | null
          loop_count: number
          pipeline_id: string | null
          project_id: string
          result_summary: Json | null
          started_at: string
          status: Database["public"]["Enums"]["workflow_status"]
          trigger_data: Json | null
          updated_at: string
          user_id: string
          workflow_name: string
        }
        Insert: {
          completed_at?: string | null
          conversation_active?: boolean | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          loop_count?: number
          pipeline_id?: string | null
          project_id: string
          result_summary?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_data?: Json | null
          updated_at?: string
          user_id: string
          workflow_name: string
        }
        Update: {
          completed_at?: string | null
          conversation_active?: boolean | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          loop_count?: number
          pipeline_id?: string | null
          project_id?: string
          result_summary?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_data?: Json | null
          updated_at?: string
          user_id?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_workflow_states_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "automation_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_workflow_states_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          preferred_language: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          preferred_language?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          preferred_language?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_emails: {
        Row: {
          body: string
          body_improved: string | null
          company_id: string
          created_at: string
          id: string
          project_id: string
          recipient_email: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          body_improved?: string | null
          company_id: string
          created_at?: string
          id?: string
          project_id: string
          recipient_email: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          body_improved?: string | null
          company_id?: string
          created_at?: string
          id?: string
          project_id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_emails_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_felix_runs: {
        Row: {
          category: string
          city: string
          created_at: string
          error_message: string | null
          id: string
          max_companies: number | null
          project_id: string
          scheduled_at: string
          state: string
          status: string
          updated_at: string
          user_id: string
          workflow_state_id: string | null
        }
        Insert: {
          category: string
          city: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_companies?: number | null
          project_id: string
          scheduled_at: string
          state: string
          status?: string
          updated_at?: string
          user_id: string
          workflow_state_id?: string | null
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_companies?: number | null
          project_id?: string
          scheduled_at?: string
          state?: string
          status?: string
          updated_at?: string
          user_id?: string
          workflow_state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_felix_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_felix_runs_workflow_state_id_fkey"
            columns: ["workflow_state_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_states"
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
      workflow_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string
          role: string
          workflow_state_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          role: string
          workflow_state_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          role?: string
          workflow_state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_messages_workflow_state_id_fkey"
            columns: ["workflow_state_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_organization_role: {
        Args: {
          _organization_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organization_member: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
      is_organization_owner: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "read_only"
      company_status:
        | "found"
        | "analyzed"
        | "contacted"
        | "qualified"
        | "rejected"
      email_status: "draft" | "ready_to_send" | "sending" | "sent" | "failed"
      workflow_status: "pending" | "running" | "completed" | "failed" | "alive"
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
      app_role: ["owner", "manager", "read_only"],
      company_status: [
        "found",
        "analyzed",
        "contacted",
        "qualified",
        "rejected",
      ],
      email_status: ["draft", "ready_to_send", "sending", "sent", "failed"],
      workflow_status: ["pending", "running", "completed", "failed", "alive"],
    },
  },
} as const
