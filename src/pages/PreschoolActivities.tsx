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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Camera, Video, Star } from "lucide-react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Activity = Tables<'activities'>;
type StudentActivity = Tables<'student_activities'>;
type Student = Tables<'students'>;

const activityTypes = [
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "play", label: "Play" },
  { value: "fine_motor", label: "Fine Motor" },
  { value: "gross_motor", label: "Gross Motor" },
  { value: "other", label: "Other" },
];

export default function PreschoolActivities() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<StudentActivity | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const [studentId, setStudentId] = useState("");
  const [activityType, setActivityType] = useState<string>("play");
  const [description, setDescription] = useState("");
  const [activityDate, setActivityDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [involvementRating, setInvolvementRating] = useState<number | null>(null);

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-activities", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade")
        .eq("center_id", user.center_id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch activity types for the center
  const { data: activityTypesFromDb = [] } = useQuery({
    queryKey: ["activity-types", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("center_id", user.center_id)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["preschool-activities", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("student_activities")
        .select("*, students(name, grade), activities(title, description, activity_date, photo_url, video_url, activity_type_id)")
        .eq("students.center_id", user.center_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  const resetForm = () => {
    setStudentId("");
    setActivityType("");
    setDescription("");
    setActivityDate(format(new Date(), "yyyy-MM-dd"));
    setPhoto(null);
    setVideo(null);
    setInvolvementRating(null);
    setEditingActivity(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const uploadFile = async (fileToUpload: File, bucket: string) => {
    const fileExt = fileToUpload.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileToUpload);
    if (uploadError) throw uploadError;
    return fileName;
  };

  const createActivityMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id || !studentId || !activityType) throw new Error("Center ID, Student, or Activity Type not found");

      let photoUrl: string | null = null;
      let videoUrl: string | null = null;

      if (photo) photoUrl = await uploadFile(photo, "activity-photos");
      if (video) videoUrl = await uploadFile(video, "activity-videos");

      // Get the activity type from DB or use the first one
      let selectedActivityTypeId = activityType;
      
      // If activityTypesFromDb exists, find matching type or use first one
      if (activityTypesFromDb.length > 0) {
        const matchingType = activityTypesFromDb.find(at => at.name.toLowerCase() === activityType.toLowerCase());
        selectedActivityTypeId = matchingType?.id || activityTypesFromDb[0].id;
      }

      // First create the activity
      const { data: activity, error: activityError } = await supabase.from("activities").insert({
        center_id: user.center_id,
        title: activityType,
        description,
        activity_date: activityDate,
        photo_url: photoUrl,
        video_url: videoUrl,
        activity_type_id: selectedActivityTypeId,
        created_by: user.id,
      }).select().single();
      if (activityError) throw activityError;

      // Then create student_activity record
      const { error: saError } = await supabase.from("student_activities").insert({
        student_id: studentId,
        activity_id: activity.id,
        involvement_score: involvementRating,
      });
      if (saError) throw saError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preschool-activities"] });
      toast.success("Activity logged successfully!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to log activity");
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async () => {
      if (!editingActivity || !user?.center_id || !studentId) throw new Error("Activity, Center ID or Student not found");

      const { error } = await supabase.from("student_activities").update({
        student_id: studentId,
        involvement_score: involvementRating,
      }).eq("id", editingActivity.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preschool-activities"] });
      toast.success("Activity updated successfully!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update activity");
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preschool-activities"] });
      toast.success("Activity deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete activity");
    },
  });

  const handleEditClick = (activity: any) => {
    setEditingActivity(activity);
    setStudentId(activity.student_id);
    setActivityType(activity.activities?.title || "");
    setDescription(activity.activities?.description || "");
    setActivityDate(activity.activities?.activity_date || format(new Date(), "yyyy-MM-dd"));
    setPhoto(null);
    setVideo(null);
    setInvolvementRating(activity.involvement_score);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingActivity) {
      updateActivityMutation.mutate();
    } else {
      createActivityMutation.mutate();
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (rating === null) return "N/A";
    return Array(rating).fill("⭐").join("");
  };

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();
  const filteredActivities = gradeFilter === "all" ? activities : activities.filter((act: any) => {
    const studentGrade = students.find(s => s.id === act.student_id)?.grade;
    return studentGrade === gradeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Preschool Activities</h1>
        <div className="flex gap-2 items-center">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Log Activity</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingActivity ? "Edit Activity" : "Log New Activity"}</DialogTitle>
              <DialogDescription>
                {editingActivity ? "Update the details of this preschool activity." : "Record a new preschool activity for a student."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - {s.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityType">Activity Type *</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Activity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What did the child do?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityDate">Date *</Label>
                <Input id="activityDate" type="date" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Upload Photo (Optional)</Label>
                <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
                {editingActivity && (editingActivity as any).activities?.photo_url && !photo && (
                  <p className="text-sm text-muted-foreground">Current photo attached</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="video">Upload Video (Optional)</Label>
                <Input id="video" type="file" accept="video/*" onChange={handleVideoChange} />
                {editingActivity && (editingActivity as any).activities?.video_url && !video && (
                  <p className="text-sm text-muted-foreground">Current video attached</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="involvementRating">Child Involvement Rating (1-5, Optional)</Label>
                <Input
                  id="involvementRating"
                  type="number"
                  min="1"
                  max="5"
                  value={involvementRating || ""}
                  onChange={(e) => setInvolvementRating(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 4"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!studentId || !activityType || !description || !activityDate || createActivityMutation.isPending || updateActivityMutation.isPending}
                className="w-full"
              >
                {editingActivity ? (updateActivityMutation.isPending ? "Updating..." : "Update Activity") : (createActivityMutation.isPending ? "Logging..." : "Log Activity")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Preschool Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading activities...</p>
          ) : filteredActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No preschool activities found for the selected grade.</p>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity: any) => (
                <div key={activity.id} className="border rounded-lg p-4 flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg">{activity.students?.name} - {activity.activities?.title || 'Activity'}</h3>
                    <p className="text-sm text-muted-foreground">Date: {activity.activities?.activity_date ? format(new Date(activity.activities.activity_date), "PPP") : 'N/A'}</p>
                    <p className="text-sm">{activity.activities?.description || 'No description'}</p>
                    {activity.involvement_score && (
                      <p className="text-sm flex items-center gap-1">
                        Involvement: {getRatingStars(activity.involvement_score)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {activity.activities?.photo_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={supabase.storage.from("activity-photos").getPublicUrl(activity.activities.photo_url).data.publicUrl} target="_blank" rel="noopener noreferrer">
                            <Camera className="h-4 w-4 mr-1" /> Photo
                          </a>
                        </Button>
                      )}
                      {activity.activities?.video_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={supabase.storage.from("activity-videos").getPublicUrl(activity.activities.video_url).data.publicUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-1" /> Video
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(activity)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteActivityMutation.mutate(activity.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}