import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

const ActivityTypes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: ""
  });

  // Fetch activity types
  const { data: activityTypes = [] } = useQuery({
    queryKey: ["activity-types", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("center_id", user?.center_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  // Create activity type mutation
  const createTypeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("activity_types")
        .insert({
          ...typeForm,
          center_id: user?.center_id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity type created successfully");
      queryClient.invalidateQueries({ queryKey: ["activity-types"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create activity type");
    }
  });

  // Update activity type mutation
  const updateTypeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("activity_types")
        .update(typeForm)
        .eq("id", editingType.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity type updated successfully");
      queryClient.invalidateQueries({ queryKey: ["activity-types"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update activity type");
    }
  });

  // Delete activity type mutation
  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Activity type deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["activity-types"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete activity type");
    }
  });

  const resetForm = () => {
    setTypeForm({
      name: "",
      description: ""
    });
    setEditingType(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (editingType) {
      updateTypeMutation.mutate();
    } else {
      createTypeMutation.mutate();
    }
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      description: type.description || ""
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activity Types</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Edit Activity Type" : "Add New Activity Type"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  placeholder="Enter activity type name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingType ? "Update Type" : "Create Type"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Types List</CardTitle>
        </CardHeader>
        <CardContent>
          {activityTypes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity types found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityTypes.map((type: any) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTypeMutation.mutate(type.id)}
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

export default ActivityTypes;