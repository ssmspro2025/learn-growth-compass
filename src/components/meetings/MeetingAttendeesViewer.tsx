"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface MeetingAttendeesViewerProps {
  meetingId: string;
}

// Define partial types for fetched data
type PartialStudent = Pick<Tables<'students'>, 'id' | 'name' | 'grade'>;
type PartialTeacher = Pick<Tables<'teachers'>, 'id' | 'name' | 'user_id'>;
type PartialUser = Pick<Tables<'users'>, 'id' | 'username' | 'role'>;

type MeetingAttendeeWithDetails = Tables<'meeting_attendees'> & {
  students?: PartialStudent;
  teachers?: PartialTeacher;
  users?: PartialUser;
};

export default function MeetingAttendeesViewer({ meetingId }: MeetingAttendeesViewerProps) {
  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ["meeting-attendees-viewer", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_attendees")
        .select(`
          attendance_status,
          students(name, grade),
          teachers(name),
          users(username, role)
        `)
        .eq("meeting_id", meetingId);
      if (error) throw error;
      return data as MeetingAttendeeWithDetails[];
    },
    enabled: !!meetingId,
  });

  const getStatusColorClass = (status: string | null) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "excused": return "bg-yellow-100 text-yellow-800";
      case "invite": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <p>Loading attendees...</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" /> Attendees
      </h3>
      {attendees.length === 0 ? (
        <p className="text-muted-foreground">No attendance records found for this meeting.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((attendee, index) => {
                const participantName = attendee.students?.name || attendee.teachers?.name || attendee.users?.username || 'Unknown';
                const participantType = attendee.students ? 'Student' : (attendee.teachers ? 'Teacher' : (attendee.users ? attendee.users.role : 'Unknown'));
                const participantGrade = attendee.students?.grade || '-'; // Only students have grades

                let displayName = participantName;
                if (attendee.students && attendee.users?.username && attendee.users.role === 'parent') {
                  displayName = `${attendee.users.username} (Parent of ${attendee.students.name})`;
                } else if (attendee.teachers?.name) {
                  displayName = attendee.teachers.name;
                } else if (attendee.users?.username) {
                  displayName = attendee.users.username;
                }

                return (
                  <TableRow key={index}> {/* Using index as key, assuming order is stable for display */}
                    <TableCell className="font-medium">{displayName}</TableCell>
                    <TableCell>{participantType}</TableCell>
                    <TableCell>{participantGrade}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColorClass(attendee.attendance_status)}>
                        {attendee.attendance_status ? attendee.attendance_status.charAt(0).toUpperCase() + attendee.attendance_status.slice(1) : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}