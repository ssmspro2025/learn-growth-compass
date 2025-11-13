import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // ✅ Correct import
import { CalendarIcon, Download, Loader2, BookOpen, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function StudentReport() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Fetch students for current user's center (non-admin) or all (admin)
  const { data: students = [] } = useQuery({
    queryKey: ["students", user?.center_id],
    queryFn: async () => {
      let query = supabase.from("students").select("*").order("name");
      if (user?.role !== "admin" && user?.center_id) query = query.eq("center_id", user.center_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch attendance for selected student within date range
  const { data: attendanceData = [] } = useQuery({
    queryKey: ["attendance", selectedStudentId, dateRange],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .gte("date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("date", format(dateRange.to, "yyyy-MM-dd"))
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  // Fetch chapters studied
  const { data: chaptersData = [] } = useQuery({
    queryKey: ["student-chapters", selectedStudentId, subjectFilter],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      let query = supabase.from("student_chapters").select("*, chapters(*)").eq("student_id", selectedStudentId);
      if (subjectFilter !== "all") query = query.eq("chapters.subject", subjectFilter);
      const { data, error } = await query.order("date_completed", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  // Fetch all chapters for calculating completion %
  const { data: allChapters = [] } = useQuery({
    queryKey: ["all-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chapters").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch test results
  const { data: testResults = [] } = useQuery({
    queryKey: ["student-test-results", selectedStudentId, subjectFilter],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      let query = supabase.from("test_results").select("*, tests(*)").eq("student_id", selectedStudentId);
      if (subjectFilter !== "all") query = query.eq("tests.subject", subjectFilter);
      const { data, error } = await query.order("date_taken", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  // Fetch student info including fee
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Attendance stats
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter((a) => a.status === "Present").length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Chapter completion %
  const completedChaptersCount = chaptersData.filter((c) => c.completed).length;
  const chapterCompletionPercentage = allChapters.length > 0 ? Math.round((completedChaptersCount / allChapters.length) * 100) : 0;

  // Test stats
  const totalMarksObtained = testResults.reduce((sum, r) => sum + r.marks_obtained, 0);
  const totalMaxMarks = testResults.reduce((sum, r) => sum + (r.tests?.total_marks || 0), 0);
  const averageTestPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  // Subjects list for filter
  const subjects = Array.from(new Set([
    ...chaptersData.map(c => c.chapters?.subject).filter(Boolean),
    ...testResults.map(t => t.tests?.subject).filter(Boolean)
  ]));

  // Export CSV
  const exportToCSV = () => {
    if (!selectedStudent) return;
    const rows = [
      ["Student Report"],
      ["Name", selectedStudent.name],
      ["Grade", selectedStudent.grade],
      ["Monthly Fee", selectedStudent.monthlyFee || "-"],
      [""],
      ["Attendance Summary"],
      ["Total Days", totalDays],
      ["Present", presentDays],
      ["Absent", totalDays - presentDays],
      ["Attendance %", attendancePercentage + "%"],
      [""],
      ["Chapter Completion", chapterCompletionPercentage + "%"],
      [""],
      ["Test Results"],
      ["Test Name", "Subject", "Marks Obtained", "Total Marks", "Percentage", "Date"],
      ...testResults.map(r => [
        r.tests?.name,
        r.tests?.subject,
        r.marks_obtained,
        r.tests?.total_marks,
        r.tests?.total_marks ? Math.round((r.marks_obtained / r.tests.total_marks) * 100) + "%" : "-",
        format(new Date(r.date_taken), "yyyy-MM-dd")
      ])
    ];
    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedStudent.name}_report.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Student Report</h1>
        {selectedStudentId && (
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Select Student */}
      <Card>
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} - Grade {s.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Filters */}
      {selectedStudent && subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subj) => (
                  <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total Days: {totalDays}</p>
              <p>Present: {presentDays}</p>
              <p>Absent: {totalDays - presentDays}</p>
              <p>Attendance %: {attendancePercentage}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chapter Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Completed Chapters: {completedChaptersCount}</p>
              <p>Total Chapters: {allChapters.length}</p>
              <p>Completion %: {chapterCompletionPercentage}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total Tests: {testResults.length}</p>
              <p>Total Marks Obtained: {totalMarksObtained}</p>
              <p>Total Max Marks: {totalMaxMarks}</p>
              <p>Average %: {averageTestPercentage}%</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
