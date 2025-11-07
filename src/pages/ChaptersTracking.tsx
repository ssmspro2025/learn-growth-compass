import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  grade: string;
}

interface ChapterRecord {
  id: string;
  student_id: string;
  date: string;
  subject: string;
  chapter_name: string;
  notes: string | null;
  students: { name: string };
}

export default function ChaptersTracking() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [notes, setNotes] = useState("");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade")
        .order("name");
      if (error) throw error;
      return data as Student[];
    },
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters_studied")
        .select("*, students(name)")
        .eq("date", dateStr)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChapterRecord[];
    },
  });

  const addChapterMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !subject || !chapterName) {
        throw new Error("Please fill all required fields");
      }

      const { error } = await supabase.from("chapters_studied").insert({
        student_id: selectedStudent,
        date: dateStr,
        subject,
        chapter_name: chapterName,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      setSelectedStudent("");
      setSubject("");
      setChapterName("");
      setNotes("");
      toast.success("Chapter added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add chapter");
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chapters_studied").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete chapter");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addChapterMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chapters Tracking</h2>
        <p className="text-muted-foreground">Track chapters studied by each student</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Chapter</CardTitle>
          <CardDescription>Record what chapter a student studied today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Physics"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter Name *</Label>
                <Input
                  id="chapter"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g., Quadratic Equations"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or topics covered"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              Add Chapter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chapters for {format(selectedDate, "PPP")}</CardTitle>
          <CardDescription>View all chapters studied on this date</CardDescription>
        </CardHeader>
        <CardContent>
          {chapters && chapters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="font-medium">{chapter.students.name}</TableCell>
                    <TableCell>{chapter.subject}</TableCell>
                    <TableCell>{chapter.chapter_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{chapter.notes || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteChapterMutation.mutate(chapter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No chapters recorded for this date
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
