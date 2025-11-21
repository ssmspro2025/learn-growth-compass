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
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";

const Activities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [activityForm, setActivityForm] = useState({
    activity_type_id: "",
    title: "",
    description: "",
    activity_date: format(new Date(), "yyyy-MM-dd"),
    duration_minutes: "",
    grade: "",
    notes: ""
  });

  // Fetch activity types
  const { data: activityTypes = [] } = useQuery({
    queryKey: ["activity-types", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("center_id", user?.center_id!)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, activity_types(name), users(username)")
        .eq("center_id", user?.center_id!)
        .eq("is_active", true)
        .order("activity_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("activities")
        .insert({
          ...activityForm,
          center_id: user?.center_id,
          created_by: user?.id,
          duration_minutes: activityForm.duration_minutes ? parseInt(activityForm.duration_minutes) : null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity created successfully");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create activity");
    }
  });

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("activities")
        .update({
          ...activityForm,
          duration_minutes: activityForm.duration_minutes ? parseInt(activityForm.duration_minutes) : null
        })
        .eq("id", editingActivity.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity updated successfully");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update activity");
    }
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("activities")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete activity");
    }
  });

  const resetForm = () => {
    setActivityForm({
      activity_type_id: "",
      title: "",
      description: "",
      activity_date: format(new Date(), "yyyy-MM-dd"),
      duration_minutes: "",
      grade: "",
      notes: ""
    });
    setEditingActivity(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (editingActivity) {
      updateActivityMutation.mutate();
    } else {
      createActivityMutation.mutate();
    }
  };

  const handleEdit = (activity: any) => {
    setEditingActivity(activity);
    setActivityForm({
      activity_type_id: activity.activity_type_id,
      title: activity.title,
      description: activity.description || "",
      activity_date: activity.activity_date,
      duration_minutes: activity.duration_minutes?.toString() || "",
      grade: activity.grade || "",
      notes: activity.notes || ""
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activities Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? "Edit Activity" : "Add New Activity"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity_type">Activity Type *</Label>
                  <Select
                    value={activityForm.activity_type_id}
                    onValueChange={(value) => setActivityForm({ ...activityForm, activity_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity_date">Date *</Label>
                  <Input
                    id="activity_date"
                    type="date"
                    value={activityForm.activity_date}
                    onChange={(e) => setActivityForm({ ...activityForm, activity_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  placeholder="Enter activity title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  placeholder="Enter activity description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={activityForm.duration_minutes}
                    onChange={(e) => setActivityForm({ ...activityForm, duration_minutes: e.target.value })}
                    placeholder="e.g., 60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={activityForm.grade}
                    onChange={(e) => setActivityForm({ ...activityForm, grade: e.target.value })}
                    placeholder="e.g., Grade 5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingActivity ? "Update Activity" : "Create Activity"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activities List</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activities found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity: any) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>{activity.activity_types?.name}</TableCell>
                    <TableCell>{format(new Date(activity.activity_date), "PPP")}</TableCell>
                    <TableCell>{activity.grade || "-"}</TableCell>
                    <TableCell>
                      {activity.duration_minutes ? `${activity.duration_minutes} min` : "-"}
                    </TableCell>
                    <TableCell>{activity.users?.username}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActivityMutation.mutate(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default Activities;