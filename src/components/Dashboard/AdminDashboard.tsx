import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  School,
  BookOpen,
  Award,
  Calendar,
  Plus,
  Download,
  Eye,
  BarChart3
} from "lucide-react";

export function AdminDashboard() {
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const schools = [
    { name: "Lincoln Elementary", students: 485, teachers: 32, performance: 85, status: "excellent" },
    { name: "Washington Middle", students: 678, teachers: 45, performance: 78, status: "good" },
    { name: "Roosevelt High", students: 892, teachers: 67, performance: 92, status: "excellent" },
    { name: "Jefferson Academy", students: 234, teachers: 18, performance: 65, status: "needs_attention" }
  ];

  const kpis = [
    { title: "Total Students", value: "2,289", change: "+5.2%", trend: "up", icon: GraduationCap },
    { title: "Total Teachers", value: "162", change: "+2.1%", trend: "up", icon: Users },
    { title: "Revenue (YTD)", value: "$2.4M", change: "+8.7%", trend: "up", icon: DollarSign },
    { title: "Avg Performance", value: "80%", change: "-1.2%", trend: "down", icon: TrendingUp }
  ];

  const performanceData = [
    { month: "Jan", lincoln: 82, washington: 75, roosevelt: 88, jefferson: 62 },
    { month: "Feb", lincoln: 84, washington: 77, roosevelt: 89, jefferson: 64 },
    { month: "Mar", lincoln: 85, washington: 78, roosevelt: 92, jefferson: 65 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 185000, expenses: 145000 },
    { month: "Feb", revenue: 220000, expenses: 165000 },
    { month: "Mar", revenue: 240000, expenses: 175000 },
  ];

  const studentDistribution = [
    { name: "Elementary", value: 719, color: "#8b5cf6" },
    { name: "Middle", value: 678, color: "#06b6d4" },
    { name: "High", value: 892, color: "#10b981" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-success text-success-foreground';
      case 'good': return 'bg-primary text-primary-foreground';
      case 'needs_attention': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Dashboard</h1>
          <p className="text-muted-foreground">Multi-school overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert('Exporting comprehensive report...')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={showInsights} onOpenChange={setShowInsights}>
            <DialogTrigger asChild>
              <Button variant="gradient">Generate Insights</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>AI-Generated Insights</DialogTitle>
                <DialogDescription>
                  Comprehensive analysis of your school network performance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="roosevelt" stroke="#10b981" strokeWidth={2} />
                          <Line type="monotone" dataKey="lincoln" stroke="#8b5cf6" strokeWidth={2} />
                          <Line type="monotone" dataKey="washington" stroke="#06b6d4" strokeWidth={2} />
                          <Line type="monotone" dataKey="jefferson" stroke="#f59e0b" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#10b981" />
                          <Bar dataKey="expenses" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Key Recommendations:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Roosevelt High shows excellent performance - consider sharing best practices</li>
                    <li>Jefferson Academy needs immediate attention - schedule intervention meeting</li>
                    <li>Revenue growth is strong at 8.7% - consider expanding programs</li>
                    <li>Teacher retention rate improved by 15% - staff satisfaction initiatives working</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="shadow-card hover:shadow-primary transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={kpi.trend === 'up' ? 'text-success' : 'text-destructive'}>
                  {kpi.change}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schools Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Schools Performance
            </CardTitle>
            <CardDescription>
              Overview of all schools in the network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schools.map((school) => (
              <div key={school.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{school.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {school.students} students • {school.teachers} teachers
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{school.performance}%</div>
                    <Progress value={school.performance} className="w-20" />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{school.name} - Detailed View</DialogTitle>
                        <DialogDescription>
                          Comprehensive school performance analytics
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="text-2xl font-bold">{school.students}</div>
                            <div className="text-sm text-muted-foreground">Total Students</div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="text-2xl font-bold">{school.teachers}</div>
                            <div className="text-sm text-muted-foreground">Teachers</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Academic Performance</span>
                            <span className="font-medium">{school.performance}%</span>
                          </div>
                          <Progress value={school.performance} />
                        </div>
                        <Badge className={getStatusColor(school.status)}>
                          {school.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts & Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
            <CardDescription>
              Issues requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-warning">Low Attendance Alert</div>
                  <div className="text-sm text-muted-foreground">
                    Jefferson Academy: 15% below target this week
                  </div>
                   <Button 
                    size="sm" 
                    variant="warning" 
                    className="mt-2"
                    onClick={() => alert('Opening detailed attendance report for Jefferson Academy...')}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-destructive">Fee Collection</div>
                  <div className="text-sm text-muted-foreground">
                    $45,000 outstanding across 3 schools
                  </div>
                   <Button 
                    size="sm" 
                    variant="destructive" 
                    className="mt-2"
                    onClick={() => alert('Generating fee collection report for all schools...')}
                  >
                    Generate Report
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-success">Compliance Update</div>
                  <div className="text-sm text-muted-foreground">
                    All schools completed safety audit
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening user management wizard...')}
            >
              <Users className="h-8 w-8" />
              <span className="text-sm">Add User</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening new school setup...')}
            >
              <School className="h-8 w-8" />
              <span className="text-sm">New School</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening curriculum editor...')}
            >
              <BookOpen className="h-8 w-8" />
              <span className="text-sm">Curriculum</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening academic year configuration...')}
            >
              <Calendar className="h-8 w-8" />
              <span className="text-sm">Academic Year</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Student Distribution
            </CardTitle>
            <CardDescription>
              Students across different school levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={studentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {studentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
            <CardDescription>
              Performance trends across all schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="roosevelt" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="lincoln" stroke="#8b5cf6" strokeWidth={3} />
                <Line type="monotone" dataKey="washington" stroke="#06b6d4" strokeWidth={3} />
                <Line type="monotone" dataKey="jefferson" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}