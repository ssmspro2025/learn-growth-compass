"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Filter } from "lucide-react";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

interface MeetingAttendanceRecorderProps {
  meetingId: string;
  onClose: () => void;
}

type AttendanceStatus = "pending" | "present" | "absent" | "excused" | "invite";
// Define partial types for fetched data
type PartialStudent = Pick<Tables<'students'>, 'id' | 'name' | 'grade'>;
type PartialTeacher = Pick<Tables<'teachers'>, 'id' | 'name' | 'user_id'>;
type PartialUser = Pick<Tables<'users'>, 'id' | 'username' | 'role'>;

type MeetingAttendeeRow = Tables<'meeting_attendees'> & {
  students?: PartialStudent;
  teachers?: PartialTeacher;
  users?: PartialUser;
};

type DisplayParticipant = {
  id: string; // student_id or teacher_id
  name: string; // Student name or Teacher name
  parentName?: string; // Parent's username if applicable
  grade: string | null;
  type: 'student' | 'teacher';
};

export default function MeetingAttendanceRecorder({ meetingId, onClose }: MeetingAttendanceRecorderProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [attendeeStatuses, setAttendeeStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [gradeFilter, setGradeFilter] = useState("all");

  // Fetch meeting details to determine its type
  const { data: meetingDetails, isLoading: meetingDetailsLoading } = useQuery({
    queryKey: ["meeting-details-for-attendance", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("meeting_type")
        .eq("id", meetingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  // Fetch existing attendees for this meeting
  const { data: existingAttendees = [], isLoading: existingAttendeesLoading } = useQuery({
    queryKey: ["meeting-attendees", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_attendees")
        .select("*, students(id, name, grade), users(id, username, role), teachers(id, name, user_id)")
        .eq("meeting_id", meetingId);
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  // Derive the list of participants to display from existing attendees
  const displayParticipants = useMemo(() => {
    if (!meetingDetails || !existingAttendees) return [];

    let filtered: DisplayParticipant[] = [];

    if (meetingDetails.meeting_type === "parents" || meetingDetails.meeting_type === "general") {
      filtered = existingAttendees
        .filter(att => att.student_id && att.students)
        .map(att => ({
          id: att.student_id!,
          name: att.students!.name, // Student's name
          parentName: att.users?.username, // Parent's username
          grade: att.students!.grade,
          type: 'student'
        }));
    } else if (meetingDetails.meeting_type === "teachers") {
      filtered = existingAttendees
        .filter(att => att.teacher_id && att.teachers)
        .map(att => ({
          id: att.teacher_id!,
          name: att.teachers!.name,
          grade: null, // Teachers don't have grades in this context
          type: 'teacher'
        }));
    }

    // Apply grade filter if it's a student-related meeting type
    if ((meetingDetails.meeting_type === "parents" || meetingDetails.meeting_type === "general") && gradeFilter !== "all") {
      filtered = filtered.filter(p => p.grade === gradeFilter);
    }

    return filtered;
  }, [existingAttendees, meetingDetails, gradeFilter]);

  // Derive unique grades for the filter dropdown from existing attendees
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    existingAttendees.forEach(att => {
      if (att.students?.grade) {
        grades.add(att.students.grade);
      }
    });
    return Array.from(grades).sort();
  }, [existingAttendees]);

  useEffect(() => {
    const initialStatuses: Record<string, AttendanceStatus> = {};
    
    // First, initialize all display participants with 'pending'
    displayParticipants.forEach(participant => {
      initialStatuses[participant.id] = "pending";
    });

    // Then, override with actual attendance status from existing records
    existingAttendees.forEach((attendee) => {
      let participantId: string | undefined;
      if (attendee.student_id) participantId = attendee.student_id;
      else if (attendee.teacher_id) participantId = attendee.teacher_id;

      if (participantId && initialStatuses[participantId]) {
        initialStatuses[participantId] = (attendee.attendance_status as AttendanceStatus) || "pending";
      }
    });
    setAttendeeStatuses(initialStatuses);
  }, [existingAttendees, displayParticipants]);

  const updateAttendanceMutation = useMutation({
    mutationFn: async () => {
      const recordsToUpsert: TablesInsert<'meeting_attendees'>[] = [];
      
      for (const participant of displayParticipants) {
        const attendance_status = attendeeStatuses[participant.id] ?? "pending";
        const attended = attendance_status === "present";
        
        const existingAttendeeRecord = existingAttendees.find((ea) => 
          (participant.type === 'student' && ea.student_id === participant.id) ||
          (participant.type === 'teacher' && ea.teacher_id === participant.id)
        );

        const baseRecord: TablesInsert<'meeting_attendees'> = {
          meeting_id: meetingId,
          attended,
          attendance_status,
          notes: existingAttendeeRecord?.notes || null, // Preserve existing notes if any
        };

        if (participant.type === 'student') {
          const parentUser = existingAttendeeRecord?.users;
          Object.assign(baseRecord, { student_id: participant.id, user_id: parentUser?.id || null, teacher_id: null });
        } else if (participant.type === 'teacher') {
          const teacherUser = existingAttendeeRecord?.users;
          Object.assign(baseRecord, { teacher_id: participant.id, user_id: teacherUser?.id || null, student_id: null });
        }

        if (existingAttendeeRecord) {
          recordsToUpsert.push({ id: existingAttendeeRecord.id, ...baseRecord });
        } else {
          recordsToUpsert.push(baseRecord);
        }
      }

      if (recordsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from("meeting_attendees").upsert(recordsToUpsert, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attendees", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Attendance updated successfully!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attendance");
    },
  });

  const handleStatusChange = (id: string, status: AttendanceStatus) => {
    setAttendeeStatuses(prev => ({ ...prev, [id]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newStatuses: Record<string, AttendanceStatus> = {};
    displayParticipants.forEach(p => newStatuses[p.id] = status);
    setAttendeeStatuses(newStatuses);
  };

  if (meetingDetailsLoading || existingAttendeesLoading) {
    return <p>Loading attendees...</p>;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => markAll("present")}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark All Present
        </Button>
        <Button variant="outline" size="sm" onClick={() => markAll("absent")}>
          <XCircle className="h-4 w-4 mr-1" /> Mark All Absent
        </Button>
      </div>

      {(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-x-auto max-h-96 border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              {(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') ? <TableHead>Student Grade</TableHead> : null}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') ? 3 : 2} className="text-center text-muted-foreground">No participants found</TableCell>
              </TableRow>
            ) : (
              displayParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    {participant.type === 'student' && participant.parentName
                      ? participant.parentName // Display only parent's username
                      : participant.name}
                  </TableCell>
                  {(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') ? <TableCell>{participant.grade}</TableCell> : null}
                  <TableCell>
                    <Select
                      value={attendeeStatuses[participant.id] || "pending"}
                      onValueChange={(value) => handleStatusChange(participant.id, value as AttendanceStatus)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invite">Invite</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={updateAttendanceMutation.isPending}>Cancel</Button>
        <Button onClick={() => updateAttendanceMutation.mutate()} disabled={updateAttendanceMutation.isPending}>
          {updateAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
}