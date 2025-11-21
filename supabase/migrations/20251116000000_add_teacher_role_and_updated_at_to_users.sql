-- Add 'teacher' to the app_role enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND enum_range('app_role'::regtype) @> 'teacher'::app_role) THEN
        ALTER TYPE public.app_role ADD VALUE 'teacher';
    END IF;
END $$;

-- Add teacher_id column to users table
ALTER TABLE public.users
ADD COLUMN teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Add updated_at column to users table
ALTER TABLE public.users
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the update_updated_at_column function on users table
CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();