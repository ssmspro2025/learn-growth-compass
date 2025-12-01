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
      activities: {
        Row: {
          activity_date: string
          activity_type_id: string
          center_id: string
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          grade: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          photo_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          activity_date: string
          activity_type_id: string
          center_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          grade?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          photo_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          activity_date?: string
          activity_type_id?: string
          center_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          grade?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          photo_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_media: {
        Row: {
          activity_id: string
          file_name: string | null
          file_size: number | null
          id: string
          media_type: string
          media_url: string
          uploaded_at: string | null
        }
        Insert: {
          activity_id: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          media_url: string
          uploaded_at?: string | null
        }
        Update: {
          activity_id?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          media_url?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_media_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_types: {
        Row: {
          center_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          center_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          center_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summaries: {
        Row: {
          created_at: string
          generated_on: string
          id: string
          student_id: string
          summary_text: string
          summary_type: string
        }
        Insert: {
          created_at?: string
          generated_on?: string
          id?: string
          student_id: string
          summary_text: string
          summary_type: string
        }
        Update: {
          created_at?: string
          generated_on?: string
          id?: string
          student_id?: string
          summary_text?: string
          summary_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summaries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          status: string
          student_id: string
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          status: string
          student_id: string
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id?: string
          time_in?: string | null
          time_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      center_feature_permissions: {
        Row: {
          center_id: string
          created_at: string | null
          feature_name: string
          id: string
          is_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          center_id: string
          created_at?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "center_feature_permissions_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          address: string | null
          center_name: string
          contact_number: string | null
          created_at: string
          id: string
        }
        Insert: {
          address?: string | null
          center_name: string
          contact_number?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          address?: string | null
          center_name?: string
          contact_number?: string | null
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      chapter_teachings: {
        Row: {
          chapter_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          students_present: Json | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          students_present?: Json | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          students_present?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_teachings_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          center_id: string | null
          chapter_name: string
          created_at: string
          date_taught: string
          id: string
          notes: string | null
          subject: string
        }
        Insert: {
          center_id?: string | null
          chapter_name: string
          created_at?: string
          date_taught: string
          id?: string
          notes?: string | null
          subject: string
        }
        Update: {
          center_id?: string | null
          chapter_name?: string
          created_at?: string
          date_taught?: string
          id?: string
          notes?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters_studied: {
        Row: {
          chapter_name: string
          created_at: string
          date: string
          id: string
          notes: string | null
          student_id: string
          subject: string
        }
        Insert: {
          chapter_name: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          student_id: string
          subject: string
        }
        Update: {
          chapter_name?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          student_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_studied_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_studied_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          center_id: string
          created_at: string | null
          id: string
          parent_user_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          center_id: string
          created_at?: string | null
          id?: string
          parent_user_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string | null
          id?: string
          parent_user_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          read_at: string | null
          sender_user_id: string
          sent_at: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          read_at?: string | null
          sender_user_id: string
          sent_at?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          read_at?: string | null
          sender_user_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_actions: {
        Row: {
          action_date: string
          action_description: string | null
          action_taken_by: string
          action_type: string
          created_at: string | null
          discipline_issue_id: string
          due_date: string | null
          evidence_document_url: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_date: string
          action_description?: string | null
          action_taken_by: string
          action_type: string
          created_at?: string | null
          discipline_issue_id: string
          due_date?: string | null
          evidence_document_url?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_date?: string
          action_description?: string | null
          action_taken_by?: string
          action_type?: string
          created_at?: string | null
          discipline_issue_id?: string
          due_date?: string | null
          evidence_document_url?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_actions_action_taken_by_fkey"
            columns: ["action_taken_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_actions_discipline_issue_id_fkey"
            columns: ["discipline_issue_id"]
            isOneToOne: false
            referencedRelation: "discipline_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_categories: {
        Row: {
          center_id: string
          created_at: string | null
          default_severity: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          center_id: string
          created_at?: string | null
          default_severity?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          center_id?: string
          created_at?: string | null
          default_severity?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_categories_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_followups: {
        Row: {
          conducted_by: string
          created_at: string | null
          discipline_issue_id: string
          followup_date: string
          followup_type: string
          id: string
          notes: string | null
          outcome: string | null
        }
        Insert: {
          conducted_by: string
          created_at?: string | null
          discipline_issue_id: string
          followup_date: string
          followup_type: string
          id?: string
          notes?: string | null
          outcome?: string | null
        }
        Update: {
          conducted_by?: string
          created_at?: string | null
          discipline_issue_id?: string
          followup_date?: string
          followup_type?: string
          id?: string
          notes?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_followups_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_followups_discipline_issue_id_fkey"
            columns: ["discipline_issue_id"]
            isOneToOne: false
            referencedRelation: "discipline_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_issues: {
        Row: {
          center_id: string
          created_at: string | null
          description: string
          discipline_category_id: string
          id: string
          incident_location: string | null
          issue_date: string
          parent_informed: boolean | null
          parent_informed_date: string | null
          reported_by: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_date: string | null
          severity: string
          student_id: string
          updated_at: string | null
          witnesses: string | null
        }
        Insert: {
          center_id: string
          created_at?: string | null
          description: string
          discipline_category_id: string
          id?: string
          incident_location?: string | null
          issue_date: string
          parent_informed?: boolean | null
          parent_informed_date?: string | null
          reported_by: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_date?: string | null
          severity: string
          student_id: string
          updated_at?: string | null
          witnesses?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string | null
          description?: string
          discipline_category_id?: string
          id?: string
          incident_location?: string | null
          issue_date?: string
          parent_informed?: boolean | null
          parent_informed_date?: string | null
          reported_by?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_date?: string | null
          severity?: string
          student_id?: string
          updated_at?: string | null
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_issues_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_issues_discipline_category_id_fkey"
            columns: ["discipline_category_id"]
            isOneToOne: false
            referencedRelation: "discipline_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          center_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          center_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by_user_id: string | null
          center_id: string
          created_at: string
          created_by_user_id: string | null
          description: string
          expense_category: string
          expense_date: string
          id: string
          is_approved: boolean | null
          notes: string | null
          payment_method: string | null
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by_user_id?: string | null
          center_id: string
          created_at?: string
          created_by_user_id?: string | null
          description: string
          expense_category: string
          expense_date?: string
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by_user_id?: string | null
          center_id?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string
          expense_category?: string
          expense_date?: string
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_headings: {
        Row: {
          center_id: string
          created_at: string
          description: string | null
          heading_code: string
          heading_name: string
          id: string
          is_active: boolean
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          description?: string | null
          heading_code: string
          heading_name: string
          id?: string
          is_active?: boolean
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          description?: string | null
          heading_code?: string
          heading_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_headings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          amount: number
          center_id: string
          created_at: string
          effective_from: string
          effective_to: string | null
          fee_heading_id: string
          grade: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          academic_year: string
          amount: number
          center_id: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          fee_heading_id: string
          grade: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          academic_year?: string
          amount?: number
          center_id?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fee_heading_id?: string
          grade?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_heading_id_fkey"
            columns: ["fee_heading_id"]
            isOneToOne: false
            referencedRelation: "fee_headings"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_summaries: {
        Row: {
          center_id: string
          generated_at: string
          id: string
          last_updated: string
          net_balance: number | null
          summary_month: number
          summary_year: number
          total_collected: number | null
          total_expenses: number | null
          total_invoiced: number | null
          total_outstanding: number | null
        }
        Insert: {
          center_id: string
          generated_at?: string
          id?: string
          last_updated?: string
          net_balance?: number | null
          summary_month: number
          summary_year: number
          total_collected?: number | null
          total_expenses?: number | null
          total_invoiced?: number | null
          total_outstanding?: number | null
        }
        Update: {
          center_id?: string
          generated_at?: string
          id?: string
          last_updated?: string
          net_balance?: number | null
          summary_month?: number
          summary_year?: number
          total_collected?: number | null
          total_expenses?: number | null
          total_invoiced?: number | null
          total_outstanding?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_summaries_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assignment_date: string
          attachment_name: string | null
          attachment_url: string | null
          center_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          grade: string
          id: string
          instructions: string | null
          status: string | null
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_date?: string
          attachment_name?: string | null
          attachment_url?: string | null
          center_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          grade: string
          id?: string
          instructions?: string | null
          status?: string | null
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_date?: string
          attachment_name?: string | null
          attachment_url?: string | null
          center_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          grade?: string
          id?: string
          instructions?: string | null
          status?: string | null
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_attachments: {
        Row: {
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          homework_id: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          homework_id: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          homework_id?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_attachments_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_feedback: {
        Row: {
          created_at: string | null
          feedback_date: string | null
          feedback_file_name: string | null
          feedback_file_url: string | null
          id: string
          marks_obtained: number | null
          remarks: string | null
          submission_id: string
          teacher_id: string
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_date?: string | null
          feedback_file_name?: string | null
          feedback_file_url?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          submission_id: string
          teacher_id: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_date?: string | null
          feedback_file_name?: string | null
          feedback_file_url?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          submission_id?: string
          teacher_id?: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "homework_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_feedback_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          created_at: string | null
          homework_id: string
          id: string
          status: string | null
          student_id: string
          submission_date: string | null
          submission_file_name: string | null
          submission_file_url: string | null
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homework_id: string
          id?: string
          status?: string | null
          student_id: string
          submission_date?: string | null
          submission_file_name?: string | null
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homework_id?: string
          id?: string
          status?: string | null
          student_id?: string
          submission_date?: string | null
          submission_file_name?: string | null
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      invoice_generation_logs: {
        Row: {
          center_id: string
          created_at: string | null
          error_message: string | null
          generation_date: string
          id: string
          invoices_generated: number | null
          status: string | null
        }
        Insert: {
          center_id: string
          created_at?: string | null
          error_message?: string | null
          generation_date: string
          id?: string
          invoices_generated?: number | null
          status?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string | null
          error_message?: string | null
          generation_date?: string
          id?: string
          invoices_generated?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_generation_logs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          fee_heading_id: string
          id: string
          invoice_id: string
          quantity: number | null
          total_amount: number
          unit_amount: number
        }
        Insert: {
          created_at?: string
          description: string
          fee_heading_id: string
          id?: string
          invoice_id: string
          quantity?: number | null
          total_amount: number
          unit_amount: number
        }
        Update: {
          created_at?: string
          description?: string
          fee_heading_id?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          total_amount?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_fee_heading_id_fkey"
            columns: ["fee_heading_id"]
            isOneToOne: false
            referencedRelation: "fee_headings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academic_year: string
          center_id: string
          created_at: string
          due_date: string
          id: string
          invoice_date: string
          invoice_month: number
          invoice_number: string
          invoice_year: number
          late_fee_per_day: number | null
          notes: string | null
          paid_amount: number
          status: string | null
          student_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          center_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_date?: string
          invoice_month: number
          invoice_number: string
          invoice_year: number
          late_fee_per_day?: number | null
          notes?: string | null
          paid_amount?: number
          status?: string | null
          student_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          center_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_month?: number
          invoice_number?: string
          invoice_year?: number
          late_fee_per_day?: number | null
          notes?: string | null
          paid_amount?: number
          status?: string | null
          student_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_code: string
          account_name: string
          center_id: string
          created_at: string
          created_by_user_id: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          running_balance: number | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          account_code: string
          account_name: string
          center_id: string
          created_at?: string
          created_by_user_id?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          running_balance?: number | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          account_code?: string
          account_name?: string
          center_id?: string
          created_at?: string
          created_by_user_id?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          running_balance?: number | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_media: {
        Row: {
          file_name: string | null
          file_size: number | null
          id: string
          lesson_plan_id: string
          media_type: string
          media_url: string
          uploaded_at: string | null
        }
        Insert: {
          file_name?: string | null
          file_size?: number | null
          id?: string
          lesson_plan_id: string
          media_type: string
          media_url: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string | null
          file_size?: number | null
          id?: string
          lesson_plan_id?: string
          media_type?: string
          media_url?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_media_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          center_id: string
          chapter: string
          created_at: string | null
          created_by: string
          description: string | null
          file_name: string | null
          file_size: number | null
          grade: string
          id: string
          is_active: boolean | null
          lesson_date: string
          lesson_file_url: string | null
          notes: string | null
          subject: string
          topic: string
          updated_at: string | null
        }
        Insert: {
          center_id: string
          chapter: string
          created_at?: string | null
          created_by: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          grade: string
          id?: string
          is_active?: boolean | null
          lesson_date: string
          lesson_file_url?: string | null
          notes?: string | null
          subject: string
          topic: string
          updated_at?: string | null
        }
        Update: {
          center_id?: string
          chapter?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          grade?: string
          id?: string
          is_active?: boolean | null
          lesson_date?: string
          lesson_file_url?: string | null
          notes?: string | null
          subject?: string
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string | null
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          center_id: string
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          received_by_user_id: string | null
          reference_number: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_paid: number
          center_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method: string
          received_by_user_id?: string | null
          reference_number?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          center_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          received_by_user_id?: string | null
          reference_number?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_user_id_fkey"
            columns: ["received_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_activities: {
        Row: {
          activity_id: string
          attended_at: string | null
          completed: boolean | null
          created_at: string | null
          id: string
          involvement_score: number | null
          participation_rating: string | null
          student_id: string
          teacher_notes: string | null
          updated_at: string | null
        }
        Insert: {
          activity_id: string
          attended_at?: string | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          involvement_score?: number | null
          participation_rating?: string | null
          student_id: string
          teacher_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string
          attended_at?: string | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          involvement_score?: number | null
          participation_rating?: string | null
          student_id?: string
          teacher_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_activity_records: {
        Row: {
          activity_id: string | null
          created_at: string | null
          id: string
          involvement_rating: number | null
          media_urls: string[] | null
          student_id: string | null
          teacher_notes: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          involvement_rating?: number | null
          media_urls?: string[] | null
          student_id?: string | null
          teacher_notes?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          involvement_rating?: number | null
          media_urls?: string[] | null
          student_id?: string | null
          teacher_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_records_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_chapters: {
        Row: {
          completed: boolean
          created_at: string
          date_completed: string
          id: string
          lesson_plan_id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date_completed?: string
          id?: string
          lesson_plan_id: string
          notes?: string | null
          student_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date_completed?: string
          id?: string
          lesson_plan_id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_chapters_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_chapters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_chapters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_fee_assignments: {
        Row: {
          academic_year: string
          amount: number
          assigned_date: string
          created_at: string
          fee_heading_id: string
          fee_structure_id: string
          id: string
          is_active: boolean
          student_id: string
        }
        Insert: {
          academic_year: string
          amount: number
          assigned_date?: string
          created_at?: string
          fee_heading_id: string
          fee_structure_id: string
          id?: string
          is_active?: boolean
          student_id: string
        }
        Update: {
          academic_year?: string
          amount?: number
          assigned_date?: string
          created_at?: string
          fee_heading_id?: string
          fee_structure_id?: string
          id?: string
          is_active?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_assignments_fee_heading_id_fkey"
            columns: ["fee_heading_id"]
            isOneToOne: false
            referencedRelation: "fee_headings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_assignments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_homework_records: {
        Row: {
          created_at: string | null
          homework_id: string | null
          id: string
          status: string | null
          student_id: string | null
          submission_date: string | null
          teacher_rating: number | null
          teacher_remarks: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homework_id?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
          submission_date?: string | null
          teacher_rating?: number | null
          teacher_remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homework_id?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
          submission_date?: string | null
          teacher_rating?: number | null
          teacher_remarks?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_homework_records_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_homework_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_homework_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_lesson_records: {
        Row: {
          completion_status: string | null
          created_at: string | null
          id: string
          lesson_plan_id: string
          student_id: string
          taught_date: string
          teacher_remarks: string | null
          updated_at: string | null
        }
        Insert: {
          completion_status?: string | null
          created_at?: string | null
          id?: string
          lesson_plan_id: string
          student_id: string
          taught_date: string
          teacher_remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_status?: string | null
          created_at?: string | null
          id?: string
          lesson_plan_id?: string
          student_id?: string
          taught_date?: string
          teacher_remarks?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_records_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lesson_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lesson_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          center_id: string | null
          contact_number: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          enrollment_date: string | null
          grade: string
          id: string
          name: string
          parent_name: string
          school_name: string
          status: string | null
        }
        Insert: {
          address?: string | null
          center_id?: string | null
          contact_number: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          enrollment_date?: string | null
          grade: string
          id?: string
          name: string
          parent_name: string
          school_name: string
          status?: string | null
        }
        Update: {
          address?: string | null
          center_id?: string | null
          contact_number?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          enrollment_date?: string | null
          grade?: string
          id?: string
          name?: string
          parent_name?: string
          school_name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          status: string
          teacher_id: string
          time_in: string | null
          time_out: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          status: string
          teacher_id: string
          time_in?: string | null
          time_out?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: string
          teacher_id?: string
          time_in?: string | null
          time_out?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_feature_permissions: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          is_enabled: boolean
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_feature_permissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          center_id: string
          contact_number: string | null
          created_at: string | null
          email: string | null
          hire_date: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          center_id: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          hire_date: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          center_id?: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          ai_suggested_marks: number | null
          created_at: string
          date_taken: string
          id: string
          marks_obtained: number
          notes: string | null
          question_marks: Json | null
          student_answer: string | null
          student_id: string
          test_id: string
        }
        Insert: {
          ai_suggested_marks?: number | null
          created_at?: string
          date_taken?: string
          id?: string
          marks_obtained: number
          notes?: string | null
          question_marks?: Json | null
          student_answer?: string | null
          student_id: string
          test_id: string
        }
        Update: {
          ai_suggested_marks?: number | null
          created_at?: string
          date_taken?: string
          id?: string
          marks_obtained?: number
          notes?: string | null
          question_marks?: Json | null
          student_answer?: string | null
          student_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          center_id: string | null
          created_at: string
          date: string
          extracted_text: string | null
          grade: string | null
          id: string
          name: string
          questions: Json | null
          subject: string
          total_marks: number
          uploaded_file_url: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          date: string
          extracted_text?: string | null
          grade?: string | null
          id?: string
          name: string
          questions?: Json | null
          subject: string
          total_marks: number
          uploaded_file_url?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string
          date?: string
          extracted_text?: string | null
          grade?: string | null
          id?: string
          name?: string
          questions?: Json | null
          subject?: string
          total_marks?: number
          uploaded_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          session_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          session_token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          center_id: string | null
          created_at: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          student_id: string | null
          teacher_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["app_role"]
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_outstanding"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "users_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_student_outstanding: {
        Row: {
          outstanding_total: number | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      generate_monthly_invoices_sql: {
        Args: {
          p_academic_year: string
          p_center_id: string
          p_due_in_days?: number
          p_late_fee_per_day?: number
          p_month: number
          p_year: number
        }
        Returns: {
          invoice_id: string
          invoice_number: string
          student_id: string
          student_name: string
          total_amount: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "center" | "parent" | "teacher"
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
      app_role: ["admin", "center", "parent", "teacher"],
    },
  },
} as const
