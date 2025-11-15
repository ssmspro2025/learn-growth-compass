import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CalendarIcon,
  Download,
  Brain,
  FileText,
  BookOpen,
  Loader2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function StudentReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [chapterSubjectFilter, setChapterSubjectFilter] = useState<string>("all");
  const [aiSummary, setAiSummary] = useState<string>("");

  // Fetch students (filtered by grade)
  const { data: students = [] } = useQuery({
    queryKey: ["students", user?.center_id, selectedGrade],
    queryFn: async () => {
      let query = supabase.from("students").select("*").order("name");
      if (user?.role !== "admin" && user?.center_id)
        query = query.eq("center_id", user.center_id);
      if (selectedGrade !== "all") query = query.eq("grade", selectedGrade);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Attendance
  const { data: attendanceData = [] } = useQuery({
    queryKey: ["attendance", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  // Chapters
  const { data: chapterProgress = [] } = useQuery({
    queryKey: ["chapters", selectedStudentId, chapterSubjectFilter],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      let query = supabase
        .from("student_chapters")
        .select("*, chapters(*)")
        .eq("student_id", selectedStudentId);
      if (chapterSubjectFilter !== "all")
        query = query.eq("chapters.subject", chapterSubjectFilter);
      const { data, error } = await query.order("date_completed", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: allChapters = [] } = useQuery({
    queryKey: ["all-chapters", user?.center_id],
    queryFn: async () => {
      let query = supabase.from("chapters").select("*");
      if (user?.role !== "admin" && user?.center_id)
        query = query.eq("center_id", user.center_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Test Results (fetches answersheet_url)
  const { data: testResults = [] } = useQuery({
    queryKey: ["test-results", selectedStudentId, subjectFilter],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      let query = supabase
        .from("test_results")
        .select("*, tests(*)")
        .eq("student_id", selectedStudentId);
      if (subjectFilter !== "all")
        query = query.eq("tests.subject", subjectFilter);
      const { data, error } = await query.order("date_taken", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  // Statistics
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter((a) => a.status === "Present").length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const totalTests = testResults.length;
  const totalMarksObtained = testResults.reduce((sum, r) => sum + r.marks_obtained, 0);
  const totalMaxMarks = testResults.reduce((sum, r) => sum + (r.tests?.total_marks || 0), 0);
  const averagePercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  const completedChaptersCount = chapterProgress.filter(cp => cp.completed).length;
  const totalChaptersCount = allChapters.length;
  const chapterCompletionPercentage = totalChaptersCount > 0
    ? Math.round((completedChaptersCount / totalChaptersCount) * 100)
    : 0;

  const subjects = Array.from(new Set([
    ...chapterProgress.map(c => c.chapters?.subject).filter(Boolean),
    ...testResults.map(t => t.tests?.subject).filter(Boolean)
  ]));

  // AI Summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-student-summary", {
        body: { studentId: selectedStudentId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAiSummary(data.summary);
      toast.success("AI summary generated successfully");
    },
    onError: (error: any) => {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate AI summary");
    },
  });

  const exportToCSV = () => {
    if (!selectedStudent) return;

    const csvContent = [
      ["Student Report"],
      ["Name", selectedStudent.name],
      ["Grade", selectedStudent.grade],
      [""],
      ["Attendance Summary"],
      ["Total Days", totalDays],
      ["Present", presentDays],
      ["Absent", totalDays - presentDays],
      ["Percentage", attendancePercentage + "%"],
      [""],
      ["Test Results"],
      ["Test Name", "Subject", "Marks Obtained", "Total Marks", "Date", "Answer Sheet URL"],
      ...testResults.map(r => [
        r.tests?.name,
        r.tests?.subject,
        r.marks_obtained,
        r.tests?.total_marks,
        format(new Date(r.date_taken), "PPP"),
        r.answersheet_url ? `https://YOUR_SUPABASE_BUCKET_URL/${r.answersheet_url}` : ""
      ])
    ].map(row => row.join(",")).join("\n");

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
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Grade & Student Selector */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Select Grade</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {[...new Set(students.map(s => s.grade))].map((grade) => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Select Student</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - Grade {student.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedStudent && (
        <>
          {/* Subject Filter for Test Results */}
          <Card>
            <CardHeader><CardTitle>Subject Filter</CardTitle></CardHeader>
            <CardContent>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarIcon /> Attendance Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="space-y-1"><p>Total Days</p><p className="text-2xl font-bold">{totalDays}</p></div>
                <div className="space-y-1"><p>Present</p><p className="text-2xl font-bold text-green-600">{presentDays}</p></div>
                <div className="space-y-1"><p>Absent</p><p className="text-2xl font-bold text-red-600">{totalDays - presentDays}</p></div>
                <div className="space-y-1"><p>Attendance %</p><p className="text-2xl font-bold">{attendancePercentage}%</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Chapter Progress */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen /> Chapter Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Filter by Subject</Label>
                <Select value={chapterSubjectFilter} onValueChange={setChapterSubjectFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {Array.from(new Set(chapterProgress.map(c => c.chapters?.subject))).map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p>Total Chapters: {totalChaptersCount}</p>
              <p>Completed: {completedChaptersCount}</p>
              <p>Progress: {chapterCompletionPercentage}%</p>
              {chapterProgress.map(cp => (
                <div key={cp.id} className="flex justify-between border p-2 my-1 rounded">
                  <div>
                    <p>{cp.chapters?.chapter_name}</p>
                    <p className="text-sm text-muted-foreground">{cp.chapters?.subject}</p>
                  </div>
                  <div>{cp.completed ? "Completed" : "In Progress"}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Test Results</CardTitle></CardHeader>
            <CardContent>
              <p>Total Tests: {totalTests}, Average: {averagePercentage}%</p>
              {testResults.map(r => (
                <div key={r.id} className="flex justify-between border p-2 my-1 rounded items-center">
                  <div>
                    <p>{r.tests?.name}</p>
                    <p className="text-sm text-muted-foreground">{r.tests?.subject} • {format(new Date(r.date_taken), "PPP")}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <p>{r.marks_obtained}/{r.tests?.total_marks}</p>
                    {r.answersheet_url && (
                      <a href={`https://YOUR_SUPABASE_BUCKET_URL/${r.answersheet_url}`} target="_blank" className="text-blue-600 underline">View</a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain /> AI Summary</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={() => generateSummaryMutation.mutate()} disabled={generateSummaryMutation.isLoading}>
                {generateSummaryMutation.isLoading ? "Generating..." : "Generate Summary"}
              </Button>
              <Textarea value={aiSummary} readOnly placeholder="AI summary will appear here..." />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
