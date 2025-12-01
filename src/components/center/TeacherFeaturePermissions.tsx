import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth to get the user's access token
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { DialogDescription } from '@/components/ui/dialog'; // Import DialogDescription

type Teacher = Tables<'teachers'>;
type TeacherFeaturePermission = Tables<'teacher_feature_permissions'>;

const TEACHER_FEATURES = [
  { name: 'take_attendance', label: 'Take Attendance' },
  { name: 'lesson_tracking', label: 'Lesson Tracking' },
  { name: 'homework_management', label: 'Homework Management' },
  { name: 'preschool_activities', label: 'Preschool Activities' },
  { name: 'discipline_issues', label: 'Discipline Issues' },
  { name: 'test_management', label: 'Test Management' },
  { name: 'student_report_access', label: 'Student Report Access' },
];

export default function TeacherFeaturePermissions({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch center's feature permissions (to show which features are available)
  const { data: centerPermissions = [], isLoading: centerPermissionsLoading } = useQuery({
    queryKey: ['center-feature-permissions', user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from('center_feature_permissions')
        .select('*')
        .eq('center_id', user.center_id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch teacher's feature permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['teacher-feature-permissions', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_feature_permissions')
        .select('*')
        .eq('teacher_id', teacherId);
      if (error) throw error;
      return data as TeacherFeaturePermission[];
    },
    enabled: !!teacherId,
  });

  // Group center permissions
  const centerPermissionsByFeature = centerPermissions.reduce((acc, perm) => {
    acc[perm.feature_name] = perm.is_enabled;
    return acc;
  }, {} as Record<string, boolean>);

  // Group teacher permissions
  const permissionsByFeature = permissions.reduce((acc, perm) => {
    acc[perm.feature_name] = perm.is_enabled;
    return acc;
  }, {} as Record<string, boolean>);

  // Mutation to update feature permission via Edge Function
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ featureName, isEnabled }: { featureName: string; isEnabled: boolean }) => {
      const { data, error } = await supabase.functions.invoke('center-toggle-teacher-feature', {
        body: { teacherId, featureName, isEnabled },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession())?.data.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to update permission via Edge Function');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-feature-permissions', teacherId] });
      toast.success('Teacher feature permission updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update teacher feature permission');
    },
  });

  const handleToggle = (featureName: string, currentStatus: boolean) => {
    updatePermissionMutation.mutate({ featureName, isEnabled: !currentStatus });
  };

  if (permissionsLoading || centerPermissionsLoading) {
    return <p>Loading teacher permissions...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Features for {teacherName}</CardTitle>
        <DialogDescription>
          Enable or disable specific features for this teacher.
        </DialogDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead className="text-center">Admin Enabled</TableHead>
              <TableHead className="text-center">Teacher Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TEACHER_FEATURES.map(feature => {
              const centerEnabled = centerPermissionsByFeature[feature.name] ?? true;
              const teacherEnabled = permissionsByFeature[feature.name] ?? true;
              const isDisabledByCenter = !centerEnabled;
              
              return (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium">{feature.label}</TableCell>
                  <TableCell className="text-center">
                    {centerEnabled ? (
                      <span className="text-green-600 font-medium">✓ Yes</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={teacherEnabled}
                      onCheckedChange={() => handleToggle(feature.name, teacherEnabled)}
                      disabled={updatePermissionMutation.isPending || isDisabledByCenter}
                      title={isDisabledByCenter ? 'Feature not enabled by admin for this center' : ''}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-4">
          Note: Teachers can only access features that are enabled by both Admin and your Center.
        </p>
      </CardContent>
    </Card>
  );
}