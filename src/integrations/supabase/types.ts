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
      activity_alerts: {
        Row: {
          alert_type: string
          attendance_id: string | null
          company_id: string
          created_at: string
          employee_id: string
          ended_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          started_at: string
        }
        Insert: {
          alert_type: string
          attendance_id?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          ended_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          started_at?: string
        }
        Update: {
          alert_type?: string
          attendance_id?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          ended_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_alerts_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          active_seconds: number
          break_seconds: number
          clock_in: string | null
          clock_out: string | null
          company_id: string
          created_at: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          idle_seconds: number
          is_manual: boolean
          notes: string | null
          productivity_score: number | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          active_seconds?: number
          break_seconds?: number
          clock_in?: string | null
          clock_out?: string | null
          company_id: string
          created_at?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          idle_seconds?: number
          is_manual?: boolean
          notes?: string | null
          productivity_score?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          active_seconds?: number
          break_seconds?: number
          clock_in?: string | null
          clock_out?: string | null
          company_id?: string
          created_at?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          idle_seconds?: number
          is_manual?: boolean
          notes?: string | null
          productivity_score?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clip_requests: {
        Row: {
          clip_id: string | null
          company_id: string
          created_at: string
          duration_seconds: number
          employee_id: string
          expires_at: string
          fulfilled_at: string | null
          id: string
          reason: string | null
          requested_by: string
          status: string
        }
        Insert: {
          clip_id?: string | null
          company_id: string
          created_at?: string
          duration_seconds?: number
          employee_id: string
          expires_at?: string
          fulfilled_at?: string | null
          id?: string
          reason?: string | null
          requested_by: string
          status?: string
        }
        Update: {
          clip_id?: string | null
          company_id?: string
          created_at?: string
          duration_seconds?: number
          employee_id?: string
          expires_at?: string
          fulfilled_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clip_requests_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "recording_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          brand_color: string | null
          city: string | null
          created_at: string
          current_period_end: string | null
          gst_number: string | null
          holidays: string[] | null
          id: string
          industry: string | null
          invite_code: string
          logo_url: string | null
          name: string
          onboarded: boolean
          owner_id: string | null
          pan_number: string | null
          phone: string | null
          plan: string | null
          postal_code: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          size: string | null
          state: string | null
          subscription_status: string | null
          tagline: string | null
          trial_ends_at: string | null
          updated_at: string
          website: string | null
          weekly_off_days: number[] | null
          work_hours_per_day: number | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          city?: string | null
          created_at?: string
          current_period_end?: string | null
          gst_number?: string | null
          holidays?: string[] | null
          id?: string
          industry?: string | null
          invite_code: string
          logo_url?: string | null
          name: string
          onboarded?: boolean
          owner_id?: string | null
          pan_number?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          size?: string | null
          state?: string | null
          subscription_status?: string | null
          tagline?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
          weekly_off_days?: number[] | null
          work_hours_per_day?: number | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          city?: string | null
          created_at?: string
          current_period_end?: string | null
          gst_number?: string | null
          holidays?: string[] | null
          id?: string
          industry?: string | null
          invite_code?: string
          logo_url?: string | null
          name?: string
          onboarded?: boolean
          owner_id?: string | null
          pan_number?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          size?: string | null
          state?: string | null
          subscription_status?: string | null
          tagline?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
          weekly_off_days?: number[] | null
          work_hours_per_day?: number | null
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          intended_email: string | null
          intended_name: string | null
          job_title: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          intended_email?: string | null
          intended_name?: string | null
          job_title?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          intended_email?: string | null
          intended_name?: string | null
          job_title?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_inr: number
          company_id: string
          created_at: string
          id: string
          method: string | null
          raw: Json | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount_inr: number
          company_id: string
          created_at?: string
          id?: string
          method?: string | null
          raw?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount_inr?: number
          company_id?: string
          created_at?: string
          id?: string
          method?: string | null
          raw?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          active: boolean | null
          contact_only: boolean | null
          created_at: string
          features: Json
          id: string
          max_staff: number | null
          name: string
          per_user: boolean | null
          price_inr: number
          price_inr_yearly: number | null
          razorpay_plan_id: string | null
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          contact_only?: boolean | null
          created_at?: string
          features?: Json
          id: string
          max_staff?: number | null
          name: string
          per_user?: boolean | null
          price_inr: number
          price_inr_yearly?: number | null
          razorpay_plan_id?: string | null
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          contact_only?: boolean | null
          created_at?: string
          features?: Json
          id?: string
          max_staff?: number | null
          name?: string
          per_user?: boolean | null
          price_inr?: number
          price_inr_yearly?: number | null
          razorpay_plan_id?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      productivity_entries: {
        Row: {
          active_minutes: number
          break_minutes: number
          company_id: string
          created_at: string
          entry_date: string
          hour_bucket: number | null
          id: string
          idle_minutes: number
          project_id: string | null
          score: number | null
          tasks_completed: number
          tasks_total: number
          user_id: string
        }
        Insert: {
          active_minutes?: number
          break_minutes?: number
          company_id: string
          created_at?: string
          entry_date: string
          hour_bucket?: number | null
          id?: string
          idle_minutes?: number
          project_id?: string | null
          score?: number | null
          tasks_completed?: number
          tasks_total?: number
          user_id: string
        }
        Update: {
          active_minutes?: number
          break_minutes?: number
          company_id?: string
          created_at?: string
          entry_date?: string
          hour_bucket?: number | null
          id?: string
          idle_minutes?: number
          project_id?: string | null
          score?: number | null
          tasks_completed?: number
          tasks_total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productivity_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productivity_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          currency: string | null
          department: string | null
          email: string | null
          expected_monthly_hours: number | null
          full_name: string | null
          hourly_overtime_rate: number | null
          id: string
          job_title: string | null
          monthly_salary: number | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          department?: string | null
          email?: string | null
          expected_monthly_hours?: number | null
          full_name?: string | null
          hourly_overtime_rate?: number | null
          id: string
          job_title?: string | null
          monthly_salary?: number | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          department?: string | null
          email?: string | null
          expected_monthly_hours?: number | null
          full_name?: string | null
          hourly_overtime_rate?: number | null
          id?: string
          job_title?: string | null
          monthly_salary?: number | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recording_clips: {
        Row: {
          attendance_id: string | null
          captured_at: string
          company_id: string
          created_at: string
          duration_seconds: number
          employee_id: string
          id: string
          mime_type: string
          notes: string | null
          requested_by: string | null
          size_bytes: number
          storage_path: string
        }
        Insert: {
          attendance_id?: string | null
          captured_at?: string
          company_id: string
          created_at?: string
          duration_seconds?: number
          employee_id: string
          id?: string
          mime_type?: string
          notes?: string | null
          requested_by?: string | null
          size_bytes?: number
          storage_path: string
        }
        Update: {
          attendance_id?: string | null
          captured_at?: string
          company_id?: string
          created_at?: string
          duration_seconds?: number
          employee_id?: string
          id?: string
          mime_type?: string
          notes?: string | null
          requested_by?: string | null
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_clips_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recording_clips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_records: {
        Row: {
          base_salary: number
          company_id: string
          created_at: string
          currency: string
          employee_id: string
          expected_hours: number
          finalized_at: string | null
          finalized_by: string | null
          id: string
          override_amount: number | null
          override_reason: string | null
          overtime_amount: number
          overtime_hours: number
          overtime_rate: number
          period_month: number
          period_year: number
          prorated_amount: number
          status: string
          total_amount: number
          updated_at: string
          worked_hours: number
        }
        Insert: {
          base_salary?: number
          company_id: string
          created_at?: string
          currency?: string
          employee_id: string
          expected_hours?: number
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          override_amount?: number | null
          override_reason?: string | null
          overtime_amount?: number
          overtime_hours?: number
          overtime_rate?: number
          period_month: number
          period_year: number
          prorated_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          worked_hours?: number
        }
        Update: {
          base_salary?: number
          company_id?: string
          created_at?: string
          currency?: string
          employee_id?: string
          expected_hours?: number
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          override_amount?: number | null
          override_reason?: string | null
          overtime_amount?: number
          overtime_hours?: number
          overtime_rate?: number
          period_month?: number
          period_year?: number
          prorated_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          worked_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          activity_label: string | null
          app_name: string | null
          captured_at: string
          company_id: string
          created_at: string
          id: string
          image_url: string | null
          project_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["screenshot_status"]
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          activity_label?: string | null
          app_name?: string | null
          captured_at?: string
          company_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          project_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["screenshot_status"]
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          activity_label?: string | null
          app_name?: string | null
          captured_at?: string
          company_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          project_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["screenshot_status"]
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_inr: number
          billing_cycle: string | null
          company_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          raw: Json | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          seats: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_inr: number
          billing_cycle?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          raw?: Json | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          seats?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_inr?: number
          billing_cycle?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          raw?: Json | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          seats?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      company_access_status: {
        Args: { _company_id: string }
        Returns: {
          current_period_end: string
          is_active: boolean
          is_readonly: boolean
          plan: string
          status: string
          trial_ends_at: string
        }[]
      }
      get_user_company: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      lookup_company_by_invite: {
        Args: { _code: string }
        Returns: {
          company_id: string
          company_name: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "company_admin" | "employee"
      attendance_status: "present" | "absent" | "on_break" | "clocked_out"
      project_status: "active" | "paused" | "completed" | "archived"
      screenshot_status: "pending" | "approved" | "rejected"
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
      app_role: ["super_admin", "company_admin", "employee"],
      attendance_status: ["present", "absent", "on_break", "clocked_out"],
      project_status: ["active", "paused", "completed", "archived"],
      screenshot_status: ["pending", "approved", "rejected"],
    },
  },
} as const
