import { useState } from 'react';
import { useSchools } from '@/hooks/useSchools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, School, Users, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SchoolManagement() {
  const { schools, loading, error, createSchool } = useSchools();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    school_type: 'public',
    grade_range: 'K-12',
    student_capacity: 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const { error } = await createSchool({
      ...formData,
      status: 'active',
      current_enrollment: 0,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "School created successfully",
      });
      setOpen(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        school_type: 'public',
        grade_range: 'K-12',
        student_capacity: 1000,
      });
    }

    setIsCreating(false);
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
          <p className="text-destructive">Error loading schools: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School Management</h2>
          <p className="text-muted-foreground">Manage schools in your system</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create School
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New School</DialogTitle>
              <DialogDescription>
                Add a new school to the system. Fill in all required information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_type">School Type</Label>
                  <Select value={formData.school_type} onValueChange={(value) => setFormData(prev => ({ ...prev, school_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="charter">Charter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade_range">Grade Range</Label>
                  <Select value={formData.grade_range} onValueChange={(value) => setFormData(prev => ({ ...prev, grade_range: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="K-5">K-5 (Elementary)</SelectItem>
                      <SelectItem value="6-8">6-8 (Middle)</SelectItem>
                      <SelectItem value="9-12">9-12 (High)</SelectItem>
                      <SelectItem value="K-12">K-12 (All Grades)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Student Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.student_capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_capacity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create School"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <School className="h-5 w-5 text-primary" />
                <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                  {school.status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{school.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {school.address}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{school.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>{school.email}</span>
                </div>
                {school.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{school.current_enrollment}</span>
                  {school.student_capacity && (
                    <span className="text-muted-foreground">/ {school.student_capacity}</span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Badge variant="outline">{school.school_type}</Badge>
                  <Badge variant="outline">{school.grade_range}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schools found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first school
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create School
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}