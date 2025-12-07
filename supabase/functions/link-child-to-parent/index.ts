import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { parent_user_id, student_id, action } = await req.json();

    if (!parent_user_id || !student_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parent user ID and student ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'unlink') {
      // Delete the link
      const { error } = await supabaseClient
        .from('parent_students')
        .delete()
        .eq('parent_user_id', parent_user_id)
        .eq('student_id', student_id);

      if (error) {
        console.error('Error unlinking child:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Child unlinked successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check if link already exists
    const { data: existingLink } = await supabaseClient
      .from('parent_students')
      .select('id')
      .eq('parent_user_id', parent_user_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingLink) {
      return new Response(
        JSON.stringify({ success: false, error: 'This child is already linked to this parent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create the link
    const { error } = await supabaseClient
      .from('parent_students')
      .insert({
        parent_user_id,
        student_id,
      });

    if (error) {
      console.error('Error linking child:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Successfully linked student ${student_id} to parent ${parent_user_id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Child linked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    console.error('Link child error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
