"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Filter, Search } from "lucide-react";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";

interface MeetingAttendanceRecorderProps {
  meetingId: string;
  onClose: () => void;
}

type AttendanceStatus = "pending" | "present" | "absent" | "excused" | "invite";

// Define base participant type (without meeting-specific status)
type BaseParticipant = {
  userId: string; // The user.id of the parent or teacher
  participantId: string; // The student.id or teacher.id
  name: string; // Display name (e.g., parent's username or teacher's name)
  studentName?: string; // Student's name (for parent meetings)
  grade?: string | null; // Student's grade (for parent meetings)
  type: 'parent' | 'teacher';
};

// Define participant type with meeting-specific status
type DisplayParticipantWithStatus = BaseParticipant & {
  meetingAttendeeId?: string; // ID of the existing meeting_attendees record
  currentStatus: AttendanceStatus; // Current status for THIS meeting
  currentNotes: string | null; // Current notes for THIS meeting
};

export default function MeetingAttendanceRecorder({ meetingId, onClose }: MeetingAttendanceRecorderProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [attendeeStatuses, setAttendeeStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch meeting details to determine its type
  const { data: meetingDetails, isLoading: meetingDetailsLoading } = useQuery({
    queryKey: ["meeting-details-for-attendance", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("meeting_type")
        .eq("id", meetingId)
        .single();
      if (error) {
        console.error("MeetingAttendanceRecorder: Error fetching meeting details:", error);
        throw error;
      }
      return data;
    },
    enabled: !!meetingId,
  });

  // Fetch all potential parent attendees for the center
  const { data: allParents = [], isLoading: parentsLoading } = useQuery({
    queryKey: ["all-parents-for-center", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          username,
          parent_students(student_id, students(id, name, grade))
        `)
        .eq("role", "parent")
        .eq("center_id", user.center_id);
      if (error) throw error;
      
      // Flatten the data to get a list of parent-student pairs
      const parentsWithStudents: BaseParticipant[] = [];
      data.forEach(parentUser => {
        if (parentUser.parent_students && parentUser.parent_students.length > 0) {
          parentUser.parent_students.forEach(ps => {
            if (ps.students) {
              parentsWithStudents.push({
                userId: parentUser.id,
                participantId: ps.students.id, // Student ID
                name: parentUser.username, // Parent's username
                studentName: ps.students.name,
                grade: ps.students.grade,
                type: 'parent'
              });
            }
          });
        }
      });
      return parentsWithStudents;
    },
    enabled: !!user?.center_id && (meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general'),
  });

  // Fetch all potential teacher attendees for the center
  const { data: allTeachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["all-teachers-for-center", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("teachers")
        .select(`
          id,
          name,
          user_id
        `)
        .eq("center_id", user.center_id)
        .eq("is_active", true);
      if (error) throw error;
      return data.map(teacher => ({
        userId: teacher.user_id!,
        participantId: teacher.id, // Teacher ID
        name: teacher.name,
        grade: null,
        type: 'teacher'
      })) as BaseParticipant[];
    },
    enabled: !!user?.center_id && meetingDetails?.meeting_type === 'teachers',
  });

  // Fetch existing attendees for this meeting to get current statuses
  const { data: existingAttendees = [], isLoading: existingAttendeesLoading } = useQuery({
    queryKey: ["meeting-attendees-current-status", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_attendees")
        .select("id, student_id, teacher_id, user_id, attendance_status, notes")
        .eq("meeting_id", meetingId);
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  // Combine all potential attendees and apply filters
  const allPotentialParticipants = useMemo(() => {
    let baseParticipants: BaseParticipant[] = [];

    if (meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') {
      baseParticipants = allParents;
    } else if (meetingDetails?.meeting_type === 'teachers') {
      baseParticipants = allTeachers;
    }

    // Now, merge with existing attendance data and apply filters
    let participantsWithStatus: DisplayParticipantWithStatus[] = baseParticipants.map(p => {
      const existing = existingAttendees.find(ea => 
        ea.user_id === p.userId &&
        ((p.type === 'parent' && ea.student_id === p.participantId) ||
         (p.type === 'teacher' && ea.teacher_id === p.participantId))
      );

      return {
        ...p,
        meetingAttendeeId: existing?.id,
        currentStatus: (existing?.attendance_status as AttendanceStatus) || "pending",
        currentNotes: existing?.notes || null,
      };
    });

    // Apply grade filter for parents/general meetings
    if ((meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') && gradeFilter !== "all") {
      participantsWithStatus = participantsWithStatus.filter(p => p.grade === gradeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      participantsWithStatus = participantsWithStatus.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.grade?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return participantsWithStatus;
  }, [allParents, allTeachers, existingAttendees, meetingDetails, gradeFilter, searchQuery]);

  // Derive unique grades for the filter dropdown from all parents
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    allParents.forEach(p => {
      if (p.grade) {
        grades.add(p.grade);
      }
    });
    return Array.from(grades).sort();
  }, [allParents]);

  // Initialize attendeeStatuses from initialStatus in allPotentialParticipants
  useEffect(() => {
    const initialStatuses: Record<string, AttendanceStatus> = {};
    allPotentialParticipants.forEach(participant => {
      initialStatuses[participant.userId] = participant.currentStatus;
    });
    setAttendeeStatuses(initialStatuses);
  }, [allPotentialParticipants]); // Depend on allPotentialParticipants to re-initialize when filters change

  const updateAttendanceMutation = useMutation({
    mutationFn: async () => {
      const recordsToUpsert: TablesInsert<'meeting_attendees'>[] = [];
      
      for (const participant of allPotentialParticipants) {
        const attendance_status = attendeeStatuses[participant.userId] ?? "pending";
        const attended = attendance_status === "present";
        
        const record: TablesInsert<'meeting_attendees'> = {
          meeting_id: meetingId,
          attended,
          attendance_status,
          notes: participant.currentNotes, // Keep initial notes, or add a way to edit them
          user_id: participant.userId,
        };

        if (participant.type === 'parent') {
          Object.assign(record, { student_id: participant.participantId, teacher_id: null });
        } else if (participant.type === 'teacher') {
          Object.assign(record, { teacher_id: participant.participantId, student_id: null });
        }

        // Use upsert with onConflict on meeting_id and user_id to handle new entries and updates
        recordsToUpsert.push(record);
      }

      if (recordsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from("meeting_attendees").upsert(recordsToUpsert, { onConflict: 'meeting_id,user_id' });
        if (upsertError) throw upsertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attendees-current-status", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Attendance updated successfully!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attendance");
    },
  });

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setAttendeeStatuses(prev => ({ ...prev, [userId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newStatuses: Record<string, AttendanceStatus> = {};
    allPotentialParticipants.forEach(p => newStatuses[p.userId] = status);
    setAttendeeStatuses(newStatuses);
  };

  if (meetingDetailsLoading || parentsLoading || teachersLoading || existingAttendeesLoading) {
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

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        {(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') && (
          <>
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
          </>
        )}
      </div>

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
            {allPotentialParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') ? 3 : 2} className="text-center text-muted-foreground">No participants found</TableCell>
              </TableRow>
            ) : (
              allPotentialParticipants.map((participant) => (
                <TableRow key={participant.userId}>
                  <TableCell className="font-medium">
                    {participant.type === 'parent'
                      ? `${participant.name} (Parent of ${participant.studentName})`
                      : participant.name}
                  </TableCell>
                  {(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') ? <TableCell>{participant.grade}</TableCell> : null}
                  <TableCell>
                    <Select
                      value={attendeeStatuses[participant.userId] || "pending"}
                      onValueChange={(value) => handleStatusChange(participant.userId, value as AttendanceStatus)}
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