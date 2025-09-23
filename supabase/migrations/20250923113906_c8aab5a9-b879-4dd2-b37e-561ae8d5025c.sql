-- Fix critical security issues by adding basic RLS policies for all tables

-- First, ensure RLS is enabled on all tables that were missing it
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE auth_user_id = user_uuid;
$$;

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = user_uuid AND role = 'super_admin'
  );
$$;

-- Create helper function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM users WHERE auth_user_id = user_uuid;
$$;

-- Add basic RLS policies for all tables

-- Academic Years - accessible by school members
CREATE POLICY "School members can access academic years" ON academic_years
FOR ALL USING (
  public.is_super_admin() OR 
  school_id = public.get_user_school()
);

-- Assignments - teachers can manage their assignments, students can view assigned ones
CREATE POLICY "Teachers can manage their assignments" ON assignments
FOR ALL USING (
  public.is_super_admin() OR
  teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM class_enrollments ce 
    JOIN classes c ON ce.class_id = c.id 
    WHERE c.id = assignments.class_id 
    AND ce.student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Assignment Submissions - students can manage their own, teachers can view/grade
CREATE POLICY "Students and teachers can access submissions" ON assignment_submissions
FOR ALL USING (
  public.is_super_admin() OR
  student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM assignments a 
    WHERE a.id = assignment_submissions.assignment_id 
    AND a.teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Attendance - teachers can manage, students/parents can view own
CREATE POLICY "School members can access attendance" ON attendance
FOR ALL USING (
  public.is_super_admin() OR
  public.get_user_role() IN ('admin', 'principal', 'teacher') OR
  student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM student_parents sp 
    WHERE sp.student_id = attendance.student_id 
    AND sp.parent_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Audit Logs - super admin and admins only
CREATE POLICY "Admins can access audit logs" ON audit_logs
FOR ALL USING (
  public.is_super_admin() OR
  public.get_user_role() IN ('admin', 'principal')
);

-- Classes - school members can access
CREATE POLICY "School members can access classes" ON classes
FOR ALL USING (
  public.is_super_admin() OR
  school_id = public.get_user_school()
);

-- Class Enrollments - school members can access
CREATE POLICY "School members can access enrollments" ON class_enrollments
FOR ALL USING (
  public.is_super_admin() OR
  student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND school_id = public.get_user_school())
);

-- Exams - teachers can manage their exams, students can view assigned ones
CREATE POLICY "Teachers and students can access exams" ON exams
FOR ALL USING (
  public.is_super_admin() OR
  teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM class_enrollments ce 
    JOIN classes c ON ce.class_id = c.id 
    WHERE c.id = exams.class_id 
    AND ce.student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Exam Results - students can view their own, teachers can manage
CREATE POLICY "Students and teachers can access exam results" ON exam_results
FOR ALL USING (
  public.is_super_admin() OR
  student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM exams e 
    WHERE e.id = exam_results.exam_id 
    AND e.teacher_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Fee Categories - school admins can manage
CREATE POLICY "School admins can manage fee categories" ON fee_categories
FOR ALL USING (
  public.is_super_admin() OR
  (school_id = public.get_user_school() AND public.get_user_role() IN ('admin', 'principal'))
);

-- Fee Structures - school admins can manage
CREATE POLICY "School admins can manage fee structures" ON fee_structures
FOR ALL USING (
  public.is_super_admin() OR
  (school_id = public.get_user_school() AND public.get_user_role() IN ('admin', 'principal'))
);

-- Grade Levels - school members can access
CREATE POLICY "School members can access grade levels" ON grade_levels
FOR ALL USING (
  public.is_super_admin() OR
  school_id = public.get_user_school()
);

-- Messages - participants can access
CREATE POLICY "Participants can access messages" ON messages
FOR ALL USING (
  public.is_super_admin() OR
  sender_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM message_participants mp 
    WHERE mp.thread_id = messages.thread_id 
    AND mp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Message Threads - participants can access
CREATE POLICY "Participants can access message threads" ON message_threads
FOR ALL USING (
  public.is_super_admin() OR
  created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM message_participants mp 
    WHERE mp.thread_id = message_threads.id 
    AND mp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Message Participants - users can access their own participation
CREATE POLICY "Users can access their message participation" ON message_participants
FOR ALL USING (
  public.is_super_admin() OR
  user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Notifications - users can access their own
CREATE POLICY "Users can access their notifications" ON notifications
FOR ALL USING (
  public.is_super_admin() OR
  user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Parents - parents can access their own data
CREATE POLICY "Parents can access their data" ON parents
FOR ALL USING (
  public.is_super_admin() OR
  user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  (school_id = public.get_user_school() AND public.get_user_role() IN ('admin', 'principal', 'teacher'))
);

-- Payment Transactions - school staff and related parents/students can access
CREATE POLICY "Authorized users can access payments" ON payment_transactions
FOR ALL USING (
  public.is_super_admin() OR
  student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM student_parents sp 
    WHERE sp.student_id = payment_transactions.student_id 
    AND sp.parent_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ) OR
  (public.get_user_role() IN ('admin', 'principal') AND 
   EXISTS (SELECT 1 FROM students s WHERE s.id = payment_transactions.student_id AND s.school_id = public.get_user_school()))
);

-- Students - students can access their own data, school staff can access school students
CREATE POLICY "Authorized users can access student data" ON students
FOR ALL USING (
  public.is_super_admin() OR
  user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  (school_id = public.get_user_school() AND public.get_user_role() IN ('admin', 'principal', 'teacher')) OR
  EXISTS (
    SELECT 1 FROM student_parents sp 
    WHERE sp.student_id = students.id 
    AND sp.parent_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Student Parents - parents and school staff can access
CREATE POLICY "Parents and school staff can access relationships" ON student_parents
FOR ALL USING (
  public.is_super_admin() OR
  parent_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  student_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = student_parents.student_id 
    AND s.school_id = public.get_user_school() 
    AND public.get_user_role() IN ('admin', 'principal', 'teacher')
  )
);

-- Subjects - school members can access
CREATE POLICY "School members can access subjects" ON subjects
FOR ALL USING (
  public.is_super_admin() OR
  school_id = public.get_user_school()
);

-- Teachers - teachers can access their own data, school staff can access school teachers
CREATE POLICY "Authorized users can access teacher data" ON teachers
FOR ALL USING (
  public.is_super_admin() OR
  user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  (school_id = public.get_user_school() AND public.get_user_role() IN ('admin', 'principal', 'teacher'))
);

-- User Permissions - users can view their own, super admin can manage all
CREATE POLICY "Users can access permissions" ON user_permissions
FOR ALL USING (
  public.is_super_admin() OR
  user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Fix function search path issues
ALTER FUNCTION public.create_demo_schools_and_users() SET search_path = public;
ALTER FUNCTION public.grant_super_admin_permissions() SET search_path = public;
ALTER FUNCTION public.setup_real_super_admin(uuid) SET search_path = public;
ALTER FUNCTION public.setup_super_admin_after_signup() SET search_path = public;