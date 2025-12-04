import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId, meetingType, selectedStudentIds, selectedTeacherIds } = await req.json();

    if (!meetingId || !meetingType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meeting ID and type are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, clear all existing attendees for this meeting to ensure a clean slate
    const { error: deleteError } = await supabase.from('meeting_attendees').delete().eq('meeting_id', meetingId);
    if (deleteError) throw deleteError;

    const attendeesToInsert: Array<{
      meeting_id: string;
      student_id?: string | null;
      teacher_id?: string | null;
      user_id?: string | null;
      attendance_status: string;
      attended: boolean;
    }> = [];

    if (meetingType === 'parents' && selectedStudentIds && selectedStudentIds.length > 0) {
      // Fetch parent_user_ids linked to the selected students via parent_students table
      const { data: parentStudentLinks, error: linksError } = await supabase
        .from('parent_students')
        .select('parent_user_id, student_id')
        .in('student_id', selectedStudentIds);

      if (linksError) throw linksError;

      const studentToParentMap = new Map<string, string>();
      parentStudentLinks.forEach(link => {
        if (link.student_id && link.parent_user_id) {
          studentToParentMap.set(link.student_id, link.parent_user_id);
        }
      });

      selectedStudentIds.forEach((studentId: string) => {
        const parentUserId = studentToParentMap.get(studentId);
        if (parentUserId) {
          attendeesToInsert.push({
            meeting_id: meetingId,
            student_id: studentId,
            user_id: parentUserId,
            attendance_status: 'invite', // Default status for new invites
            attended: false,
          });
        } else {
          console.warn(`No parent user found for student ID: ${studentId}. Skipping attendee creation.`);
        }
      });

    } else if (meetingType === 'teachers' && selectedTeacherIds && selectedTeacherIds.length > 0) {
      // Fetch teacher user IDs for the selected teachers
      const { data: teacherUsers, error: teacherUserError } = await supabase
        .from('users')
        .select('id, teacher_id')
        .in('teacher_id', selectedTeacherIds)
        .eq('role', 'teacher');

      if (teacherUserError) throw teacherUserError;

      teacherUsers.forEach(tu => {
        if (tu.teacher_id) {
          attendeesToInsert.push({
            meeting_id: meetingId,
            teacher_id: tu.teacher_id,
            user_id: tu.id,
            attendance_status: 'invite', // Default status for new invites
            attended: false,
          });
        }
      });
    }

    // Insert all new attendees
    if (attendeesToInsert.length > 0) {
      const { error: attendeeInsertError } = await supabase.from('meeting_attendees').insert(attendeesToInsert);
      if (attendeeInsertError) throw attendeeInsertError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Meeting attendees linked successfully.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Link meeting attendees error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to link meeting attendees';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});