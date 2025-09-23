import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  school_type: string;
  grade_range: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  current_enrollment: number;
  student_capacity?: number;
  tenant_id: string;
}

export function useSchools() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSchools([]);
      setLoading(false);
      return;
    }

    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching schools:', error);
          setError(error.message);
          return;
        }

        setSchools(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load schools');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [user]);

  const createSchool = async (schoolData: Omit<School, 'id' | 'tenant_id'>) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([{
          ...schoolData,
          tenant_id: '00000000-0000-0000-0000-000000000000' // Default tenant for now
        }])
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => [...prev, data]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating school:', error);
      return { data: null, error };
    }
  };

  return { schools, loading, error, createSchool };
}