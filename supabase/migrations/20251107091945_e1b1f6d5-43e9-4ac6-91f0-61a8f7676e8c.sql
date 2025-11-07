-- Add time tracking to attendance table
ALTER TABLE public.attendance 
ADD COLUMN time_in time,
ADD COLUMN time_out time;

-- Create chapters_studied table
CREATE TABLE public.chapters_studied (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chapters_studied
ALTER TABLE public.chapters_studied ENABLE ROW LEVEL SECURITY;

-- Create policy for chapters_studied
CREATE POLICY "Allow all operations on chapters_studied"
ON public.chapters_studied
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_chapters_studied_student_date ON public.chapters_studied(student_id, date);
CREATE INDEX idx_chapters_studied_date ON public.chapters_studied(date);