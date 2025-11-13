import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Users, Plus, Edit2 } from "lucide-react";
import { format } from "date-fns";

export default function ChaptersTracking() {
  const queryClient = useQueryClient();

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [subject, setSubject] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [notes, setNotes] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");

  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all chapters with student link
  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", filterSubject, filterStudent],
    queryFn: async () => {
      let query = supabase
        .from("chapters")
        .select("*, student_chapters(*, students(name, grade))")
        .order("date_taught", { ascending: false });

      if (filterSubject !== "all") query = query.eq("subject", filterSubject);

      const { data, error } = await query;
      if (error) throw error;

      if (filterStudent !== "all") {
        return data.filter((chapter: any) =>
          chapter.student_chapters?.some((sc: any) => sc.student_id === filterStudent)
        );
      }

      return data;
    },
  });

  // Fetch unique chapters for selection
  const { data: uniqueChapters = [] } = useQuery({
    queryKey: ["unique-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, subject, chapter_name")
        .order("subject, chapter_name");
      if (error) throw error;

      const seen = new Set<string>();
      const unique = [];
      for (const chapter of data) {
        const key = `${chapter.subject}|${chapter.chapter_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(chapter);
        }
      }
      return unique;
    },
  });

  // Add or update chapter
  const saveChapterMutation = useMutation({
    mutationFn: async () => {
      let chapterId: string;

      if (editingChapter) {
        // Update chapter
        const { error } = await supabase
          .from("chapters")
          .update({
            subject,
            chapter_name: chapterName,
            date_taught: date,
            notes: notes || null,
          })
          .eq("id", editingChapter.id);

        if (error) throw error;

        chapterId = editingChapter.id;

        // Update student_chapters link
        const { error: deleteError } = await supabase
          .from("student_chapters")
          .delete()
          .eq("chapter_id", chapterId);

        if (deleteError) throw deleteError;

        const studentChapters = selectedStudentIds.map((studentId) => ({
          student_id: studentId,
          chapter_id: chapterId,
          completed: true,
          date_completed: date,
        }));

        const { error: insertError } = await supabase
          .from("student_chapters")
          .insert(studentChapters);

        if (insertError) throw insertError;

      } else {
        // Create new chapter
        if (isCreatingNew) {
          const { data: chapterData, error: chapterError } = await supabase
            .from("chapters")
            .insert({
              subject,
              chapter_name: chapterName,
              date_taught: date,
              notes: notes || null,
            })
            .select()
            .single();
          if (chapterError) throw chapterError;
          chapterId = chapterData.id;
        } else {
          const selected = uniqueChapters.find(c => c.id === selectedChapterId);
          if (!selected) throw new Error("Chapter not found");

          const { data: chapterData, error: chapterError } = await supabase
            .from("chapters")
            .insert({
              subject: selected.subject,
              chapter_name: selected.chapter_name,
              date_taught: date,
              notes: notes || null,
            })
            .select()
            .single();
          if (chapterError) throw chapterError;
          chapterId = chapterData.id;
        }

        const studentChapters = selectedStudentIds.map((studentId) => ({
          student_id: studentId,
          chapter_id: chapterId,
          completed: true,
          date_completed: date,
        }));

        const { error: linkError } = await supabase.from("student_chapters").insert(studentChapters);
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["chapters"]);
      queryClient.invalidateQueries(["unique-chapters"]);
      toast.success(editingChapter ? "Chapter updated" : "Chapter recorded");
      resetDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save chapter");
    },
  });

  // Delete chapter
  const deleteChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["chapters"]);
      toast.success("Chapter deleted");
    },
    onError: () => toast.error("Failed to delete chapter"),
  });

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllStudents = () => setSelectedStudentIds(students.map(s => s.id));

  const openEditDialog = (chapter: any) => {
    setEditingChapter(chapter);
    setSubject(chapter.subject);
    setChapterName(chapter.chapter_name);
    setNotes(chapter.notes || "");
    setDate(format(new Date(chapter.date_taught), "yyyy-MM-dd"));
    setSelectedStudentIds(chapter.student_chapters?.map((sc: any) => sc.student_id) || []);
    setIsCreatingNew(false);
    setIsDialogOpen(true);
  };

  const resetDialog = () => {
    setEditingChapter(null);
    setSelectedStudentIds([]);
    setSubject("");
    setChapterName("");
    setNotes("");
    setSelectedChapterId("");
    setIsCreatingNew(false);
    setIsDialogOpen(false);
  };

  const subjects = Array.from(new Set(chapters.map((c: any) => c.subject)));

  return (
    <div className="space-y-6">
      {/* Header and Dialog */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chapters Tracking</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Record Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingChapter ? "Edit Chapter" : "Record Chapter"}</DialogTitle>
              <DialogDescription>
                {editingChapter ? "Edit previously recorded chapter" : "Select a previous chapter or create a new one"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              {!editingChapter && (
                <>
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                    <Label className="text-base font-semibold">Select from Previous Chapters</Label>
                    {uniqueChapters.length > 0 ? (
                      <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a chapter..." />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueChapters.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.subject} - {c.chapter_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">No previous chapters found. Create a new one below.</p>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3 border rounded-lg p-4">
                <Label className="text-base font-semibold">{editingChapter ? "Edit Chapter" : "Create New Chapter"}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Subject</Label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Mathematics" />
                  </div>
                  <div>
                    <Label>Chapter Name</Label>
                    <Input value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g., Algebra" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Select Students ({selectedStudentIds.length} selected)
                  </Label>
                  <Button variant="outline" size="sm" onClick={selectAllStudents}>Select All</Button>
                </div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={s.id}
                        checked={selectedStudentIds.includes(s.id)}
                        onCheckedChange={() => toggleStudentSelection(s.id)}
                      />
                      <label htmlFor={s.id} className="text-sm font-medium leading-none cursor-pointer">
                        {s.name} - Grade {s.grade}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => saveChapterMutation.mutate()}
                disabled={selectedStudentIds.length === 0 || !subject || !chapterName || saveChapterMutation.isPending}
                className="w-full"
              >
                {editingChapter ? "Save Changes" : `Record Chapter for ${selectedStudentIds.length} Student(s)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapters List */}
      <Card>
        <CardHeader>
          <CardTitle>Chapters Taught</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Label>Filter by Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subj => <SelectItem key={subj} value={subj}>{subj}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by Student</Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chapters.map((chapter: any) => (
              <div key={chapter.id} className="border rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{chapter.chapter_name}</h3>
                    <span className="text-sm text-muted-foreground">{chapter.subject}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Date Taught: {format(new Date(chapter.date_taught), "PPP")}
                  </p>
                  {chapter.notes && <p className="text-sm mb-2">{chapter.notes}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {chapter.student_chapters?.map((sc: any) => (
                      <span
                        key={sc.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {sc.students?.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(chapter)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteChapterMutation.mutate(chapter.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {chapters.length === 0 && <p className="text-muted-foreground text-center py-8">No chapters recorded yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
