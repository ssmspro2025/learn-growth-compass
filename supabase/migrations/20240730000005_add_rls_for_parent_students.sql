-- Enable RLS for parent_students table
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Policy to allow center users to insert parent_students records
CREATE POLICY "Center users can link parents to students within their center"
ON public.parent_students
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if the current user is a 'center' role
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'center'
    AND
    -- Check if the parent_user_id belongs to a parent in the same center as the current user
    EXISTS (
        SELECT 1
        FROM public.users AS pu
        WHERE pu.id = parent_user_id
          AND pu.role = 'parent'
          AND pu.center_id = (SELECT center_id FROM public.users WHERE id = auth.uid())
    )
    AND
    -- Check if the student_id belongs to a student in the same center as the current user
    EXISTS (
        SELECT 1
        FROM public.students AS s
        WHERE s.id = student_id
          AND s.center_id = (SELECT center_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy to allow parents to view their linked students
CREATE POLICY "Parents can view their linked students"
ON public.parent_students
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'parent'
    AND
    parent_user_id = auth.uid()
);

-- Policy to allow center users to view all parent_students records within their center
CREATE POLICY "Center users can view all parent_students within their center"
ON public.parent_students
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'center'
    AND
    EXISTS (
        SELECT 1
        FROM public.users AS cu
        WHERE cu.id = auth.uid()
          AND cu.center_id = (SELECT center_id FROM public.students WHERE id = student_id)
    )
);