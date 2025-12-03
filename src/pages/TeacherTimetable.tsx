"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
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

export default function TeacherTimetable() {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<string>("Grade 1");
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch periods
  const { data: periods = [], isLoading: loadingPeriods } = useQuery({
    queryKey: ["class-periods-teacher", user?.center_id],
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

  // Fetch teacher's schedules
  const { data: teacherSchedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["teacher-schedules", user?.id, user?.center_id, selectedGrade, selectedDay],
    queryFn: async () => {
      if (!user?.id || !user?.center_id) return [];
      const { data, error } = await supabase
        .from("period_schedules")
        .select(`
          *,
          class_periods(period_number, start_time, end_time),
          teachers(name)
        `)
        .eq("center_id", user.center_id)
        .eq("teacher_id", user.id)
        .eq("grade", selectedGrade)
        .eq("day_of_week", selectedDay);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!user?.center_id,
  });

  // Fetch all schedules for the selected grade and day
  const { data: allSchedules = [], isLoading: loadingAllSchedules } = useQuery({
    queryKey: ["all-schedules-teacher", user?.center_id, selectedGrade, selectedDay],
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
        <h1 className="text-3xl font-bold">Timetable</h1>
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
            <p className="text-muted-foreground text-center py-4">No periods defined yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {periods.map((period: any) => (
                <Badge 
                  key={period.id} 
                  variant={currentPeriod?.id === period.id ? "default" : "outline"}
                  className="text-sm px-3 py-1"
                >
                  Period {period.period_number}: {period.start_time} - {period.end_time}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Teaching Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Your Schedule - {selectedGrade} on {getDayLabel(selectedDay)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSchedules ? (
            <p>Loading...</p>
          ) : teacherSchedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You have no classes for {selectedGrade} on {getDayLabel(selectedDay)}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherSchedules.map((schedule: any) => (
                  <TableRow 
                    key={schedule.id}
                    className={currentPeriod?.id === schedule.class_period_id ? "bg-primary/10" : ""}
                  >
                    <TableCell>Period {schedule.class_periods?.period_number}</TableCell>
                    <TableCell>
                      {schedule.class_periods?.start_time} - {schedule.class_periods?.end_time}
                    </TableCell>
                    <TableCell className="font-medium">{schedule.subject}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Class Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Class Schedule
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
                <SelectTrigger className="w-40">
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
          {loadingAllSchedules ? (
            <p>Loading...</p>
          ) : allSchedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No schedule for {selectedGrade} on {getDayLabel(selectedDay)}.
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
                {allSchedules.map((schedule: any) => (
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
