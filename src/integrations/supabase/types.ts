[?25l[?2004h
                                                                                               
  >  1. ufybwqmxafdkxdfzynhy [name: ssmspro, org: kgymfifmvxbixtycsynp, region: ap-southeast-1]
    2. msekkmxlrqnolbxqgznz [name: classms, org: kgymfifmvxbixtycsynp, region: ap-southeast-2] 
                                                                                               
                                                                                               
                                                                                               
                                                                                               
    ↑/k up • ↓/j down • / filter • q quit • ? more                                             
                                                                                               [9A [J[2K[?2004l[?25h[?1002l[?1003l[?1006lexport type Json =
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
      academic_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string | null
          attachments: Json | null
          class_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          points_possible: number | null
          rubric: Json | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string | null
          attachments?: Json | null
          class_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          points_possible?: number | null
          rubric?: Json | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string | null
          attachments?: Json | null
          class_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          points_possible?: number | null
          rubric?: Json | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string | null
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          created_at: string | null
          enrollment_date: string | null
          final_grade: string | null
          id: string
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          enrollment_date?: string | null
          final_grade?: string | null
          id?: string
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          enrollment_date?: string | null
          final_grade?: string | null
          id?: string
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year_id: string
          created_at: string | null
          current_enrollment: number | null
          grade_level_id: string
          id: string
          max_students: number | null
          name: string
          room_number: string | null
          schedule: Json | null
          school_id: string
          section: string | null
          subject_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          current_enrollment?: number | null
          grade_level_id: string
          id?: string
          max_students?: number | null
          name: string
          room_number?: string | null
          schedule?: Json | null
          school_id: string
          section?: string | null
          subject_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          current_enrollment?: number | null
          grade_level_id?: string
          id?: string
          max_students?: number | null
          name?: string
          room_number?: string | null
          schedule?: Json | null
          school_id?: string
          section?: string | null
          subject_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          created_at: string | null
          exam_id: string
          feedback: string | null
          grade: string | null
          id: string
          percentage: number | null
          points_earned: number | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exam_id: string
          feedback?: string | null
          grade?: string | null
          id?: string
          percentage?: number | null
          points_earned?: number | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string
          feedback?: string | null
          grade?: string | null
          id?: string
          percentage?: number | null
          points_earned?: number | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          exam_date: string | null
          exam_type: string | null
          id: string
          instructions: string | null
          teacher_id: string
          title: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          exam_date?: string | null
          exam_type?: string | null
          id?: string
          instructions?: string | null
          teacher_id: string
          title: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          exam_date?: string | null
          exam_type?: string | null
          id?: string
          instructions?: string | null
          teacher_id?: string
          title?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          amount: number
          created_at: string | null
          due_date: string | null
          fee_category_id: string
          grade_level_id: string | null
          id: string
          late_fee_amount: number | null
          late_fee_days: number | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          amount: number
          created_at?: string | null
          due_date?: string | null
          fee_category_id: string
          grade_level_id?: string | null
          id?: string
          late_fee_amount?: number | null
          late_fee_days?: number | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          amount?: number
          created_at?: string | null
          due_date?: string | null
          fee_category_id?: string
          grade_level_id?: string | null
          id?: string
          late_fee_amount?: number | null
          late_fee_days?: number | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          created_at: string | null
          description: string | null
          grade_number: number
          id: string
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grade_number: number
          id?: string
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grade_number?: number
          id?: string
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_levels_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      message_participants: {
        Row: {
          id: string
          joined_at: string | null
          last_read_at: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_announcement: boolean | null
          priority: Database["public"]["Enums"]["message_priority"] | null
          school_id: string
          subject: string
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_announcement?: boolean | null
          priority?: Database["public"]["Enums"]["message_priority"] | null
          school_id: string
          subject: string
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_announcement?: boolean | null
          priority?: Database["public"]["Enums"]["message_priority"] | null
          school_id?: string
          subject?: string
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["message_priority"] | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["message_priority"] | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["message_priority"] | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          created_at: string | null
          id: string
          is_guardian: boolean | null
          occupation: string | null
          relationship: string | null
          school_id: string
          updated_at: string | null
          user_id: string
          work_phone: string | null
          workplace: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_guardian?: boolean | null
          occupation?: string | null
          relationship?: string | null
          school_id: string
          updated_at?: string | null
          user_id: string
          work_phone?: string | null
          workplace?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_guardian?: boolean | null
          occupation?: string | null
          relationship?: string | null
          school_id?: string
          updated_at?: string | null
          user_id?: string
          work_phone?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          fee_structure_id: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          processed_by: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          student_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          fee_structure_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          processed_by?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          fee_structure_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          processed_by?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          accreditation: string | null
          address: string
          created_at: string | null
          current_enrollment: number | null
          email: string
          established_date: string | null
          grade_range: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string
          principal_id: string | null
          school_type: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["school_status"] | null
          student_capacity: number | null
          tenant_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accreditation?: string | null
          address: string
          created_at?: string | null
          current_enrollment?: number | null
          email: string
          established_date?: string | null
          grade_range?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone: string
          principal_id?: string | null
          school_type?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["school_status"] | null
          student_capacity?: number | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accreditation?: string | null
          address?: string
          created_at?: string | null
          current_enrollment?: number | null
          email?: string
          established_date?: string | null
          grade_range?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string
          principal_id?: string | null
          school_type?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["school_status"] | null
          student_capacity?: number | null
          tenant_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_schools_principal_id"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          can_pickup: boolean | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          parent_id: string
          relationship: string
          student_id: string
        }
        Insert: {
          can_pickup?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id: string
          relationship: string
          student_id: string
        }
        Update: {
          can_pickup?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string
          relationship?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_date: string | null
          attendance_percentage: number | null
          created_at: string | null
          credits_earned: number | null
          gpa: number | null
          grade_level_id: string
          graduation_date: string | null
          id: string
          medical_info: Json | null
          school_id: string
          student_id: string
          transportation_info: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admission_date?: string | null
          attendance_percentage?: number | null
          created_at?: string | null
          credits_earned?: number | null
          gpa?: number | null
          grade_level_id: string
          graduation_date?: string | null
          id?: string
          medical_info?: Json | null
          school_id: string
          student_id: string
          transportation_info?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admission_date?: string | null
          attendance_percentage?: number | null
          created_at?: string | null
          credits_earned?: number | null
          gpa?: number | null
          grade_level_id?: string
          graduation_date?: string | null
          id?: string
          medical_info?: Json | null
          school_id?: string
          student_id?: string
          transportation_info?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          credits: number | null
          department: string | null
          description: string | null
          id: string
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          credits?: number | null
          department?: string | null
          description?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number | null
          department?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          certifications: Json | null
          contract_type: string | null
          created_at: string | null
          department: string | null
          employee_id: string
          hire_date: string | null
          id: string
          qualifications: Json | null
          salary: number | null
          school_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certifications?: Json | null
          contract_type?: string | null
          created_at?: string | null
          department?: string | null
          employee_id: string
          hire_date?: string | null
          id?: string
          qualifications?: Json | null
          salary?: number | null
          school_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certifications?: Json | null
          contract_type?: string | null
          created_at?: string | null
          department?: string | null
          employee_id?: string
          hire_date?: string | null
          id?: string
          qualifications?: Json | null
          salary?: number | null
          school_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          max_schools: number | null
          max_users: number | null
          name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          settings: Json | null
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_schools?: number | null
          max_users?: number | null
          name: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          settings?: Json | null
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_schools?: number | null
          max_users?: number | null
          name?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          settings?: Json | null
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          auth_user_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact: Json | null
          first_name: string
          gender: string | null
          id: string
          last_login: string | null
          last_name: string
          phone: string | null
          preferences: Json | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["role"]
          school_id: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact?: Json | null
          first_name: string
          gender?: string | null
          id?: string
          last_login?: string | null
          last_name: string
          phone?: string | null
          preferences?: Json | null
          profile_image_url?: string | null
          role: Database["public"]["Enums"]["role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact?: Json | null
          first_name?: string
          gender?: string | null
          id?: string
          last_login?: string | null
          last_name?: string
          phone?: string | null
          preferences?: Json | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_demo_schools_and_users: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_school: { Args: { user_uuid?: string }; Returns: string }
      grant_super_admin_permissions: { Args: never; Returns: undefined }
      is_super_admin: { Args: { user_uuid?: string }; Returns: boolean }
      setup_real_super_admin: {
        Args: { auth_user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      assignment_status: "draft" | "published" | "archived"
      attendance_status: "present" | "absent" | "late" | "excused"
      message_priority: "low" | "normal" | "high" | "urgent"
      payment_status:
        | "pending"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "refunded"
        | "cancelled"
      plan_tier: "free" | "basic" | "premium"
      role: "admin" | "school_admin" | "teacher" | "student" | "parent"
      school_status: "active" | "inactive" | "pending"
      submission_status: "not_submitted" | "submitted" | "graded"
      user_role:
        | "admin"
        | "principal"
        | "teacher"
        | "student"
        | "parent"
        | "vendor"
        | "developer"
        | "super_admin"
      user_status: "active" | "inactive" | "suspended"
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
      assignment_status: ["draft", "published", "archived"],
      attendance_status: ["present", "absent", "late", "excused"],
      message_priority: ["low", "normal", "high", "urgent"],
      payment_status: [
        "pending",
        "paid",
        "partially_paid",
        "overdue",
        "refunded",
        "cancelled",
      ],
      plan_tier: ["free", "basic", "premium"],
      role: ["admin", "school_admin", "teacher", "student", "parent"],
      school_status: ["active", "inactive", "pending"],
      submission_status: ["not_submitted", "submitted", "graded"],
      user_role: [
        "admin",
        "principal",
        "teacher",
        "student",
        "parent",
        "vendor",
        "developer",
        "super_admin",
      ],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
