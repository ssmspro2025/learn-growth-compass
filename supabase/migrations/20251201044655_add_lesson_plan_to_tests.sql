-- Add lesson_plan_id column to tests table (nullable, so tests can be independent)
ALTER TABLE public.tests ADD COLUMN lesson_plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_tests_lesson_plan ON public.tests(lesson_plan_id);
