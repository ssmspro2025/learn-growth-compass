import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Upload, Download, Eye } from "lucide-react";
import { format } from "date-fns";

const Homework = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [homeworkForm, setHomeworkForm] = useState({
    subject: "",
    title: "",
    description: "",
    grade: "",
    assignment_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(), "yyyy-MM-dd")
  });

  // Fetch homework
  const { data: homework = [] } = useQuery({
    queryKey: ["homework", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .eq("center_id", user?.center_id!)
        .order("assignment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  // Create homework mutation
  const createHomeworkMutation = useMutation({
    mutationFn: async () => {
      // First create homework record
      const { data: homeworkData, error: homeworkError } = await supabase
        .from("homework")
        .insert({
          ...homeworkForm,
          center_id: user?.center_id,
          created_by: user?.id
        })
        .select()
        .single();

      if (homeworkError) throw homeworkError;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("homework-files")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Update homework with file info
        const { error: updateError } = await supabase
          .from("homework")
          .update({
            attachment_url: fileName,
            attachment_name: selectedFile.name
          })
          .eq("id", homeworkData.id);

        if (updateError) throw updateError;
      }

      return homeworkData;
    },
    onSuccess: () => {
      toast.success("Homework created successfully");
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create homework");
    }
  });

  const resetForm = () => {
    setHomeworkForm({
      subject: "",
      title: "",
      description: "",
      grade: "",
      assignment_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(), "yyyy-MM-dd")
    });
    setSelectedFile(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    createHomeworkMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const downloadAttachment = async (fileName: string, displayName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("homework-files")
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = displayName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Failed to download file");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Homework Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Homework
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign New Homework</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={homeworkForm.subject}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade *</Label>
                  <Input
                    id="grade"
                    value={homeworkForm.grade}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, grade: e.target.value })}
                    placeholder="e.g., Grade 5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={homeworkForm.title}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                  placeholder="Enter homework title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  placeholder="Enter homework description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment_date">Assignment Date *</Label>
                  <Input
                    id="assignment_date"
                    type="date"
                    value={homeworkForm.assignment_date}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, assignment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={homeworkForm.due_date}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachment">Attachment</Label>
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Assign Homework
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homework Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {homework.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No homework assignments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Attachment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homework.map((hw: any) => (
                  <TableRow key={hw.id}>
                    <TableCell className="font-medium">{hw.title}</TableCell>
                    <TableCell>{hw.subject}</TableCell>
                    <TableCell>{hw.grade}</TableCell>
                    <TableCell>{format(new Date(hw.assignment_date), "PPP")}</TableCell>
                    <TableCell>{format(new Date(hw.due_date), "PPP")}</TableCell>
                    <TableCell>
                      {hw.attachment_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(hw.attachment_url, hw.attachment_name || "attachment")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{hw.status || "assigned"}</span>
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
};

export default Homework;