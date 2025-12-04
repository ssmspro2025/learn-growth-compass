"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Filter, Search } from "lucide-react"; // Added Search icon
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input"; // Added Input component

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
  id: string; // This will be the meeting_attendees.id if existing, or a temporary key for new ones
  userId: string; // The user.id of the parent or teacher
  participantId: string; // The student.id or teacher.id
  name: string; // Parent's username or Teacher's name
  studentName?: string; // Only for parents
  grade?: string | null; // Only for parents (student's grade)
  type: 'parent' | 'teacher';
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
      const parentsWithStudents: DisplayParticipant[] = [];
      data.forEach(parentUser => {
        if (parentUser.parent_students && parentUser.parent_students.length > 0) {
          parentUser.parent_students.forEach(ps => {
            if (ps.students) {
              parentsWithStudents.push({
                id: `${parentUser.id}-${ps.students.id}`, // Temporary unique ID for display
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
        id: teacher.id, // Temporary unique ID for display
        userId: teacher.user_id!,
        participantId: teacher.id, // Teacher ID
        name: teacher.name,
        grade: null,
        type: 'teacher'
      })) as DisplayParticipant[];
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
  const displayParticipants = useMemo(() => {
    let participants: DisplayParticipant[] = [];

    if (meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') {
      participants = allParents;
      if (gradeFilter !== "all") {
        participants = participants.filter(p => p.grade === gradeFilter);
      }
      if (searchQuery) {
        participants = participants.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    } else if (meetingDetails?.meeting_type === 'teachers') {
      participants = allTeachers;
      if (searchQuery) {
        participants = participants.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }
    return participants;
  }, [allParents, allTeachers, meetingDetails?.meeting_type, gradeFilter, searchQuery]);

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

  // Initialize attendeeStatuses from existing records or default to 'pending'
  useEffect(() => {
    const initialStatuses: Record<string, AttendanceStatus> = {};
    
    // Initialize all currently displayed participants to 'pending'
    displayParticipants.forEach(participant => {
      initialStatuses[participant.userId] = "pending";
    });

    // Override with existing statuses from the database
    existingAttendees.forEach((attendee) => {
      const key = attendee.user_id; // Use user_id as the key for status tracking
      if (key) {
        initialStatuses[key] = (attendee.attendance_status as AttendanceStatus) || "pending";
      }
    });
    setAttendeeStatuses(initialStatuses);
  }, [existingAttendees, displayParticipants]);

  const updateAttendanceMutation = useMutation({
    mutationFn: async () => {
      const recordsToUpsert: TablesInsert<'meeting_attendees'>[] = [];
      
      for (const participant of displayParticipants) {
        const attendance_status = attendeeStatuses[participant.userId] ?? "pending";
        const attended = attendance_status === "present";
        
        // Find if an existing record exists for this participant (user_id + student_id/teacher_id)
        const existingAttendeeRecord = existingAttendees.find((ea) => 
          ea.user_id === participant.userId &&
          ((participant.type === 'student' && ea.student_id === participant.participantId) ||
           (participant.type === 'teacher' && ea.teacher_id === participant.participantId))
        );

        const baseRecord: TablesInsert<'meeting_attendees'> = {
          meeting_id: meetingId,
          attended,
          attendance_status,
          notes: existingAttendeeRecord?.notes || null, // Preserve existing notes if any
          user_id: participant.userId,
        };

        if (participant.type === 'parent') {
          Object.assign(baseRecord, { student_id: participant.participantId, teacher_id: null });
        } else if (participant.type === 'teacher') {
          Object.assign(baseRecord, { teacher_id: participant.participantId, student_id: null });
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
    displayParticipants.forEach(p => newStatuses[p.userId] = status);
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
            {displayParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(meetingDetails?.meeting_type === 'parents' || meetingDetails?.meeting_type === 'general') ? 3 : 2} className="text-center text-muted-foreground">No participants found</TableCell>
              </TableRow>
            ) : (
              displayParticipants.map((participant) => (
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