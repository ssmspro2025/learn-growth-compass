"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Meeting = Tables<'meetings'>;

const GRADES = ['Pre-K', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];

interface MeetingFormProps {
  meeting?: Meeting | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function MeetingForm({ meeting, onSave, onCancel }: MeetingFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState(meeting?.title || "");
  const [agenda, setAgenda] = useState(meeting?.agenda || "");
  const [meetingDate, setMeetingDate] = useState(meeting?.meeting_date || format(new Date(), "yyyy-MM-dd"));
  const [meetingTime, setMeetingTime] = useState(meeting?.meeting_time || format(new Date(), "HH:mm"));
  const [meetingType, setMeetingType] = useState<Meeting['meeting_type']>(meeting?.meeting_type || "parents");
  const [status, setStatus] = useState<Meeting['status']>(meeting?.status || "scheduled");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setAgenda(meeting.agenda || "");
      setMeetingDate(meeting.meeting_date);
      setMeetingTime(meeting.meeting_time);
      setMeetingType(meeting.meeting_type);
      setStatus(meeting.status);
    } else {
      setTitle("");
      setAgenda("");
      setMeetingDate(format(new Date(), "yyyy-MM-dd"));
      setMeetingTime(format(new Date(), "HH:mm"));
      setMeetingType("parents");
      setStatus("scheduled");
      setSelectedGrade("all");
      setSelectedStudents([]);
      setSelectedTeachers([]);
    }
  }, [meeting]);

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-meetings", user?.center_id, selectedGrade],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase
        .from("students")
        .select("id, name, grade")
        .eq("center_id", user.center_id)
        .eq("status", "active")
        .order("name");
      
      if (selectedGrade !== "all") {
        query = query.eq("grade", selectedGrade);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && (meetingType === 'parents' || meetingType === 'both'),
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-meetings", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("center_id", user.center_id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && (meetingType === 'teachers' || meetingType === 'both'),
  });

  // Select all students when grade changes
  useEffect(() => {
    if (selectedGrade === "all") {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  }, [students, selectedGrade]);

  // Select all teachers when type includes teachers
  useEffect(() => {
    if (meetingType === 'teachers' || meetingType === 'both') {
      setSelectedTeachers(teachers.map(t => t.id));
    }
  }, [teachers, meetingType]);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => setSelectedStudents(students.map(s => s.id));
  const deselectAllStudents = () => setSelectedStudents([]);
  const selectAllTeachers = () => setSelectedTeachers(teachers.map(t => t.id));
  const deselectAllTeachers = () => setSelectedTeachers([]);

  const createMeetingMutation = useMutation({
    mutationFn: async (newMeeting: any) => {
      if (!user?.center_id || !user?.id) throw new Error("User or Center ID not found");
      const { data, error } = await supabase.from("meetings").insert({
        ...newMeeting,
        center_id: user.center_id,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (newMeeting) => {
      const attendeesToInsert: any[] = [];

      if (meetingType === 'parents' || meetingType === 'both') {
        selectedStudents.forEach(studentId => {
          attendeesToInsert.push({
            meeting_id: newMeeting.id,
            student_id: studentId,
            attendance_status: 'pending',
            user_id: null,
            teacher_id: null,
          });
        });
      }
      
      if (meetingType === 'teachers' || meetingType === 'both') {
        selectedTeachers.forEach(teacherId => {
          attendeesToInsert.push({
            meeting_id: newMeeting.id,
            teacher_id: teacherId,
            attendance_status: 'pending',
            user_id: null,
            student_id: null,
          });
        });
      }

      if (attendeesToInsert.length > 0) {
        const { error: attendeesError } = await supabase.from('meeting_attendees').insert(attendeesToInsert);
        if (attendeesError) console.error('Error inserting meeting attendees:', attendeesError);
      }

      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["parent-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-meetings"] });
      toast.success("Meeting created! Notifications sent to selected participants.");
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create meeting");
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async (updatedMeeting: any) => {
      if (!meeting?.id) throw new Error("Meeting ID not found for update");
      const { data, error } = await supabase.from("meetings").update({
        ...updatedMeeting,
        updated_at: new Date().toISOString(),
      }).eq("id", meeting.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting updated successfully!");
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update meeting");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((meetingType === 'parents' || meetingType === 'both') && selectedStudents.length === 0) {
      toast.error("Please select at least one student/parent");
      return;
    }
    
    if ((meetingType === 'teachers' || meetingType === 'both') && selectedTeachers.length === 0) {
      toast.error("Please select at least one teacher");
      return;
    }

    const meetingData = {
      title,
      agenda: agenda || null,
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      meeting_type: meetingType,
      status,
    };

    if (meeting) {
      updateMeetingMutation.mutate(meetingData);
    } else {
      createMeetingMutation.mutate(meetingData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Parent-Teacher Conference" required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="agenda">Agenda (Optional)</Label>
        <Textarea id="agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} placeholder="Key discussion points" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meetingDate">Date *</Label>
          <Input id="meetingDate" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meetingTime">Time *</Label>
          <Input id="meetingTime" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meetingType">Meeting Type *</Label>
          <Select value={meetingType} onValueChange={(value: Meeting['meeting_type']) => setMeetingType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parents">Parents</SelectItem>
              <SelectItem value="teachers">Teachers</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(value: Meeting['status']) => setStatus(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grade Selection for Parents */}
      {(meetingType === 'parents' || meetingType === 'both') && !meeting && (
        <div className="space-y-2">
          <Label>Filter by Grade</Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {GRADES.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Student Selection */}
      {(meetingType === 'parents' || meetingType === 'both') && !meeting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Students/Parents ({selectedStudents.length}/{students.length})</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllStudents}>Select All</Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAllStudents}>Deselect All</Button>
            </div>
          </div>
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-1">
              {students.map(student => (
                <div key={student.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer">
                    {student.name} <span className="text-muted-foreground">({student.grade})</span>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Teacher Selection */}
      {(meetingType === 'teachers' || meetingType === 'both') && !meeting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Teachers ({selectedTeachers.length}/{teachers.length})</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllTeachers}>Select All</Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAllTeachers}>Deselect All</Button>
            </div>
          </div>
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-1">
              {teachers.map(teacher => (
                <div key={teacher.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`teacher-${teacher.id}`}
                    checked={selectedTeachers.includes(teacher.id)}
                    onCheckedChange={() => toggleTeacher(teacher.id)}
                  />
                  <label htmlFor={`teacher-${teacher.id}`} className="text-sm cursor-pointer">
                    {teacher.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={createMeetingMutation.isPending || updateMeetingMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title || !meetingDate || !meetingTime || createMeetingMutation.isPending || updateMeetingMutation.isPending}>
          {meeting ? (updateMeetingMutation.isPending ? "Updating..." : "Update Meeting") : (createMeetingMutation.isPending ? "Creating..." : "Create Meeting")}
        </Button>
      </div>
    </form>
  );
}