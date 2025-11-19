import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Shield, Power, PowerOff, Edit } from 'lucide-react';

const menuItems = [
  'Dashboard',
  'Register Student',
  'Take Attendance',
  'Attendance Summary',
  'Chapters Tracking',
  'Tests',
  'Student Report',
  'AI Insights',
  'View Records',
  'Summary',
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [editedCenterData, setEditedCenterData] = useState({ centerName: '', address: '' });
  const [newCenter, setNewCenter] = useState({
    centerName: '', address: '', contactNumber: '', username: '', password: ''
  });

  const [menuVisibility, setMenuVisibility] = useState<{ [key: string]: { [menu: string]: boolean } }>({});

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Fetch all centers
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['centers-with-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centers')
        .select('*, users(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Initialize menuVisibility state when centers load
  useState(() => {
    if (centers.length > 0) {
      const initialVisibility: any = {};
      centers.forEach(center => {
        if (!menuVisibility[center.id]) {
          initialVisibility[center.id] = menuItems.reduce((acc, item) => {
            acc[item] = true; // default all menus visible
            return acc;
          }, {} as { [key: string]: boolean });
        }
      });
      setMenuVisibility(prev => ({ ...initialVisibility, ...prev }));
    }
  });

  // Create center mutation
  const createCenterMutation = useMutation({
    mutationFn: async () => {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('admin-create-center', { body: newCenter });
      if (functionError) throw functionError;
      if (!functionData.success) throw new Error(functionData.error);
      return functionData;
    },
    onSuccess: () => {
      toast({ title: 'Center created', description: 'New center has been created successfully' });
      setIsCreateDialogOpen(false);
      setNewCenter({ centerName: '', address: '', contactNumber: '', username: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['centers-with-users'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create center', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from('users').update({ is_active: !isActive }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Status updated', description: 'User status has been updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['centers-with-users'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    },
  });

  // Update center mutation
  const updateCenterMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('centers').update({
        center_name: editedCenterData.centerName,
        address: editedCenterData.address
      }).eq('id', editingCenter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Center updated', description: 'Center details have been updated successfully' });
      setIsEditDialogOpen(false);
      setEditingCenter(null);
      queryClient.invalidateQueries({ queryKey: ['centers-with-users'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update center', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateCenter = () => {
    if (!newCenter.centerName || !newCenter.username || !newCenter.password) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    createCenterMutation.mutate();
  };

  const handleOpenEditDialog = (center: any) => {
    setEditingCenter(center);
    setEditedCenterData({ centerName: center.center_name, address: center.address || '' });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCenter = () => {
    if (!editedCenterData.centerName) {
      toast({ title: 'Missing fields', description: 'Center name is required', variant: 'destructive' });
      return;
    }
    updateCenterMutation.mutate();
  };

  const toggleMenu = (centerId: string, menu: string) => {
    setMenuVisibility(prev => ({
      ...prev,
      [centerId]: {
        ...prev[centerId],
        [menu]: !prev[centerId][menu]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>

          {/* Create Center */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create Center</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Center</DialogTitle>
                <DialogDescription>Add a new tuition center with login credentials</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Center Name *</Label>
                  <Input value={newCenter.centerName} onChange={e => setNewCenter({ ...newCenter, centerName: e.target.value })} placeholder="Enter center name"/>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={newCenter.address} onChange={e => setNewCenter({ ...newCenter, address: e.target.value })} placeholder="Enter address"/>
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input value={newCenter.contactNumber} onChange={e => setNewCenter({ ...newCenter, contactNumber: e.target.value })} placeholder="Enter contact number"/>
                </div>
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input value={newCenter.username} onChange={e => setNewCenter({ ...newCenter, username: e.target.value })} placeholder="Enter username"/>
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={newCenter.password} onChange={e => setNewCenter({ ...newCenter, password: e.target.value })} placeholder="Enter password"/>
                </div>
                <Button onClick={handleCreateCenter} className="w-full">{createCenterMutation.isPending ? 'Creating...' : 'Create Center'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Center */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Center</DialogTitle>
              <DialogDescription>Update center name and address</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label>Center Name *</Label>
              <Input value={editedCenterData.centerName} onChange={e => setEditedCenterData({ ...editedCenterData, centerName: e.target.value })}/>
              <Label>Address</Label>
              <Input value={editedCenterData.address} onChange={e => setEditedCenterData({ ...editedCenterData, address: e.target.value })}/>
              <Button onClick={handleUpdateCenter} className="w-full">{updateCenterMutation.isPending ? 'Updating...' : 'Update Center'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Centers Table */}
        <Card>
          <CardHeader><CardTitle>All Centers</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading centers...</p>
            ) : centers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No centers registered yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Center Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Menus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centers.map(center => {
                    const centerUser = center.users?.[0];
                    return (
                      <TableRow key={center.id}>
                        <TableCell>{center.center_name}</TableCell>
                        <TableCell>{center.address || '-'}</TableCell>
                        <TableCell>{center.contact_number || '-'}</TableCell>
                        <TableCell>{centerUser?.username || '-'}</TableCell>
                        <TableCell>{centerUser?.last_login ? new Date(centerUser.last_login).toLocaleDateString() : 'Never'}</TableCell>
                        <TableCell>{centerUser?.is_active ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(center)}><Edit className="h-4 w-4 mr-1"/> Edit</Button>
                            {centerUser && (
                              <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate({ userId: centerUser.id, isActive: centerUser.is_active })}>
                                {centerUser.is_active ? <><PowerOff className="h-4 w-4 mr-1"/> Deactivate</> : <><Power className="h-4 w-4 mr-1"/> Activate</>}
                              </Button>
                            )}
                          </div>
                        </TableCell>

                        {/* Menu visibility toggles */}
                        <TableCell>
                          <div className="flex flex-col space-y-1 max-h-64 overflow-y-auto">
                            {menuItems.map(menu => (
                              <div key={menu} className="flex items-center justify-between">
                                <span className="text-sm">{menu}</span>
                                <input
                                  type="checkbox"
                                  checked={menuVisibility[center.id]?.[menu] ?? true}
                                  onChange={() => toggleMenu(center.id, menu)}
                                />
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
