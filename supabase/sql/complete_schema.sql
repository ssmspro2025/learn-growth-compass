-- ============================================================================
-- Complete Database Schema for TMS (Teaching Management System)
-- ============================================================================
-- This script contains all tables, relationships, RLS policies, indexes,
-- and admin user setup. Execute this in Supabase SQL Editor.
-- ============================================================================

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  school_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  time_in TIME,
  time_out TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create chapters_studied table
CREATE TABLE IF NOT EXISTS public.chapters_studied (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create centers table
CREATE TABLE IF NOT EXISTS public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_name TEXT NOT NULL,
  address TEXT,
  contact_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create app_role enum
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'center', 'parent');

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'center',
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tests table
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  total_marks INTEGER NOT NULL,
  grade TEXT,
  uploaded_file_url TEXT,
  extracted_text TEXT,
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_results table
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL,
  date_taken DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  student_answer TEXT,
  ai_suggested_marks INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_id, student_id)
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  date_taught DATE NOT NULL,
  notes TEXT,
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_chapters table
CREATE TABLE IF NOT EXISTS public.student_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT true,
  date_completed DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, chapter_id)
);

-- Create chapter_teachings table
CREATE TABLE IF NOT EXISTS public.chapter_teachings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  students_present JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ai_summaries table
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  generated_on TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  summary_text TEXT NOT NULL,
  summary_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- Enable Row Level Security on all tables
-- ============================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters_studied ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_teachings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies - Allow all operations (permissive for development)
-- ============================================================================

-- Students policies
CREATE POLICY "Allow all operations on students"
ON public.students FOR ALL USING (true) WITH CHECK (true);

-- Attendance policies
CREATE POLICY "Allow all operations on attendance"
ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- Chapters studied policies
CREATE POLICY "Allow all operations on chapters_studied"
ON public.chapters_studied FOR ALL USING (true) WITH CHECK (true);

-- Centers policies
CREATE POLICY "Allow all operations on centers"
ON public.centers FOR ALL USING (true) WITH CHECK (true);

-- Users policies
CREATE POLICY "Allow all operations on users"
ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Tests policies
CREATE POLICY "Allow all operations on tests"
ON public.tests FOR ALL USING (true) WITH CHECK (true);

-- Test results policies
CREATE POLICY "Allow all operations on test_results"
ON public.test_results FOR ALL USING (true) WITH CHECK (true);

-- Chapters policies
CREATE POLICY "Allow all operations on chapters"
ON public.chapters FOR ALL USING (true) WITH CHECK (true);

-- Student chapters policies
CREATE POLICY "Allow all operations on student_chapters"
ON public.student_chapters FOR ALL USING (true) WITH CHECK (true);

-- Chapter teachings policies
CREATE POLICY "Allow all operations on chapter_teachings"
ON public.chapter_teachings FOR ALL USING (true) WITH CHECK (true);

-- AI summaries policies
CREATE POLICY "Allow all operations on ai_summaries"
ON public.ai_summaries FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(grade);
CREATE INDEX IF NOT EXISTS idx_students_center ON public.students(center_id);

-- Chapters studied indexes
CREATE INDEX IF NOT EXISTS idx_chapters_studied_student_date ON public.chapters_studied(student_id, date);
CREATE INDEX IF NOT EXISTS idx_chapters_studied_date ON public.chapters_studied(date);

-- Test results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_student ON public.test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON public.test_results(test_id);

-- Student chapters indexes
CREATE INDEX IF NOT EXISTS idx_student_chapters_student ON public.student_chapters(student_id);
CREATE INDEX IF NOT EXISTS idx_student_chapters_chapter ON public.student_chapters(chapter_id);

-- Chapters indexes
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject);
CREATE INDEX IF NOT EXISTS idx_chapters_center ON public.chapters(center_id);

-- Tests indexes
CREATE INDEX IF NOT EXISTS idx_tests_date ON public.tests(date);
CREATE INDEX IF NOT EXISTS idx_tests_center ON public.tests(center_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_center ON public.users(center_id);

-- AI summaries indexes
CREATE INDEX IF NOT EXISTS idx_ai_summaries_student ON public.ai_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_date ON public.ai_summaries(generated_on DESC);

-- Chapter teachings indexes
CREATE INDEX IF NOT EXISTS idx_chapter_teachings_chapter ON public.chapter_teachings(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_teachings_date ON public.chapter_teachings(date);

-- ============================================================================
-- Storage Bucket for Test Files
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('test-files', 'test-files', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated uploads to test-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'test-files');

CREATE POLICY "Allow authenticated read from test-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'test-files');

CREATE POLICY "Allow authenticated delete from test-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'test-files');

-- ============================================================================
-- Admin User Setup
-- ============================================================================
-- IMPORTANT: The password hash below is for demonstration only.
-- Before using in production, generate a proper bcrypt hash using:
-- 1. Node.js: npx bcrypt-cli -c 12 "precioussn"
-- 2. Online tool: https://bcrypt-generator.com/ (use 10+ rounds)
-- 3. Python: python -c "import bcrypt; print(bcrypt.hashpw(b'precioussn', bcrypt.gensalt(rounds=12)).decode())"
--
-- Current hash is for password: precioussn (DO NOT use in production without hashing properly)
-- Hash format: $2b$12$... (bcrypt with 12 rounds)

INSERT INTO public.users (
  username, 
  password_hash, 
  role, 
  is_active
) VALUES (
  'sujan1nepal@gmail.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUryy1uK',
  'admin',
  true
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- Complete! Your database is now ready to use.
-- ============================================================================
-- Admin Credentials:
-- Username: sujan1nepal@gmail.com
-- Password: precioussn
--
-- To generate the correct bcrypt hash for the password, use one of these:
-- Node.js command: npx bcrypt-cli -c 12 "precioussn"
-- Python command: python -c "import bcrypt; print(bcrypt.hashpw(b'precioussn', bcrypt.gensalt(rounds=12)).decode())"
-- ============================================================================
