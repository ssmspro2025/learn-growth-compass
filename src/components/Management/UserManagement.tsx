import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useSchools } from '@/hooks/useSchools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, UserPlus, Mail, Phone, Calendar, MapPin, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserManagement() {
  const { users, loading, error, createUser, updateUser } = useUsers();
  const { schools } = useSchools();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'vendor';
    school_id: string;
    phone: string;
    date_of_birth: string;
    address: string;
  }>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'teacher',
    school_id: '',
    phone: '',
    date_of_birth: '',
    address: '',
  });

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'teacher',
      school_id: '',
      phone: '',
      date_of_birth: '',
      address: '',
    });
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const userData = {
      ...formData,
      tenant_id: '00000000-0000-0000-0000-000000000000', // Default tenant for now
      status: 'active' as const,
    };

    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, userData);
    } else {
      result = await createUser(userData);
    }

    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: editingUser ? "User updated successfully" : "User created successfully",
      });
      setOpen(false);
      resetForm();
    }

    setIsCreating(false);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      school_id: user.school_id || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      address: user.address || '',
    });
    setOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'principal': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-yellow-100 text-yellow-800';
      case 'parent': return 'bg-orange-100 text-orange-800';
      case 'vendor': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading users: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage users across all schools</p>
        </div>
        
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information' : 'Add a new user to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value: 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'vendor') => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_id">School</Label>
                  <Select value={formData.school_id} onValueChange={(value) => setFormData(prev => ({ ...prev, school_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (editingUser ? "Updating..." : "Creating...") : (editingUser ? "Update User" : "Create User")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage users across all schools in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const school = schools.find(s => s.id === user.school_id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {school ? school.name : 'No school assigned'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.date_of_birth && (
                          <div className="text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.date_of_birth).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first user
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}