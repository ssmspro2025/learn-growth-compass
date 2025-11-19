import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Users, Plus } from "lucide-react";
import { format } from "date-fns";

export default function ChaptersTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [subject, setSubject] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [notes, setNotes] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Popup filters
  const [popupGradeFilter, setPopupGradeFilter] = useState("all");
  const [showPresentOnly, setShowPresentOnly] = useState(false);

  // Fetch students
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

  // Fetch today's present students
  const { data: presentStudents = [] } = useQuery({
    queryKey: ["present-students", date, user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id")
        .eq("date", date)
        .eq("status", "present")
        .eq("center_id", user?.center_id);

      if (error) throw error;
      return data.map((x) => x.student_id);
    },
  });

  // Auto-select present students when toggled
  const handlePresentToggle = () => {
    if (!showPresentOnly) {
      // When enabling "present only" — auto-select present filtered students
      const filtered = students.filter(
        (s) =>
          presentStudents.includes(s.id) &&
          (popupGradeFilter === "all" || s.grade === popupGradeFilter)
      );
      setSelectedStudentIds(filtered.map((s) => s.id));
    }
    setShowPresentOnly(!showPresentOnly);
  };

  // Select all (respects filters)
  const selectAllStudents = () => {
    const filtered = students
      .filter((s) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
      .filter((s) => !showPresentOnly || presentStudents.includes(s.id));

    setSelectedStudentIds(filtered.map((s) => s.id));
  };

  // Select none
  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  // Fetch chapters (center restricted)
  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", filterSubject, filterStudent, filterGrade, user?.center_id],
    queryFn: async () => {
      let query = supabase
        .from("chapters")
        .select("*, student_chapters(*, students(name, grade, center_id))")
        .eq("center_id", user?.center_id)
        .order("date_taught", { ascending: false });

      if (filterSubject !== "all") query = query.eq("subject", filterSubject);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data;

      if (filterStudent !== "all") {
        filtered = filtered.filter((chapter: any) =>
          chapter.student_chapters.some((sc: any) => sc.student_id === filterStudent)
        );
      }

      if (filterGrade !== "all") {
        filtered = filtered.filter((chapter: any) =>
          chapter.student_chapters.some((sc: any) => sc.students.grade === filterGrade)
        );
      }

      return filtered;
    },
  });

  // Unique chapters
  const { data: uniqueChapters = [] } = useQuery({
    queryKey: ["unique-chapters", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, subject, chapter_name")
        .eq("center_id", user?.center_id);

      if (error) throw error;

      const seen = new Set();
      const unique = [];

      for (const c of data) {
        const key = `${c.subject}|${c.chapter_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(c);
        }
      }
      return unique;
    },
  });

  // Add chapter
  const addChapterMutation = useMutation({
    mutationFn: async () => {
      let chapterId: string;

      if (selectedChapterId) {
        const selected = uniqueChapters.find((c) => c.id === selectedChapterId);
        if (!selected) throw new Error("Chapter not found");

        const { data: chapterData, error } = await supabase
          .from("chapters")
          .insert({
            subject: selected.subject,
            chapter_name: selected.chapter_name,
            date_taught: date,
            notes: notes || null,
            center_id: user?.center_id, // FIX
          })
          .select()
          .single();

        if (error) throw error;
        chapterId = chapterData.id;
      } else {
        const { data: newChapter, error } = await supabase
          .from("chapters")
          .insert({
            subject,
            chapter_name: chapterName,
            date_taught: date,
            notes: notes || null,
            center_id: user?.center_id, // FIX
          })
          .select()
          .single();
        if (error) throw error;
        chapterId = newChapter.id;
      }

      const studentChapters = selectedStudentIds.map((id) => ({
        student_id: id,
        chapter_id: chapterId,
        completed: true,
        date_completed: date,
      }));

      const { error: linkError } = await supabase.from("student_chapters").insert(studentChapters);
      if (linkError) throw linkError;
    },

    onSuccess: () => {
      toast.success("Chapter Recorded");
      setSelectedStudentIds([]);
      setSelectedChapterId("");
      setSubject("");
      setChapterName("");
      setNotes("");
      setIsDialogOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const subjects = Array.from(new Set(chapters.map((c) => c.subject)));
  const grades = Array.from(new Set(students.map((s) => s.grade)));

  return (
    <div className="space-y-6">
      {/* Title & Record Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chapters Tracking</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Record Chapter</Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Chapter</DialogTitle>
            </DialogHeader>

            {/* Date */}
            <div className="space-y-4 py-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              {/* Select Previous Chapter */}
              <div className="border rounded-lg p-4">
                <Label>Select Previous Chapter</Label>
                <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    {uniqueChapters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.subject} - {c.chapter_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4">
                <Label>Create New Chapter</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label>Subject</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                  <div>
                    <Label>Chapter Name</Label>
                    <Input value={chapterName} onChange={(e) => setChapterName(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {/* Student Select */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label><Users className="h-4 w-4 inline mr-1" />Students ({selectedStudentIds.length})</Label>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAllStudents}>Select All</Button>
                    <Button size="sm" variant="outline" onClick={deselectAllStudents}>Clear</Button>
                  </div>
                </div>

                {/* Grade Filter */}
                <Label>Filter by Grade</Label>
                <Select value={popupGradeFilter} onValueChange={setPopupGradeFilter}>
                  <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Present Students Only */}
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="presentOnly" checked={showPresentOnly} onCheckedChange={handlePresentToggle} />
                  <label htmlFor="presentOnly">Show Present Students Only</label>
                </div>

                {/* Students list */}
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {students
                    .filter((s) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
                    .filter((s) => !showPresentOnly || presentStudents.includes(s.id))
                    .map((student) => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <label htmlFor={student.id}>
                          {student.name} (Grade {student.grade})
                        </label>
                      </div>
                    ))}
                </div>

                {/* Submit */}
                <Button
                  className="w-full"
                  disabled={
                    selectedStudentIds.length === 0 ||
                    (!selectedChapterId && (!subject || !chapterName)) ||
                    addChapterMutation.isPending
                  }
                  onClick={() => addChapterMutation.mutate()}
                >
                  Record Chapter for {selectedStudentIds.length} Student(s)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter & Display */}
      <Card>
        <CardHeader>
          <CardTitle>Chapters Taught</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Label>Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Student</Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Grade</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{chapter.chapter_name}</h3>
                    <p className="text-sm text-muted-foreground">{chapter.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(chapter.date_taught), "PPP")}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {chapter.student_chapters?.map((sc) => (
                        <span key={sc.id} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                          {sc.students?.name} - G{sc.students?.grade}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteChapterMutation.mutate(chapter.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {chapters.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No chapters recorded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
