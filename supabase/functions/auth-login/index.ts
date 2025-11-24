import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import * as bcrypt from "bcryptjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, password_hash, centers(center_name), students(name), teachers(name)')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.error('User not found or inactive:', userError?.message || 'No user data');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 2. Verify password using bcryptjs
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      console.log('Password verification failed for user:', username);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 3. Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 4. Fetch permissions if user is a center or teacher
    let centerPermissions: Record<string, boolean> | undefined;
    let teacherPermissions: Record<string, boolean> | undefined;

    if (user.role === 'center' && user.center_id) {
      const { data: permissions, error } = await supabase
        .from('center_feature_permissions')
        .select('feature_name, is_enabled')
        .eq('center_id', user.center_id);
      if (error) console.error('Error fetching center permissions:', error);
      centerPermissions = permissions?.reduce((acc, p) => ({ ...acc, [p.feature_name]: p.is_enabled }), {});
    } else if (user.role === 'teacher' && user.teacher_id) {
      const { data: permissions, error } = await supabase
        .from('teacher_feature_permissions')
        .select('feature_name, is_enabled')
        .eq('teacher_id', user.teacher_id);
      if (error) console.error('Error fetching teacher permissions:', error);
      teacherPermissions = permissions?.reduce((acc, p) => ({ ...acc, [p.feature_name]: p.is_enabled }), {});
    }

    // 5. Construct currentUser object to send back
    const currentUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      tenant_id: user.tenant_id,
      center_id: user.center_id,
      center_name: user.centers?.center_name || null,
      student_id: user.student_id,
      student_name: user.students?.name || null,
      teacher_id: user.teacher_id,
      teacher_name: user.teachers?.name || null,
      centerPermissions,
      teacherPermissions,
    };

    return new Response(
      JSON.stringify({ success: true, user: currentUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Auth login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Authentication failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});