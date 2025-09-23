import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  School, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Settings,
  BookOpen,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useSchools } from '@/hooks/useSchools';
import { useUsers } from '@/hooks/useUsers';
import { SchoolManagement } from '@/components/Management/SchoolManagement';
import { UserManagement } from '@/components/Management/UserManagement';

export function AdminDashboard() {
  const { schools, loading: schoolsLoading } = useSchools();
  const { users, loading: usersLoading } = useUsers();
  const [activeTab, setActiveTab] = useState('overview');

  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalParents = users.filter(u => u.role === 'parent').length;
  const totalUsers = users.length;
  const totalSchools = schools.length;

  // Sample performance data - in real app, fetch from database
  const performanceData = [
    { month: 'Jan', performance: 85, attendance: 92 },
    { month: 'Feb', performance: 88, attendance: 94 },
    { month: 'Mar', performance: 86, attendance: 91 },
    { month: 'Apr', performance: 90, attendance: 95 },
    { month: 'May', performance: 87, attendance: 93 },
    { month: 'Jun', performance: 92, attendance: 96 },
  ];

  const enrollmentData = [
    { name: 'Elementary', value: Math.round(totalStudents * 0.4), color: '#8884d8' },
    { name: 'Middle School', value: Math.round(totalStudents * 0.3), color: '#82ca9d' },
    { name: 'High School', value: Math.round(totalStudents * 0.3), color: '#ffc658' },
  ];

  if (schoolsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all schools and system-wide performance
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across {totalSchools} schools
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTeachers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Active teaching staff
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Schools</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSchools}</div>
                <p className="text-xs text-muted-foreground">
                  Active schools
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalParents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Registered parents
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance & Attendance Trends</CardTitle>
                <CardDescription>
                  Monthly performance and attendance rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="performance" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Performance (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Attendance (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Enrollment Distribution</CardTitle>
                <CardDescription>
                  Distribution across grade levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={enrollmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {enrollmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* School Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Schools Overview</CardTitle>
              <CardDescription>
                Quick overview of all schools in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schools.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {schools.map((school) => (
                    <div key={school.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{school.name}</h3>
                        <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                          {school.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{school.grade_range}</p>
                      <div className="flex justify-between text-sm">
                        <span>Students: {school.current_enrollment}</span>
                        <span>Type: {school.school_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No schools configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first school to get started
                  </p>
                  <Button onClick={() => setActiveTab('schools')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create School
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Important notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {totalSchools === 0 && (
                  <div className="flex items-center space-x-3 p-3 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium">No schools configured</p>
                      <p className="text-sm text-muted-foreground">
                        Create your first school to get started
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab('schools')} size="sm">
                      Create School
                    </Button>
                  </div>
                )}
                {totalUsers === 1 && ( // Only super admin exists
                  <div className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">No users configured</p>
                      <p className="text-sm text-muted-foreground">
                        Add teachers, students, and other users to begin
                      </p>
                    </div>
                    <Button onClick={() => setActiveTab('users')} size="sm">
                      Add Users
                    </Button>
                  </div>
                )}
                {totalSchools > 0 && totalUsers > 1 && (
                  <div className="flex items-center space-x-3 p-3 border border-green-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">System is operational</p>
                      <p className="text-sm text-muted-foreground">
                        All systems running normally
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools">
          <SchoolManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Settings Panel</h3>
                <p className="text-muted-foreground">
                  System configuration options will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}