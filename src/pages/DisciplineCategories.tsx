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
import { Plus, Edit, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const DisciplineCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    default_severity: "minor",
    is_active: true
  });

  // Fetch discipline categories
  const { data: categories = [] } = useQuery({
    queryKey: ["discipline-categories", user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipline_categories")
        .select("*")
        .eq("center_id", user?.center_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  // Create discipline category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("discipline_categories")
        .insert({
          ...categoryForm,
          center_id: user?.center_id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Discipline category created successfully");
      queryClient.invalidateQueries({ queryKey: ["discipline-categories"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create discipline category");
    }
  });

  // Update discipline category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("discipline_categories")
        .update(categoryForm)
        .eq("id", editingCategory.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Discipline category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["discipline-categories"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update discipline category");
    }
  });

  // Delete discipline category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("discipline_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Discipline category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["discipline-categories"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete discipline category");
    }
  });

  const resetForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      default_severity: "minor",
      is_active: true
    });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate();
    } else {
      createCategoryMutation.mutate();
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      default_severity: category.default_severity || "minor",
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discipline Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_severity">Default Severity</Label>
                <Select
                  value={categoryForm.default_severity}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, default_severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discipline Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No discipline categories found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>
                      <span className="capitalize">{category.default_severity || "minor"}</span>
                    </TableCell>
                    <TableCell>
                      {category.is_active ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
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

export default DisciplineCategories;