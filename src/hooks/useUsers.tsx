import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  auth_user_id?: string;
  tenant_id: string;
  school_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'vendor' | 'developer' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  phone?: string;
  date_of_birth?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching users:', error);
          setError(error.message);
          return;
        }

        setUsers(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { data: null, error };
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === id ? data : u));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }
  };

  return { users, loading, error, createUser, updateUser };
}