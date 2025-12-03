"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Clock, Trash2, BookOpen } from "lucide-react";
import { format } from "date-fns";

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];
const GRADES = ['Pre-K', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];

export default function Timetable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("Grade 1");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states for period
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");

  // Form states for schedule
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [subjectName, setSubjectName] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [scheduleGrade, setScheduleGrade] = useState<string>("Grade 1");
  const [scheduleDay, setScheduleDay] = useState<number>(1);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch periods
  const { data: periods = [], isLoading: loadingPeriods } = useQuery({
    queryKey: ["class-periods", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("class_periods")
        .select("*")
        .eq("center_id", user.center_id)
        .eq("is_active", true)
        .order("period_number");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch schedules
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["period-schedules", user?.center_id, selectedGrade, selectedDay],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("period_schedules")
        .select(`
          *,
          class_periods(period_number, start_time, end_time),
          teachers(name)
        `)
        .eq("center_id", user.center_id)
        .eq("grade", selectedGrade)
        .eq("day_of_week", selectedDay);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-timetable", user?.center_id],
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

  // Create period mutation
  const createPeriodMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      const { error } = await supabase.from("class_periods").insert({
        center_id: user.center_id,
        period_number: periodNumber,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-periods"] });
      toast.success("Period created successfully!");
      setShowPeriodDialog(false);
      setPeriodNumber(periods.length + 1);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create period");
    },
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      const { error } = await supabase.from("period_schedules").insert({
        center_id: user.center_id,
        class_period_id: selectedPeriod,
        grade: scheduleGrade,
        day_of_week: scheduleDay,
        subject: subjectName,
        teacher_id: selectedTeacher || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["period-schedules"] });
      toast.success("Schedule created successfully!");
      setShowScheduleDialog(false);
      setSubjectName("");
      setSelectedTeacher("");
      setSelectedPeriod("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create schedule");
    },
  });

  // Delete period mutation
  const deletePeriodMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-periods"] });
      toast.success("Period deleted!");
    },
  });

  // Get current period
  const getCurrentPeriod = () => {
    const now = format(currentTime, "HH:mm:ss");
    
    return periods.find((period: any) => {
      const start = period.start_time;
      const end = period.end_time;
      return now >= start && now <= end;
    });
  };

  const currentPeriod = getCurrentPeriod();
  const getDayLabel = (dayNum: number) => DAYS_OF_WEEK.find(d => d.value === dayNum)?.label || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Timetable Management</h1>
        <div className="flex gap-2">
          <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
            <DialogTrigger asChild>
              <Button variant="outline"><Clock className="h-4 w-4 mr-2" /> Add Period</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Class Period</DialogTitle>
                <DialogDescription>Define a new period timing for the day.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Period Number</Label>
                  <Input
                    type="number"
                    min={1}
                    value={periodNumber}
                    onChange={(e) => setPeriodNumber(parseInt(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>Cancel</Button>
                  <Button onClick={() => createPeriodMutation.mutate()} disabled={createPeriodMutation.isPending}>
                    {createPeriodMutation.isPending ? "Creating..." : "Create Period"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Period Schedule</DialogTitle>
                <DialogDescription>Assign a subject and teacher to a period.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select value={scheduleGrade} onValueChange={setScheduleGrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select value={String(scheduleDay)} onValueChange={(v) => setScheduleDay(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(d => (
                          <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          Period {p.period_number} ({p.start_time} - {p.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject Name *</Label>
                  <Input
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g., Mathematics, English, Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign Teacher</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
                  <Button 
                    onClick={() => createScheduleMutation.mutate()} 
                    disabled={createScheduleMutation.isPending || !selectedPeriod || !subjectName}
                  >
                    {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Period Display */}
      {currentPeriod && (
        <Card className="bg-primary/10 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Current Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              Period {currentPeriod.period_number} ({currentPeriod.start_time} - {currentPeriod.end_time})
            </div>
            <p className="text-muted-foreground">
              Current time: {format(currentTime, "HH:mm")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Period Timings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Period Timings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPeriods ? (
            <p>Loading...</p>
          ) : periods.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No periods defined yet. Add periods to get started.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((period: any) => (
                <Badge 
                  key={period.id} 
                  variant={currentPeriod?.id === period.id ? "default" : "outline"}
                  className="text-sm px-3 py-1"
                >
                  Period {period.period_number}: {period.start_time} - {period.end_time}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 ml-2 p-0"
                    onClick={() => deletePeriodMutation.mutate(period.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timetable View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Schedule
            </span>
            <div className="flex gap-2">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSchedules ? (
            <p>Loading...</p>
          ) : schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No schedule for {selectedGrade} on {getDayLabel(selectedDay)}. Add a schedule to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule: any) => (
                  <TableRow 
                    key={schedule.id}
                    className={currentPeriod?.id === schedule.class_period_id ? "bg-primary/10" : ""}
                  >
                    <TableCell>Period {schedule.class_periods?.period_number}</TableCell>
                    <TableCell>
                      {schedule.class_periods?.start_time} - {schedule.class_periods?.end_time}
                    </TableCell>
                    <TableCell className="font-medium">{schedule.subject}</TableCell>
                    <TableCell>
                      {schedule.teachers?.name || <span className="text-muted-foreground">Not assigned</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
