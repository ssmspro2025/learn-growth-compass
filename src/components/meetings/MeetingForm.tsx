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
import { toast } from "sonner";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Meeting = Tables<'meetings'>;
type User = Tables<'users'>;
type Student = Tables<'students'>;
type Teacher = Tables<'teachers'>;

interface MeetingFormProps {
  meeting?: Meeting | null; // Optional: for editing an existing meeting
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

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setAgenda(meeting.agenda || "");
      setMeetingDate(meeting.meeting_date);
      setMeetingTime(meeting.meeting_time);
      setMeetingType(meeting.meeting_type);
      setStatus(meeting.status);
    } else {
      // Reset form for new meeting
      setTitle("");
      setAgenda("");
      setMeetingDate(format(new Date(), "yyyy-MM-dd"));
      setMeetingTime(format(new Date(), "HH:mm"));
      setMeetingType("parents");
      setStatus("scheduled");
    }
  }, [meeting]);

  // Fetch students and teachers for potential attendees
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-meetings", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase.from("students").select("id, name").eq("center_id", user.center_id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && (meetingType === 'parents' || meetingType === 'both'),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-meetings", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase.from("teachers").select("id, name").eq("center_id", user.center_id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && (meetingType === 'teachers' || meetingType === 'both'),
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (newMeeting: Tables<'meetings'>['Insert']) => {
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
      // Automatically add all relevant students/teachers as attendees with 'pending' status
      const attendeesToInsert: Tables<'meeting_attendees'>['Insert'][] = [];

      if (meetingType === 'parents' || meetingType === 'both') {
        students.forEach(student => {
          attendeesToInsert.push({
            meeting_id: newMeeting.id,
            student_id: student.id,
            attendance_status: 'pending',
            user_id: null, // Parent user ID will be linked if they have an account
            teacher_id: null,
          });
        });
      }
      if (meetingType === 'teachers' || meetingType === 'both') {
        teachers.forEach(teacher => {
          attendeesToInsert.push({
            meeting_id: newMeeting.id,
            teacher_id: teacher.id,
            attendance_status: 'pending',
            user_id: null, // Teacher user ID will be linked if they have an account
            student_id: null,
          });
        });
      }

      if (attendeesToInsert.length > 0) {
        const { error: attendeesError } = await supabase.from('meeting_attendees').insert(attendeesToInsert);
        if (attendeesError) console.error('Error inserting meeting attendees:', attendeesError);
      }

      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting created successfully!");
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create meeting");
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async (updatedMeeting: Tables<'meetings'>['Update']) => {
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