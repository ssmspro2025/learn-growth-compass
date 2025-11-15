import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Save, X, UserPlus, Upload, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Student {
  id: string;
  name: string;
  grade: string;
  school_name: string;
  parent_name: string;
  contact_number: string;
  center_id: string;
}

type StudentInput = {
  name: string;
  grade: string;
  school_name: string;
  parent_name: string;
  contact_number: string;
  center_id?: string | null;
};

export default function RegisterStudent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  /** --- Single student form states --- */
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    school_name: "",
    parent_name: "",
    contact_number: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Student | null>(null);

  /** --- Parent account states --- */
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [selectedStudentForParent, setSelectedStudentForParent] = useState<Student | null>(null);
  const [parentUsername, setParentUsername] = useState("");
  const [parentPassword, setParentPassword] = useState("");

  /** --- Bulk upload states --- */
  const [csvPreviewRows, setCsvPreviewRows] = useState<StudentInput[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [multilineText, setMultilineText] = useState("");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [parsing, setParsing] = useState(false);

  /** --- Students query --- */
  const { data: students, isLoading } = useQuery({
    queryKey: ["students", user?.center_id],
    queryFn: async () => {
      let query = supabase.from("students").select("*").order("created_at", { ascending: false });
      if (user?.role !== "admin" && user?.center_id) {
        query = query.eq("center_id", user.center_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Student[];
    },
  });

  /** --- Single student mutations --- */
  const createMutation = useMutation({
    mutationFn: async (student: typeof formData) => {
      const { error } = await supabase.from("students").insert([{ ...student, center_id: user?.center_id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", user?.center_id] });
      setFormData({ name: "", grade: "", school_name: "", parent_name: "", contact_number: "" });
      toast.success("Student registered successfully!");
    },
    onError: () => toast.error("Failed to register student"),
  });

  const updateMutation = useMutation({
    mutationFn: async (student: Student) => {
      const { error } = await supabase
        .from("students")
        .update({
          name: student.name,
          grade: student.grade,
          school_name: student.school_name,
          parent_name: student.parent_name,
          contact_number: student.contact_number,
        })
        .eq("id", student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", user?.center_id] });
      setEditingId(null);
      setEditData(null);
      toast.success("Student updated successfully!");
    },
    onError: () => toast.error("Failed to update student"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", user?.center_id] });
      toast.success("Student deleted successfully!");
    },
    onError: () => toast.error("Failed to delete student"),
  });

  /** --- Parent account mutation --- */
  const createParentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentForParent) return;
      const { data, error } = await supabase.functions.invoke("create-parent-account", {
        body: {
          username: parentUsername,
          password: parentPassword,
          studentId: selectedStudentForParent.id,
          centerId: user?.center_id,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Parent account created successfully");
      setIsCreatingParent(false);
      setSelectedStudentForParent(null);
      setParentUsername("");
      setParentPassword("");
    },
    onError: (error: any) => toast.error(error.message || "Failed to create parent account"),
  });

  /** --- Bulk insert mutation --- */
  const bulkInsertMutation = useMutation({
    mutationFn: async (rows: StudentInput[]) => {
      if (!rows.length) return;
      const rowsWithCenter = rows.map((r) => ({ ...r, center_id: user?.center_id || null }));
      const { error } = await supabase.from("students").insert(rowsWithCenter);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", user?.center_id] });
      toast.success("Bulk students added successfully");
      setCsvPreviewRows([]);
      setMultilineText("");
      setShowPreviewDialog(false);
    },
    onError: (error: any) => toast.error(error.message || "Bulk insert failed"),
  });

  /** --- CSV / multiline parsing helpers --- */
  const parseCSV = (csv: string): string[][] => {
    const rows: string[][] = [];
    let current = "", row: string[] = [], inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
      const ch = csv[i], nxt = csv[i + 1];
      if (ch === '"') {
        if (inQuotes && nxt === '"') { current += '"'; i++; } 
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) { row.push(current.trim()); current = ""; } 
      else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (current !== "" || row.length > 0) { row.push(current.trim()); rows.push(row); row = []; current = ""; }
        if (ch === "\r" && csv[i + 1] === "\n") i++;
      } else { current += ch; }
    }
    if (current !== "" || row.length > 0) { row.push(current.trim()); rows.push(row); }
    return rows;
  };

  const mapRowsToStudents = (rows: string[][]): { rows: StudentInput[]; errors: string[] } => {
    const errors: string[] = [];
    if (!rows || rows.length === 0) return { rows: [], errors };
    const header = rows[0].map((h) => h.toLowerCase());
    let startIndex = 0, hasHeader = ["name", "grade", "school_name", "parent_name", "contact_number"].every(f => header.includes(f));
    if (hasHeader) startIndex = 1;
    const output: StudentInput[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const cols = rows[i];
      const student: StudentInput = hasHeader
        ? {
            name: (cols[header.indexOf("name")] || "").trim(),
            grade: (cols[header.indexOf("grade")] || "").trim(),
            school_name: (cols[header.indexOf("school_name")] || cols[header.indexOf("school")] || "").trim(),
            parent_name: (cols[header.indexOf("parent_name")] || cols[header.indexOf("parent")] || "").trim(),
            contact_number: (cols[header.indexOf("contact_number")] || cols[header.indexOf("contact")] || "").trim(),
          }
        : {
            name: (cols[0] || "").trim(),
            grade: (cols[1] || "").trim(),
            school_name: (cols[2] || "").trim(),
            parent_name: (cols[3] || "").trim(),
            contact_number: (cols[4] || "").trim(),
          };
      const rowNumber = i + 1;
      const rowErrors: string[] = [];
      if (!student.name) rowErrors.push(`Row ${rowNumber}: name is required`);
      if (!student.grade) rowErrors.push(`Row ${rowNumber}: grade is required`);
      if (!student.contact_number) rowErrors.push(`Row ${rowNumber}: contact_number is required`);
      if (rowErrors.length) errors.push(...rowErrors);
      else output.push(student);
    }

    // Deduplicate
    const unique: StudentInput[] = [];
    const seenContacts = new Set<string>();
    for (const s of output) {
      const key = s.contact_number || `${s.name}|${s.grade}`;
      if (!seenContacts.has(key)) { unique.push(s); seenContacts.add(key); } 
      else errors.push(`Duplicate in batch: ${key}`);
    }

    return { rows: unique, errors };
  };

  /** --- CSV file handler --- */
  const handleCsvFile = (file: File | null) => {
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const { rows, errors } = mapRowsToStudents(parseCSV(text));
      setCsvPreviewRows(rows);
      setCsvErrors(errors);
      setShowPreviewDialog(true);
      setParsing(false);
    };
    reader.onerror = () => { toast.error("Failed to read file"); setParsing(false); };
    reader.readAsText(file);
  };

  /** --- Multiline paste handler --- */
  const handleParseMultiline = () => {
    if (!multilineText.trim()) return toast.error("No text to parse");
    setParsing(true);
    const normalized = multilineText.replace(/\|/g, ",");
    const { rows, errors } = mapRowsToStudents(parseCSV(normalized));
    setCsvPreviewRows(rows);
    setCsvErrors(errors);
    setShowPreviewDialog(true);
    setParsing(false);
  };

  /** --- CSV template download --- */
  const downloadTemplate = () => {
    const csv = ["name,grade,school_name,parent_name,contact_number", "John Doe,6,ABC School,Robert Doe,9812345678"].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "students-template.csv";
    a.click();
  };

  /** --- Bulk insert confirm --- */
  const handleBulkInsertConfirm = () => {
    if (!csvPreviewRows.length) return toast.error("No rows to insert");
    bulkInsertMutation.mutate(csvPreviewRows);
  };

  /** --- Handlers for single student --- */
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData); };
  const handleEdit = (student: Student) => { setEditingId(student.id); setEditData({ ...student }); };
  const handleSave = () => { if (editData) updateMutation.mutate(editData); };
  const handleCancel = () => { setEditingId(null); setEditData(null); };
  const handleCreateParentAccount = (student: Student) => { setSelectedStudentForParent(student); setParentUsername(""); setParentPassword(""); setIsCreatingParent(true); };

  /** --- Render --- */
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Register Student</h2>
      <p className="text-muted-foreground">Add new students to the attendance system</p>

      {/* Single Student Form */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Fill in the details to register a new student</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Input id="grade" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school_name">School Name *</Label>
                <Input id="school_name" value={formData.school_name} onChange={(e) => setFormData({ ...formData, school_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_name">Parent's Name *</Label>
                <Input id="parent_name" value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input id="contact_number" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} required />
              </div>
            </div>
            <Button type="submit">Register Student</Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Students</CardTitle>
          <CardDescription>Upload multiple students via CSV or paste rows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={(e) => handleCsvFile(e.target.files?.[0] ?? null)} className="hidden" />
            <label htmlFor="csv-upload">
              <Button type="button" variant="outline" size="sm"><Upload className="inline-block mr-2 h-4 w-4"/>Upload CSV</Button>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}><Download className="inline-block mr-2 h-4 w-4"/>CSV Template</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { const el = document.getElementById("multiline-area"); if(el) el.style.display = el.style.display === "none" ? "block" : "none"; }}>Paste Rows</Button>
          </div>

          <div id="multiline-area" style={{ display: "none" }}>
            <Label>Paste rows (name, grade, school_name, parent_name, contact_number)</Label>
            <Textarea value={multilineText} onChange={(e) => setMultilineText(e.target.value)} placeholder="John Doe,6,ABC School,Robert Doe,9812345678" rows={5} />
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={handleParseMultiline}>Parse & Preview</Button>
              <Button type="button" variant="outline" onClick={() => setMultilineText("")}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Parsed Rows</DialogTitle>
            <DialogDescription>Review parsed rows before inserting. Errors are listed below.</DialogDescription>
          </DialogHeader>

          {csvErrors.length > 0 && (
            <div className="p-3 bg-red-50 rounded border border-red-100">
              <p className="font-semibold text-red-700">Errors:</p>
              <ul className="list-disc ml-6 text-sm text-red-700">{csvErrors.map((e,i)=><li key={i}>{e}</li>)}</ul>
            </div>
          )}

          <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded mt-2">
            <table className="min-w-full">
              <thead className="bg-muted"><tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Grade</th>
                <th className="px-3 py-2 text-left">School</th>
                <th className="px-3 py-2 text-left">Parent</th>
                <th className="px-3 py-2 text-left">Contact</th>
              </tr></thead>
              <tbody>
                {csvPreviewRows.map((r,i)=>(<tr key={i}>
                  <td className="border px-2 py-1">{r.name}</td>
                  <td className="border px-2 py-1">{r.grade}</td>
                  <td className="border px-2 py-1">{r.school_name}</td>
                  <td className="border px-2 py-1">{r.parent_name}</td>
                  <td className="border px-2 py-1">{r.contact_number}</td>
                </tr>))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button type="button" onClick={handleBulkInsertConfirm} disabled={!csvPreviewRows.length || csvErrors.length > 0}>
              <Save className="inline-block mr-2 h-4 w-4"/>Insert All
            </Button>
            <Button type="button" variant="outline" onClick={()=>setShowPreviewDialog(false)}><X className="inline-block mr-2 h-4 w-4"/>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Table */}
      <Card>
        <CardHeader><CardTitle>Students</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
              ) : students && students.length ? (
                students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{editingId === s.id ? <Input value={editData?.name} onChange={(e)=>setEditData(d=>d?{...d,name:e.target.value}:d)} /> : s.name}</TableCell>
                    <TableCell>{editingId === s.id ? <Input value={editData?.grade} onChange={(e)=>setEditData(d=>d?{...d,grade:e.target.value}:d)} /> : s.grade}</TableCell>
                    <TableCell>{editingId === s.id ? <Input value={editData?.school_name} onChange={(e)=>setEditData(d=>d?{...d,school_name:e.target.value}:d)} /> : s.school_name}</TableCell>
                    <TableCell>{editingId === s.id ? <Input value={editData?.parent_name} onChange={(e)=>setEditData(d=>d?{...d,parent_name:e.target.value}:d)} /> : s.parent_name}</TableCell>
                    <TableCell>{editingId === s.id ? <Input value={editData?.contact_number} onChange={(e)=>setEditData(d=>d?{...d,contact_number:e.target.value}:d)} /> : s.contact_number}</TableCell>
                    <TableCell className="flex gap-2">
                      {editingId === s.id ? (
                        <>
                          <Button size="sm" onClick={handleSave}><Save /></Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}><X /></Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={()=>handleEdit(s)}><Pencil /></Button>
                          <Button size="sm" variant="destructive" onClick={()=>deleteMutation.mutate(s.id)}><Trash2 /></Button>
                          <Button size="sm" onClick={()=>handleCreateParentAccount(s)}><UserPlus /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6}>No students yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Parent Account Dialog */}
      <Dialog open={isCreatingParent} onOpenChange={setIsCreatingParent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Parent Account</DialogTitle>
            <DialogDescription>Assign a parent account for {selectedStudentForParent?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Username" value={parentUsername} onChange={(e)=>setParentUsername(e.target.value)} />
            <Input placeholder="Password" type="password" value={parentPassword} onChange={(e)=>setParentPassword(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button onClick={()=>createParentMutation.mutate()}>Create</Button>
              <Button variant="outline" onClick={()=>setIsCreatingParent(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
