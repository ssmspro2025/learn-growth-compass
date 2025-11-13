import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChaptersTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [chapterName, setChapterName] = useState<string>("");

  // Fetch students filtered by center
  const { data: students = [] } = useQuery({
    queryKey: ["students", user?.center_id],
    queryFn: async () => {
      let query = supabase.from("students").select("*").order("name");
      if (user?.role !== "admin" && user?.center_id) {
        query = query.eq("center_id", user.center_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch chapters completed by selected student
  const { data: studentChapters = [] } = useQuery({
    queryKey: ["student-chapters", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("student_chapters")
        .select("*, chapters(*)")
        .eq("student_id", selectedStudentId)
        .order("date_completed", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  // Fetch all chapters
  const { data: allChapters = [] } = useQuery({
    queryKey: ["all-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chapters").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Add new chapter progress
  const addChapterMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId || !chapterName) return;
      const { data, error } = await supabase.from("student_chapters").insert({
        student_id: selectedStudentId,
        chapter_name: chapterName,
        completed: true,
        date_completed: new Date(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Chapter progress added!");
      queryClient.invalidateQueries(["student-chapters", selectedStudentId]);
      setChapterName("");
    },
    onError: () => {
      toast.error("Failed to add chapter");
    },
  });

  return (
    <div className="space-y-6">
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
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} - Grade {student.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStudentId && (
        <>
          {/* Add New Chapter */}
          <Card>
            <CardHeader>
              <CardTitle>Add Chapter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Chapter Name"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                />
                <Button onClick={() => addChapterMutation.mutate()}>Add</Button>
              </div>
            </CardContent>
          </Card>

          {/* Chapter Progress List */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {studentChapters.length > 0 ? (
                studentChapters.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <p className="font-medium">{ch.chapter_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ch.completed ? "Completed" : "In Progress"} • {new Date(ch.date_completed).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No chapters recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
