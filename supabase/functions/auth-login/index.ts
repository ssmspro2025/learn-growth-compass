import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user by username
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.password_hash);
    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Build user object with related data
    const user: any = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      center_id: userData.center_id,
      student_id: userData.student_id,
      teacher_id: userData.teacher_id,
    };

    // Fetch center name if center_id exists
    if (userData.center_id) {
      const { data: centerData } = await supabaseClient
        .from('centers')
        .select('center_name')
        .eq('id', userData.center_id)
        .single();
      
      if (centerData) {
        user.center_name = centerData.center_name;
      }
    }

    // Fetch student name if student_id exists
    if (userData.student_id) {
      const { data: studentData } = await supabaseClient
        .from('students')
        .select('name')
        .eq('id', userData.student_id)
        .single();
      
      if (studentData) {
        user.student_name = studentData.name;
      }
    }

    // Fetch teacher name if teacher_id exists
    if (userData.teacher_id) {
      const { data: teacherData } = await supabaseClient
        .from('teachers')
        .select('name')
        .eq('id', userData.teacher_id)
        .single();
      
      if (teacherData) {
        user.teacher_name = teacherData.name;
      }
    }

    // Fetch center feature permissions if role is center
    if (userData.role === 'center' && userData.center_id) {
      const { data: permissionsData } = await supabaseClient
        .from('center_feature_permissions')
        .select('feature_name, is_enabled')
        .eq('center_id', userData.center_id);
      
      if (permissionsData) {
        user.centerPermissions = permissionsData.reduce((acc, perm) => {
          acc[perm.feature_name] = perm.is_enabled;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // Fetch teacher feature permissions if role is teacher
    if (userData.role === 'teacher' && userData.teacher_id) {
      const { data: permissionsData } = await supabaseClient
        .from('teacher_feature_permissions')
        .select('feature_name, is_enabled')
        .eq('teacher_id', userData.teacher_id);
      
      if (permissionsData) {
        user.teacherPermissions = permissionsData.reduce((acc, perm) => {
          acc[perm.feature_name] = perm.is_enabled;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // Update last login
    await supabaseClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    return new Response(
      JSON.stringify({ success: true, user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
