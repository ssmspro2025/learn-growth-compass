import { useState, useEffect, useCallback } from "react";
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

/**
 * ChaptersTracking component
 *
 * - Preserves original features.
 * - Adds popup grade filter, show-present-only (for selected date), auto-select present students.
 * - Select All respects filters.
 * - Ensures chapters are center-scoped and new chapters store center_id.
 * - Fixes auto-select-on-date-change by normalizing dates and watching date + presentStudents.
 */

export default function ChaptersTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ----------------------------
  // Core states (original)
  // ----------------------------
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd")); // primary 'date' used in popup and mutations
  const [subject, setSubject] = useState<string>("");
  const [chapterName, setChapterName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // ----------------------------
  // Popup-specific requested features
  // ----------------------------
  const [popupGradeFilter, setPopupGradeFilter] = useState<string>("all");
  const [showPresentOnly, setShowPresentOnly] = useState<boolean>(false);
  const [autoSelectPresent, setAutoSelectPresent] = useState<boolean>(true);

  // ----------------------------
  // Helper: normalize date string to YYYY-MM-DD
  // Ensures we compare the same format whether the input returns "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM"
  // ----------------------------
  const normalizeDate = useCallback((d: string | undefined) => {
    if (!d) return "";
    // If string contains 'T', split off time
    if (d.includes("T")) return d.split("T")[0];
    // If it contains a space and time, split
    if (d.includes(" ")) return d.split(" ")[0];
    // Otherwise assume YYYY-MM-DD or already normalized
    return d;
  }, []);

  // ----------------------------
  // Fetch students (center-scoped)
  // ----------------------------
  const { data: students = [] } = useQuery({
    queryKey: ["students", user?.center_id],
    queryFn: async () => {
      let query = supabase.from("students").select("*").order("name", { ascending: true });

      // If not an admin, limit to own center
      if (user?.role !== "admin" && user?.center_id) {
        query = query.eq("center_id", user.center_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });

  // Derived grade list for selects
  const grades = Array.from(new Set((students || []).map((s: any) => s.grade))).filter(Boolean);

  // ----------------------------
  // Fetch present students for the selected date (works for past dates)
  // ----------------------------
  // Use normalized date for query key & equality checks
  const normalizedDate = normalizeDate(date);

  const { data: presentStudents = [] } = useQuery({
    queryKey: ["present-students", normalizedDate, user?.center_id],
    queryFn: async () => {
      if (!normalizedDate || !user?.center_id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id")
        .eq("date", normalizedDate)
        .eq("center_id", user?.center_id)
        .eq("status", "present");

      if (error) throw error;
      return (data || []).map((r: any) => r.student_id);
    },
    enabled: !!normalizedDate && !!user?.center_id,
    staleTime: 1000 * 30,
  });

  // ----------------------------
  // Auto-select present students when date or presentStudents change (fixes the bug)
  // - Runs even if presentStudents is empty (so it clears selection if nobody present)
  // - Respects popupGradeFilter (auto selects only those present + matching grade)
  // ----------------------------
  useEffect(() => {
    if (!normalizedDate) return;

    if (autoSelectPresent) {
      const autoSelected = (students || [])
        .filter((s: any) => presentStudents.includes(s.id))
        .filter((s: any) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
        .map((s: any) => s.id);

      setSelectedStudentIds(autoSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentStudents, normalizedDate, autoSelectPresent, popupGradeFilter, students]);

  // ----------------------------
  // Fetch chapters (center-scoped) and apply index-level filters
  // ----------------------------
  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", filterSubject, filterStudent, filterGrade, user?.center_id],
    queryFn: async () => {
      let query = supabase
        .from("chapters")
        .select("*, student_chapters(*, students(name, grade, center_id))")
        .eq("center_id", user?.center_id) // center scoping — prevents cross-center leakage
        .order("date_taught", { ascending: false });

      if (filterSubject !== "all") query = query.eq("subject", filterSubject);

      const { data, error } = await query;
      if (error) throw error;
      let filtered = data || [];

      if (filterStudent !== "all") {
        filtered = filtered.filter((chapter: any) =>
          chapter.student_chapters?.some((sc: any) => sc.student_id === filterStudent)
        );
      }

      if (filterGrade !== "all") {
        filtered = filtered.filter((chapter: any) =>
          chapter.student_chapters?.some((sc: any) => sc.students?.grade === filterGrade)
        );
      }

      return filtered;
    },
    staleTime: 1000 * 30,
  });

  // ----------------------------
  // Unique chapters for Select (center-scoped)
  // ----------------------------
  const { data: uniqueChapters = [] } = useQuery({
    queryKey: ["unique-chapters", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, subject, chapter_name")
        .eq("center_id", user?.center_id);

      if (error) throw error;
      const seen = new Set<string>();
      const unique: any[] = [];
      for (const chapter of (data || [])) {
        const key = `${chapter.subject}|${chapter.chapter_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(chapter);
        }
      }
      return unique;
    },
    staleTime: 1000 * 60,
  });

  // ----------------------------
  // Add chapter mutation (inserts center_id)
  // ----------------------------
  const addChapterMutation = useMutation({
    mutationFn: async () => {
      let chapterId: string;

      if (selectedChapterId) {
        const selected = (uniqueChapters || []).find((c: any) => c.id === selectedChapterId);
        if (!selected) throw new Error("Chapter not found");

        const { data: chapterData, error } = await supabase
          .from("chapters")
          .insert({
            subject: selected.subject,
            chapter_name: selected.chapter_name,
            date_taught: normalizedDate,
            notes: notes || null,
            center_id: user?.center_id,
          })
          .select()
          .single();

        if (error) throw error;
        chapterId = chapterData.id;
      } else if (subject && chapterName) {
        const { data: chapterData, error } = await supabase
          .from("chapters")
          .insert({
            subject,
            chapter_name: chapterName,
            date_taught: normalizedDate,
            notes: notes || null,
            center_id: user?.center_id,
          })
          .select()
          .single();

        if (error) throw error;
        chapterId = chapterData.id;
      } else {
        throw new Error("Select a previous chapter or enter a new one");
      }

      // link students if any selected
      if (selectedStudentIds.length > 0) {
        const studentChapters = selectedStudentIds.map((studentId) => ({
          student_id: studentId,
          chapter_id: chapterId,
          completed: true,
          date_completed: normalizedDate,
        }));

        const { error: linkError } = await supabase.from("student_chapters").insert(studentChapters);
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["unique-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["present-students", normalizedDate, user?.center_id] });
      toast.success("Chapter recorded for selected students");
      // reset popup state (but keep date as user likely wants to record multiple for same date)
      setSelectedStudentIds([]);
      setSubject("");
      setChapterName("");
      setNotes("");
      setSelectedChapterId("");
      setPopupGradeFilter("all");
      setShowPresentOnly(false);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record chapter");
    },
  });

  // ----------------------------
  // Delete chapter mutation
  // ----------------------------
  const deleteChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      // optional: remove student_chapters first if your DB requires that
      const { error } = await supabase.from("chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete chapter");
    },
  });

  // ----------------------------
  // Selection helpers
  // ----------------------------
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Select all respects popup grade filter & present-only filter
  const selectAllStudents = () => {
    const filtered = (students || [])
      .filter((s: any) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
      .filter((s: any) => !showPresentOnly || presentStudents.includes(s.id));
    setSelectedStudentIds(filtered.map((s: any) => s.id));
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  // Toggle present-only: when enabling, auto-select present students respecting grade filter.
  const handlePresentOnlyToggle = () => {
    const next = !showPresentOnly;
    setShowPresentOnly(next);

    if (next) {
      const filtered = (students || [])
        .filter((s: any) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
        .filter((s: any) => presentStudents.includes(s.id));
      setSelectedStudentIds(filtered.map((s: any) => s.id));
    } else {
      // do not automatically clear selection when turning presentOnly off (may be desired)
    }
  };

  // When popupGradeFilter changes and autoSelectPresent is on, update selection (keeps selection consistent)
  useEffect(() => {
    if (autoSelectPresent) {
      const auto = (students || [])
        .filter((s: any) => presentStudents.includes(s.id))
        .filter((s: any) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
        .map((s: any) => s.id);
      setSelectedStudentIds(auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupGradeFilter]);

  // Derived subjects for filter
  const subjects = Array.from(new Set((chapters || []).map((c: any) => c.subject))).filter(Boolean);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="space-y-6">
      {/* Header + Record Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chapters Tracking</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Chapter
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Chapter</DialogTitle>
              <DialogDescription>
                Select a previously taught chapter or create a new one
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Date - using setDate with normalized value */}
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    // normalize and set; normalizedDate will update presentStudents query
                    const nd = normalizeDate(e.target.value);
                    setDate(nd);
                    // clear selection first; autoSelectPresent effect will repopulate if enabled
                    setSelectedStudentIds([]);
                  }}
                />
              </div>

              {/* Select previous chapter */}
              <div className={`space-y-3 border rounded-lg p-4 ${selectedChapterId ? "border-primary" : ""}`}>
                <Label className="text-base font-semibold">Select from Previous Chapters</Label>
                {uniqueChapters.length > 0 ? (
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a chapter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueChapters.map((chapter: any) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.subject} - {chapter.chapter_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">No previous chapters found.</p>
                )}
              </div>

              {/* Divider "Or" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Create new chapter */}
              <div className={`space-y-3 border rounded-lg p-4 ${subject && chapterName ? "border-primary" : ""}`}>
                <Label className="text-base font-semibold">Create New Chapter</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Subject</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Mathematics" />
                  </div>
                  <div>
                    <Label>Chapter Name</Label>
                    <Input value={chapterName} onChange={(e) => setChapterName(e.target.value)} placeholder="e.g., Algebra" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>

              {/* Student selection area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Students ({selectedStudentIds.length} selected)
                  </Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllStudents}>
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={deselectAllStudents}>
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Grade filter inside popup */}
                <div className="mt-2">
                  <Label>Filter by Grade</Label>
                  <Select value={popupGradeFilter} onValueChange={setPopupGradeFilter}>
                    <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map((g: any) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show present only & Auto-select toggles */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="presentOnly" checked={showPresentOnly} onCheckedChange={handlePresentOnlyToggle} />
                    <label htmlFor="presentOnly" className="text-sm font-medium leading-none cursor-pointer">
                      Show Present Students Only (for selected date)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="autoSelect" checked={autoSelectPresent} onCheckedChange={() => setAutoSelectPresent(!autoSelectPresent)} />
                    <label htmlFor="autoSelect" className="text-sm font-medium leading-none cursor-pointer">
                      Auto-select present students
                    </label>
                  </div>
                </div>

                {/* Students list */}
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {(students || [])
                    .filter((s: any) => popupGradeFilter === "all" || s.grade === popupGradeFilter)
                    .filter((s: any) => !showPresentOnly || (presentStudents || []).includes(s.id))
                    .map((student: any) => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <label htmlFor={student.id} className="text-sm font-medium leading-none cursor-pointer">
                          {student.name} - Grade {student.grade}
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Submit button */}
              <Button
                onClick={() => addChapterMutation.mutate()}
                disabled={
                  selectedStudentIds.length === 0 ||
                  (!selectedChapterId && (!subject || !chapterName)) ||
                  addChapterMutation.isLoading
                }
                className="w-full"
              >
                Record Chapter for {selectedStudentIds.length} Student(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapters list & filters */}
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
                  {subjects.map((subj: any) => <SelectItem key={subj} value={subj}>{subj}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by Student</Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {(students || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by Grade</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((g: any) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {(chapters || []).map((chapter: any) => (
              <div key={chapter.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{chapter.chapter_name}</h3>
                      <span className="text-sm text-muted-foreground">{chapter.subject}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Date Taught: {chapter.date_taught ? format(new Date(chapter.date_taught), "PPP") : "-"}
                    </p>
                    {chapter.notes && <p className="text-sm mb-2">{chapter.notes}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {chapter.student_chapters?.map((sc: any) => (
                        <span key={sc.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {sc.students?.name} - Grade {sc.students?.grade}
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
            {(chapters || []).length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No chapters recorded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
