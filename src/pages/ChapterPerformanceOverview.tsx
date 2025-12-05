"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, BookOpen, User } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { safeFormatDate } from '@/lib/utils';

type LessonPlan = Tables<'lesson_plans'>;
type Student = Tables<'students'>;
type StudentChapter = Tables<'student_chapters'>;

export default function ChapterPerformanceOverview() {
  const { user } = useAuth();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // Fetch all students for grade filter
  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students-for-chapter-overview", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade")
        .eq("center_id", user.center_id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });
  const uniqueGrades = Array.from(new Set(allStudents.map(s => s.grade))).sort();

  // Fetch all student_chapters for the center
  const { data: studentChapters = [], isLoading } = useQuery({
    queryKey: ["all-student-chapters-overview", user?.center_id, subjectFilter, gradeFilter],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase.from("student_chapters").select(`
        *,
        students(id, name, grade),
        lesson_plans(id, subject, chapter, topic, lesson_date),
        recorded_by_teacher:recorded_by_teacher_id(name)
      `).eq("students.center_id", user.center_id);

      if (subjectFilter !== "all") {
        query = query.eq("lesson_plans.subject", subjectFilter);
      }
      if (gradeFilter !== "all") {
        query = query.eq("students.grade", gradeFilter);
      }

      const { data, error } = await query.order("completed_at", { ascending: false });
      if (error) throw error;
      return data?.filter((d: any) => d.students && d.lesson_plans) || [];
    },
    enabled: !!user?.center_id,
  });

  const allSubjects = useMemo(() => {
    return Array.from(new Set(studentChapters.map((sc: any) => sc.lesson_plans?.subject).filter(Boolean))).sort();
  }, [studentChapters]);

  const getRatingStars = (rating: number | null) => {
    if (rating === null) return "N/A";
    return Array(rating).fill("⭐").join("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chapter Performance Overview</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> All Chapter Evaluations
            </CardTitle>
            <div className="flex gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {allSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading chapter performance...</p>
          ) : studentChapters.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No chapter evaluations found for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px] border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Date Completed</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Teacher Notes</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentChapters.map((sc: any) => (
                    <TableRow key={sc.id}>
                      <TableCell className="font-medium">{sc.students?.name || '-'}</TableCell>
                      <TableCell>{sc.students?.grade || '-'}</TableCell>
                      <TableCell>{sc.lesson_plans?.subject || '-'}</TableCell>
                      <TableCell>{sc.lesson_plans?.chapter || '-'}</TableCell>
                      <TableCell>{sc.lesson_plans?.topic || '-'}</TableCell>
                      <TableCell>{safeFormatDate(sc.completed_at, "PPP")}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        {getRatingStars(sc.evaluation_rating)}
                      </TableCell>
                      <TableCell>{sc.teacher_notes || '-'}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        {sc.recorded_by_teacher?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}