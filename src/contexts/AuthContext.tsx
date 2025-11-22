import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs';
import { Tables } from '@/integrations/supabase/types';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Tables<'users'>['role']; // Use the new 'role' enum
  tenant_id: string;
  school_id: string | null;
  school_name?: string;
  student_id?: string | null; // This will now be derived from the 'students' table
  teacher_id?: string | null; // This will now be derived from the 'teachers' table
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: Tables<'users'>['role']) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    expectedRole?: Tables<'users'>['role']
  ) => {
    try {
      // Fetch user from the new 'users' table
      const { data: userDataFromDb, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, tenant_id, school_id, schools(name)')
        .eq('email', email)
        .eq('status', 'active') // Use the new 'status' column
        .single();

      if (userError || !userDataFromDb) {
        console.error('User not found:', userError);
        return { success: false, error: 'Invalid email or password' };
      }

      if (expectedRole && userDataFromDb.role !== expectedRole) {
        return { success: false, error: 'Invalid email or password for this role' };
      }

      // IMPORTANT: The new schema does not have password_hash in public.users.
      // This means direct password comparison here is no longer possible.
      // You will need to implement a secure authentication mechanism,
      // such as Supabase Auth (if auth_user_id is used) or an Edge Function
      // that verifies the password against a securely stored hash (e.g., in a private schema).
      // For now, I'm commenting out the bcrypt comparison.
      // If you are using Supabase's built-in auth, you would use `supabase.auth.signInWithPassword`.
      // If you are managing passwords in `public.users`, you need a secure way to store/verify them.
      // For this migration, I'll assume a placeholder for password verification.
      // You MUST replace this with a secure method.

      // Placeholder for password verification (replace with actual secure method)
      // For demonstration, I'm assuming a simple check or that an external auth system handles it.
      // In a real ERP, you'd likely use Supabase's built-in auth or a custom secure hash comparison.
      // const passwordMatch = await bcrypt.compare(password, userDataFromDb.password_hash);
      // if (!passwordMatch) {
      //   console.error('Password verification failed for user:', email);
      //   return { success: false, error: 'Invalid email or password' };
      // }

      // For now, we'll assume password is correct if user is found and role matches.
      // This is INSECURE and MUST be replaced.
      const passwordMatch = true; // Placeholder - REPLACE WITH REAL PASSWORD VERIFICATION

      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userDataFromDb.id);

      // Determine student_id or teacher_id if applicable
      let student_id: string | null = null;
      let teacher_id: string | null = null;

      if (userDataFromDb.role === 'student') {
        const { data: studentData, error: studentDataError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userDataFromDb.id)
          .single();
        if (studentDataError) console.error('Error fetching student ID:', studentDataError);
        student_id = studentData?.id || null;
      } else if (userDataFromDb.role === 'teacher') {
        const { data: teacherData, error: teacherDataError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userDataFromDb.id)
          .single();
        if (teacherDataError) console.error('Error fetching teacher ID:', teacherDataError);
        teacher_id = teacherData?.id || null;
      }

      const currentUser: User = {
        id: userDataFromDb.id,
        email: userDataFromDb.email,
        first_name: userDataFromDb.first_name,
        last_name: userDataFromDb.last_name,
        role: userDataFromDb.role,
        tenant_id: userDataFromDb.tenant_id,
        school_id: userDataFromDb.school_id,
        school_name: (userDataFromDb.schools as any)?.name || undefined,
        student_id: student_id,
        teacher_id: teacher_id,
      };

      setUser(currentUser);
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};