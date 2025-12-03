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

export default function ParentTimetable() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch student's grade (parents can see their child's timetable)
  const { data: student } = useQuery({
    queryKey: ["student-info", user?.student_id],
    queryFn: async () => {
      if (!user?.student_id) return null;
      const { data, error } = await supabase
        .from("students")
        .select("grade, center_id")
        .eq("id", user.student_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.student_id,
  });

  // Fetch periods
  const { data: periods = [], isLoading: loadingPeriods } = useQuery({
    queryKey: ["class-periods-parent", user?.center_id],
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

  // Fetch schedules for student's grade
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["period-schedules-parent", user?.center_id, student?.grade, selectedDay],
    queryFn: async () => {
      if (!user?.center_id || !student?.grade) return [];
      const { data, error } = await supabase
        .from("period_schedules")
        .select(`
          *,
          class_periods(period_number, start_time, end_time),
          teachers(name)
        `)
        .eq("center_id", user.center_id)
        .eq("grade", student.grade)
        .eq("day_of_week", selectedDay);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id && !!student?.grade,
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

      {student && (
        <Card>
          <CardHeader>
            <CardTitle>Child Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="font-semibold">{student.grade}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Timetable View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Schedule - {student?.grade}
            </span>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSchedules ? (
            <p>Loading...</p>
          ) : schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No schedule for {student?.grade} on {getDayLabel(selectedDay)}.
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
