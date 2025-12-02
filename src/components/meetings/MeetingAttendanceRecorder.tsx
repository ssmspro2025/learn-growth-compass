"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, XCircle, MinusCircle, Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Meeting = Tables<'meetings'>;
type MeetingAttendee = Tables<'meeting_attendees'>;
type Student = Tables<'students'>;
type Teacher = Tables<'teachers'>;

interface MeetingAttendanceRecorderProps {
  meetingId: string;
  meetingType: Meeting['meeting_type'];
  onClose: () => void;
}

export default function MeetingAttendanceRecorder({ meetingId, meetingType, onClose }: MeetingAttendanceRecorderProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [attendeeStatuses, setAttendeeStatuses] = useState<Record<string, MeetingAttendee['attendance_status']>>({});
  const [attendeeNotes, setAttendeeNotes] = useState<Record<string, string>>({});

  // Fetch all potential attendees (students/teachers) for the center
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["all-students-for-attendance", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase.from("students").select("id, name").eq("center_id", user.center_id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && (meetingType === 'parents' || meetingType === 'both'),
  });

  const { data: allTeachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["all-teachers-for-attendance", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase.from("teachers").select("id, name").eq("center_id", user.center_id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && (meetingType === 'teachers' || meetingType === 'both'),
  });

  // Fetch existing attendance records for this meeting
  const { data: existingAttendees = [], isLoading: existingAttendeesLoading } = useQuery({
    queryKey: ["meeting-attendees", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_attendees")
        .select("*, students(name), teachers(name), users(username)")
        .eq("meeting_id", meetingId);
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  useEffect(() => {
    const initialStatuses: Record<string, MeetingAttendee['attendance_status']> = {};
    const initialNotes: Record<string, string> = {};

    // Initialize with existing data
    existingAttendees.forEach((attendee: any) => {
      const key = attendee.student_id || attendee.teacher_id || attendee.user_id;
      if (key) {
        initialStatuses[key] = attendee.attendance_status;
        initialNotes[key] = attendee.notes || '';
      }
    });

    // Add any new students/teachers who are not yet in attendees
    if (meetingType === 'parents' || meetingType === 'both') {
      allStudents.forEach(student => {
        if (!existingAttendees.some((ea: any) => ea.student_id === student.id)) {
          initialStatuses[student.id] = 'pending';
          initialNotes[student.id] = '';
        }
      });
    }
    if (meetingType === 'teachers' || meetingType === 'both') {
      allTeachers.forEach(teacher => {
        if (!existingAttendees.some((ea: any) => ea.teacher_id === teacher.id)) {
          initialStatuses[teacher.id] = 'pending';
          initialNotes[teacher.id] = '';
        }
      });
    }

    setAttendeeStatuses(initialStatuses);
    setAttendeeNotes(initialNotes);
  }, [existingAttendees, allStudents, allTeachers, meetingType]);

  const updateAttendanceMutation = useMutation({
    mutationFn: async () => {
      const updates: Tables<'meeting_attendees'>['Insert'][] = [];
      const existingAttendeeIds = new Set(existingAttendees.map((ea: any) => ea.student_id || ea.teacher_id || ea.user_id));

      // Prepare updates for existing attendees and inserts for new ones
      if (meetingType === 'parents' || meetingType === 'both') {
        allStudents.forEach(student => {
          const status = attendeeStatuses[student.id] || 'pending';
          const notes = attendeeNotes[student.id] || null;
          const existingRecord = existingAttendees.find((ea: any) => ea.student_id === student.id);

          if (existingRecord) {
            // Update existing record
            updates.push({
              id: existingRecord.id,
              meeting_id: meetingId,
              student_id: student.id,
              attendance_status: status,
              notes: notes,
              updated_at: new Date().toISOString(),
            });
          } else {
            // Insert new record
            updates.push({
              meeting_id: meetingId,
              student_id: student.id,
              attendance_status: status,
              notes: notes,
            });
          }
        });
      }

      if (meetingType === 'teachers' || meetingType === 'both') {
        allTeachers.forEach(teacher => {
          const status = attendeeStatuses[teacher.id] || 'pending';
          const notes = attendeeNotes[teacher.id] || null;
          const existingRecord = existingAttendees.find((ea: any) => ea.teacher_id === teacher.id);

          if (existingRecord) {
            // Update existing record
            updates.push({
              id: existingRecord.id,
              meeting_id: meetingId,
              teacher_id: teacher.id,
              attendance_status: status,
              notes: notes,
              updated_at: new Date().toISOString(),
            });
          } else {
            // Insert new record
            updates.push({
              meeting_id: meetingId,
              teacher_id: teacher.id,
              attendance_status: status,
              notes: notes,
            });
          }
        });
      }

      // Perform upsert operation
      const { error } = await supabase.from("meeting_attendees").upsert(updates, { onConflict: 'meeting_id, student_id, teacher_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attendees", meetingId] });
      toast.success("Attendance updated successfully!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attendance");
    },
  });

  const handleStatusChange = (id: string, status: MeetingAttendee['attendance_status']) => {
    setAttendeeStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleNoteChange = (id: string, note: string) => {
    setAttendeeNotes(prev => ({ ...prev, [id]: note }));
  };

  const markAll = (status: MeetingAttendee['attendance_status']) => {
    const newStatuses: Record<string, MeetingAttendee['attendance_status']> = {};
    if (meetingType === 'parents' || meetingType === 'both') {
      allStudents.forEach(s => newStatuses[s.id] = status);
    }
    if (meetingType === 'teachers' || meetingType === 'both') {
      allTeachers.forEach(t => newStatuses[t.id] = status);
    }
    setAttendeeStatuses(prev => ({ ...prev, ...newStatuses }));
  };

  const attendeesList = React.useMemo(() => {
    const list: { id: string; name: string; type: 'student' | 'teacher' }[] = [];
    if (meetingType === 'parents' || meetingType === 'both') {
      allStudents.forEach(s => list.push({ id: s.id, name: s.name, type: 'student' }));
    }
    if (meetingType === 'teachers' || meetingType === 'both') {
      allTeachers.forEach(t => list.push({ id: t.id, name: t.name, type: 'teacher' }));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents, allTeachers, meetingType]);

  if (studentsLoading || teachersLoading || existingAttendeesLoading) {
    return <p>Loading attendees...</p>;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => markAll('present')}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark All Present
        </Button>
        <Button variant="outline" size="sm" onClick={() => markAll('absent')}>
          <XCircle className="h-4 w-4 mr-1" /> Mark All Absent
        </Button>
        <Button variant="outline" size="sm" onClick={() => markAll('excused')}>
          <MinusCircle className="h-4 w-4 mr-1" /> Mark All Excused
        </Button>
      </div>

      <div className="overflow-x-auto max-h-96 border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendeesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No {meetingType === 'parents' ? 'students' : meetingType === 'teachers' ? 'teachers' : 'attendees'} found for this meeting type.
                </TableCell>
              </TableRow>
            ) : (
              attendeesList.map(attendee => (
                <TableRow key={attendee.id}>
                  <TableCell className="font-medium">{attendee.name}</TableCell>
                  <TableCell>{attendee.type}</TableCell>
                  <TableCell>
                    <Select
                      value={attendeeStatuses[attendee.id] || 'pending'}
                      onValueChange={(value: MeetingAttendee['attendance_status']) => handleStatusChange(attendee.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={attendeeNotes[attendee.id] || ''}
                      onChange={(e) => handleNoteChange(attendee.id, e.target.value)}
                      placeholder="Add notes (optional)"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={updateAttendanceMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={() => updateAttendanceMutation.mutate()} disabled={updateAttendanceMutation.isPending}>
          {updateAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
}