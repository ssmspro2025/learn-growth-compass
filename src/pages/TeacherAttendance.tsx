import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

type Teacher = Tables<'teachers'>;
type TeacherAttendance = Tables<'teacher_attendance'>;

export default function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, TeacherAttendance>>({});

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch active teachers for the center
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["active-teachers", user?.center_id],
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
    enabled: !!user?.center_id,
  });

  // Fetch existing attendance for the selected date
  const { data: existingAttendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["teacher-attendance", dateStr, user?.center_id],
    queryFn: async () => {
      if (!user?.center_id || teachers.length === 0) return [];
      const teacherIds = teachers.map(t => t.id);
      const { data, error } = await supabase
        .from("teacher_attendance")
        .select("*")
        .in("teacher_id", teacherIds)
        .eq("date", dateStr);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && teachers.length > 0,
  });

  // Initialize attendance state when teachers or existing attendance changes
  useEffect(() => {
    const initialRecords: Record<string, TeacherAttendance> = {};
    teachers.forEach(teacher => {
      const record = existingAttendance.find(att => att.teacher_id === teacher.id);
      initialRecords[teacher.id] = record || {
        id: '', // Will be generated on insert
        teacher_id: teacher.id,
        date: dateStr,
        status: 'absent', // Default to absent
        time_in: null,
        time_out: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    setAttendanceRecords(initialRecords);
  }, [teachers, existingAttendance, dateStr]);

  const handleStatusChange = (teacherId: string, status: TeacherAttendance['status']) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status,
        time_in: status === 'present' ? (prev[teacherId]?.time_in || format(new Date(), 'HH:mm')) : null,
        time_out: status === 'present' ? (prev[teacherId]?.time_out || null) : null,
      }
    }));
  };

  const handleTimeChange = (teacherId: string, field: 'time_in' | 'time_out', value: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [field]: value || null,
      }
    }));
  };

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");

      const recordsToInsert: Tables<'teacher_attendance'>[] = [];
      const recordsToUpdate: Tables<'teacher_attendance'>[] = [];

      for (const teacherId in attendanceRecords) {
        const record = attendanceRecords[teacherId];
        if (record.id) { // Existing record, update
          recordsToUpdate.push({
            ...record,
            updated_at: new Date().toISOString(),
          });
        } else { // New record, insert
          recordsToInsert.push({
            teacher_id: record.teacher_id,
            date: record.date,
            status: record.status,
            time_in: record.time_in,
            time_out: record.time_out,
            notes: record.notes,
          });
        }
      }

      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase.from("teacher_attendance").insert(recordsToInsert);
        if (insertError) throw insertError;
      }

      if (recordsToUpdate.length > 0) {
        // Perform updates one by one or in a batch if Supabase supports it easily
        for (const record of recordsToUpdate) {
          const { error: updateError } = await supabase.from("teacher_attendance").update({
            status: record.status,
            time_in: record.time_in,
            time_out: record.time_out,
            notes: record.notes,
            updated_at: record.updated_at,
          }).eq("id", record.id);
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance"] });
      toast.success("Teacher attendance saved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save attendance");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAttendanceMutation.mutate();
  };

  const markAllPresent = () => {
    const updatedRecords = { ...attendanceRecords };
    teachers.forEach(teacher => {
      updatedRecords[teacher.id] = {
        ...updatedRecords[teacher.id],
        status: 'present',
        time_in: updatedRecords[teacher.id]?.time_in || format(new Date(), 'HH:mm'),
        time_out: updatedRecords[teacher.id]?.time_out || null,
      };
    });
    setAttendanceRecords(updatedRecords);
  };

  const markAllAbsent = () => {
    const updatedRecords = { ...attendanceRecords };
    teachers.forEach(teacher => {
      updatedRecords[teacher.id] = {
        ...updatedRecords[teacher.id],
        status: 'absent',
        time_in: null,
        time_out: null,
      };
    });
    setAttendanceRecords(updatedRecords);
  };

  const formatTimeValue = (timeVal: string | null) => {
    if (!timeVal) return '-';
    try {
      // Create a dummy date to parse the time correctly
      const dummyDate = `2000-01-01T${timeVal}`;
      return format(new Date(dummyDate), 'HH:mm');
    } catch (e) {
      return timeVal; // Fallback if parsing fails
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Attendance</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[220px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={markAllPresent}>Mark All Present</Button>
            <Button variant="outline" size="sm" onClick={markAllAbsent}>Mark All Absent</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance for {format(selectedDate, "PPP")}</CardTitle>
        </CardHeader>
        <CardContent>
          {teachersLoading || attendanceLoading ? (
            <p>Loading teachers and attendance...</p>
          ) : teachers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active teachers registered yet.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(teacher => {
                      const record = attendanceRecords[teacher.id];
                      return (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>
                            <Select
                              value={record?.status || 'absent'}
                              onValueChange={(value: TeacherAttendance['status']) => handleStatusChange(teacher.id, value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="leave">Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={record?.time_in || ''}
                              onChange={(e) => handleTimeChange(teacher.id, 'time_in', e.target.value)}
                              disabled={record?.status !== 'present'}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={record?.time_out || ''}
                              onChange={(e) => handleTimeChange(teacher.id, 'time_out', e.target.value)}
                              disabled={record?.status !== 'present'}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={record?.notes || ''}
                              onChange={(e) => setAttendanceRecords(prev => ({
                                ...prev,
                                [teacher.id]: { ...prev[teacher.id], notes: e.target.value || null }
                              }))}
                              placeholder="Notes (optional)"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Button type="submit" className="w-full" disabled={saveAttendanceMutation.isPending}>
                {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary Section (Optional, can be expanded) */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section can be expanded to show monthly/yearly summaries.</p>
          {/* Example: Display a simple count for the selected day */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Present: {Object.values(attendanceRecords).filter(r => r.status === 'present').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Absent: {Object.values(attendanceRecords).filter(r => r.status === 'absent').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-orange-600" />
              <span>On Leave: {Object.values(attendanceRecords).filter(r => r.status === 'leave').length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}