-- Create teachers table
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_number TEXT,
    email TEXT UNIQUE,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for teachers table
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Policies for teachers table
CREATE POLICY "Centers can view their own teachers" ON public.teachers
FOR SELECT USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Centers can insert their own teachers" ON public.teachers
FOR INSERT WITH CHECK (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Centers can update their own teachers" ON public.teachers
FOR UPDATE USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Centers can delete their own teachers" ON public.teachers
FOR DELETE USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

-- Create teacher_attendance table
CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
    time_in TIME WITHOUT TIME ZONE,
    time_out TIME WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (teacher_id, date) -- Ensure only one attendance record per teacher per day
);

-- Enable Row Level Security for teacher_attendance table
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_attendance table
CREATE POLICY "Teachers attendance can be viewed by center staff" ON public.teacher_attendance
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teachers WHERE id = teacher_id AND center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()))
);

CREATE POLICY "Teachers attendance can be inserted by center staff" ON public.teacher_attendance
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teachers WHERE id = teacher_id AND center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()))
);

CREATE POLICY "Teachers attendance can be updated by center staff" ON public.teacher_attendance
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teachers WHERE id = teacher_id AND center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()))
);

CREATE POLICY "Teachers attendance can be deleted by center staff" ON public.teacher_attendance
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teachers WHERE id = teacher_id AND center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()))
);

-- Update the 'tests' table to include a 'questions' JSONB column
ALTER TABLE public.tests
ADD COLUMN questions JSONB;

-- Update the 'test_results' table to include a 'question_marks' JSONB column
ALTER TABLE public.test_results
ADD COLUMN question_marks JSONB;

-- Update the 'student_chapters' table to include a 'notes' TEXT column
ALTER TABLE public.student_chapters
ADD COLUMN notes TEXT;

-- Drop existing foreign key constraint on student_chapters.chapter_id
ALTER TABLE public.student_chapters
DROP CONSTRAINT student_chapters_chapter_id_fkey;

-- Add new foreign key constraint on student_chapters.chapter_id referencing lesson_plans.id
ALTER TABLE public.student_chapters
ADD CONSTRAINT student_chapters_chapter_id_fkey
FOREIGN KEY (chapter_id) REFERENCES public.lesson_plans(id) ON DELETE CASCADE;