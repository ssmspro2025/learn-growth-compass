import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Calendar
} from "lucide-react";

export function AdminDashboard() {
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
          <Button variant="outline">Export Report</Button>
          <Button variant="gradient">Generate Insights</Button>
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
                  <Badge className={getStatusColor(school.status)}>
                    {school.status.replace('_', ' ')}
                  </Badge>
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
                  <Button size="sm" variant="warning" className="mt-2">
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
                  <Button size="sm" variant="destructive" className="mt-2">
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
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <Users className="h-8 w-8" />
              <span className="text-sm">Add User</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <School className="h-8 w-8" />
              <span className="text-sm">New School</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-sm">Curriculum</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <Calendar className="h-8 w-8" />
              <span className="text-sm">Academic Year</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}